const questions = [
    {
    question: "1. What sleep issues are you currently experiencing?",
        options: [
            "Can't fall asleep",
            "Can't stay asleep",
            "Wake up multiple times",
            "Stressful dreams"
        ]
    },
    {
        question: "2. Rate your difficulty in falling asleep in the past week:",
        options: [
            "None",
            "Mild",
            "Moderate",
            "Severe",
            "Very Severe"
        ]
    },
    {
        question: "3. Rate your difficulty in staying asleep in the past week:",
        options: [
            "None",
            "Mild",
            "Moderate",
            "Severe",
            "Very Severe"
        ]
    },
    {
        question: "4. Rate your problems with waking up too early in the past week:",
        options: [
            "None",
            "Mild",
            "Moderate",
            "Severe",
            "Very Severe"
        ]
    },
    {
        question: "5. How satisfied/dissatisfied are you with your sleep pattern in the last 2 weeks?",
        options: [
            "Very Satisfied",
            "Satisfied",
            "Moderately Satisfied",
            "Dissatisfied",
            "Very Dissatisfied"
        ]
    },
    {
        question: "6. How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?",
        options: [
            "Not at all Noticeable",
            "A Little",
            "Somewhat",
            "Much",
            "Very Much Noticeable"
        ]
    },
    {
        question: "7. How worried/distressed are you about your current sleep problem?",
        options: [
            "Not at all Worried",
            "A Little",
            "Somewhat",
            "Much",
            "Very Much Worried"
        ]
    },
    {
        question: "8. What is your age?",
        options: [
            "20s",
            "30s",
            "40s",
            "50s"
        ]
    },
    {
        question: "9. What sex best describes you?",
        options: [
            "Male",
            "Female",
            "Other"
        ]
    },
    {
        question: "10. How long does it take you to fall asleep on an average night? (in minutes)",
        input: "number"
    },
    {
        question: "11. How much time do you spend in bed on a typical night, including the time you are awake? (in hours)",
        input: "number"
    },
    {
        question: "12. How much time do you spend in bed on a typical night? (in hours)",
        input: "number"
    },
    {
        question: "13. Have you tried using prescription meds/pills for insomnia?",
        options: [
            "Yes",
            "No"
        ]
    }
];

let currentQuestionIndex = 0;
let answers = [];

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById("progress").style.width = `${progress}%`;
}

function loadQuestion() {
    updateProgress();
    const currentQuestion = questions[currentQuestionIndex];
    document.getElementById("question").innerText = currentQuestion.question;
    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    if (currentQuestion.input) {
        const inputField = document.createElement("input");
        inputField.type = currentQuestion.input;
        inputField.placeholder = "Enter your answer";
        inputField.required = true;
        optionsContainer.appendChild(inputField);
    } else {
        currentQuestion.options.forEach(option => {
            const optionDiv = document.createElement("div");
            optionDiv.innerHTML = `<input type="radio" name="option" value="${option}" required> ${option}`;
            optionsContainer.appendChild(optionDiv);
        });
    }

    document.getElementById("back-button").style.display = currentQuestionIndex > 0 ? "block" : "none";
}

document.getElementById("next-button").addEventListener("click", () => {
    const selectedOption = document.querySelector('input[name="option"]:checked');
    const inputField = document.querySelector('input[type="number"]');

    if (selectedOption) {
        answers.push(selectedOption.value);
    } else if (inputField) {
        answers.push(inputField.value);
    } else {
        alert("Please select an option or enter a value!");
        return;
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showSummary();
    }
});

document.getElementById("back-button").addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        answers.pop(); 
        loadQuestion();
    }
});

function showSummary() {
    document.getElementById("question-container").style.display = "none";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("back-button").style.display = "none";
    const resultContainer = document.getElementById("result");
    let summary = "<h2>Your Sleep Summary:</h2><ul>";
    
    questions.forEach((question, index) => {
        summary += `<li><strong>${question.question}</strong>: ${answers[index]}</li>`;
    });
    
    summary += "</ul>";
    resultContainer.innerHTML = summary;
    resultContainer.style.display = "block";
    sendResultsToAPI();
}

async function sendResultsToAPI() {
    const API_KEY = 'AIzaSyDT40xHO3ZSktJ-bInpfl0IS7U2xzKA4v4'; 
    const prompt = `Based on the following sleep quiz responses, provide a concise recommendation for improving sleep: ${JSON.stringify(answers)}`;

    console.log('Sending prompt to Gemini API:', prompt);
    document.getElementById("loading").style.display = "block";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage = `API error ${response.status}: ${errorData.error.message}`;
                }
            } catch (jsonError) {
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('API Response:', data);

        const recommendation = data.candidates?.[0]?.content?.parts?.[0]?.text 
                                || data.text 
                                || 'No recommendation found';
        if (!recommendation || recommendation === 'No recommendation found') {
            throw new Error("API returned no recommendation.");
        }
        displayRecommendation(recommendation);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Request timed out:', error);
            displayRecommendation("Error: The request timed out. Please try again later.");
        } else {
            console.error('Error calling Gemini API:', error);
            displayRecommendation(`Error: ${error.message || 'Unknown error'}`);
        }
    } finally {
        document.getElementById("loading").style.display = "none";
    }
}

function displayRecommendation(recommendation) {
    const recommendationContainer = document.getElementById("recommendation");
    document.getElementById("recommendation-text").innerText = recommendation;
    recommendationContainer.style.display = "block";
}

function retryQuiz() {
    currentQuestionIndex = 0;
    answers = [];
    document.getElementById("question-container").style.display = "block";
    document.getElementById("next-button").style.display = "block";
    document.getElementById("back-button").style.display = "none";
    document.getElementById("result").style.display = "none";
    document.getElementById("recommendation").style.display = "none";
    loadQuestion();
}

function shareResults() {
    const shareText = `Check out my sleep recommendations from NeuroNap: ${document.getElementById("recommendation-text").textContent}\nhttps://yourwebsite.com/quiz`;
    if (navigator.share) {
        navigator.share({
            title: 'NeuroNap Sleep Recommendations',
            text: shareText,
            url: 'https://yourwebsite.com/quiz'
        }).catch(error => console.error('Error sharing:', error));
    } else {
        alert('Copy this link to share: ' + shareText);
        navigator.clipboard.writeText(shareText).then(() => console.log('Text copied to clipboard'));
    }
}

loadQuestion();