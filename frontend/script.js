const API = "http://127.0.0.1:5000";

// 🔐 USER
const user_id = localStorage.getItem("user_id");

if (!user_id) {
    alert("Please login first");
    window.location.href = "login.html";
}

// ==============================
// ➕ ADD TASK
// ==============================
function addTask() {
    const title = document.getElementById("title").value;
    const deadline = document.getElementById("deadline").value;
    const importance = document.getElementById("importance").value;

    if (!title || !deadline || !importance) {
        alert("Fill all fields");
        return;
    }

    fetch(API + "/add-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id,
            title,
            deadline: deadline.replace("T", " ") + ":00",
            importance: parseInt(importance)
        })
    })
    .then(() => {
        alert("Task Added ✅");
        loadTasks();

        document.getElementById("title").value = "";
        document.getElementById("deadline").value = "";
        document.getElementById("importance").value = "";
    });
}

// ==============================
// 📋 LOAD TASKS
// ==============================
function loadTasks() {
    fetch(API + "/tasks?user_id=" + user_id)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById("taskList");
        list.innerHTML = "";

        data.forEach(task => {
            const li = document.createElement("li");

            li.innerHTML = `
                ${task.title} | Priority: ${task.priority.toFixed(2)}
                <button onclick="completeTask(${task.id})">✅</button>
            `;

            list.appendChild(li);
        });
    });

    loadStats();
}

// ==============================
// ✅ COMPLETE TASK
// ==============================
function completeTask(id) {
    fetch(API + "/complete/" + id, { method: "POST" })
    .then(() => loadTasks());
}

// ==============================
// 📊 STATS
// ==============================
function loadStats() {
    fetch(API + "/stats?user_id=" + user_id)
    .then(res => res.json())
    .then(data => {
        document.getElementById("stats").innerText =
            `Completed: ${data.completed}/${data.total} | Efficiency: ${data.efficiency}%`;
    });
}

// ==============================
// 🤖 AI SUGGESTION
// ==============================
function getNextTask() {
    fetch(API + "/next-task?user_id=" + user_id)
    .then(res => res.json())
    .then(task => {
        document.getElementById("output").innerHTML =
            `🤖 AI Suggestion:<br><strong>${task.title}</strong>`;
    });
}

// ==============================
// 🎤 VOICE AI
// ==============================
let recognition = null;

// START
function startAssistant() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true;

    recognition.start();
    speak("Assistant started. How can I help you?");

    recognition.onresult = function (event) {
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("User:", text);
        handleCommand(text);
    };

    recognition.onerror = function () {
        speak("Voice error occurred");
    };
}

// STOP
function stopAssistant() {
    if (recognition) {
        recognition.stop();
        recognition = null;
        speak("Assistant stopped");
    } else {
        alert("Assistant not running");
    }
}

// SPEAK
function speak(msg) {
    const speech = new SpeechSynthesisUtterance(msg);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}

// COMMAND HANDLER
function handleCommand(text) {

    // 🤖 NEXT TASK
    if (text.includes("what should i do")) {
        fetch(API + "/next-task?user_id=" + user_id)
        .then(res => res.json())
        .then(task => speak("You should focus on " + task.title));
        return;
    }

    // 📊 STATS
    if (text.includes("progress") || text.includes("stats")) {
        fetch(API + "/stats?user_id=" + user_id)
        .then(res => res.json())
        .then(data => speak(`You completed ${data.completed} tasks. Efficiency is ${data.efficiency} percent`));
        return;
    }

    // ➕ ADD TASK
    if (text.includes("tomorrow") || text.includes("today") || text.includes("add task")) {
        processVoiceTask(text);
        speak("Task added successfully");
        return;
    }

    // ⛔ STOP
    if (text.includes("stop")) {
        stopAssistant();
        return;
    }

    speak("Sorry, I didn't understand");
}

// PROCESS VOICE TASK
function processVoiceTask(text) {
    let importance = 3;
    let deadline = new Date();

    if (text.includes("tomorrow")) {
        deadline.setDate(deadline.getDate() + 1);
    }

    if (text.includes("urgent")) {
        importance = 5;
    }

    let timeMatch = text.match(/(\d{1,2}) ?(am|pm)/);

    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        let ampm = timeMatch[2];

        if (ampm === "pm" && hour !== 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;

        deadline.setHours(hour);
        deadline.setMinutes(0);
    }

    let formattedDeadline =
        deadline.getFullYear() + "-" +
        String(deadline.getMonth() + 1).padStart(2, "0") + "-" +
        String(deadline.getDate()).padStart(2, "0") + " " +
        String(deadline.getHours()).padStart(2, "0") + ":00:00";

    fetch(API + "/add-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id,
            title: text,
            deadline: formattedDeadline,
            importance
        })
    })
    .then(() => loadTasks());
}

// ==============================
// 🧠 NLP TASK
// ==============================
function addNLTask() {
    const text = document.getElementById("nlInput").value.toLowerCase();

    if (!text) return alert("Enter task");

    processVoiceTask(text);
    alert("Task added using AI");
    document.getElementById("nlInput").value = "";
}

// ==============================
// 📅 STUDY PLAN
// ==============================
function generatePlan() {

    const user_id = localStorage.getItem("user_id");
document.getElementById("mainUI").style.display = "none";
document.getElementById("planView").style.display = "block";
    
console.log("Generate Plan Clicked");

    console.log("User ID:", user_id);

    fetch("http://127.0.0.1:5000/study-plan?user_id=" + user_id)
    .then(res => res.json())
    .then(data => {
        console.log("Plan Data:", data);

        const table = document.getElementById("planTable");

        // CLEAR OLD
        table.innerHTML = `
            <tr>
                <th>Week</th>
                <th>Subject</th>
                <th>Task</th>
                <th>Deadline</th>
            </tr>
        `;

        data.forEach(item => {
            table.innerHTML += `
                <tr>
                    <td>${item.week}</td>
                    <td>${item.subject}</td>
                    <td>${item.task}</td>
                    <td>${item.deadline}</td>
                </tr>
            `;
        });
    })
    .catch(err => {
        console.log("ERROR:", err);
        alert("Plan failed");
    });
}

// ☰ MENU
function toggleMenu() {
    document.getElementById("menu").classList.toggle("active");
}

// 👤 PROFILE
function toggleProfile() {
    document.getElementById("profile").classList.toggle("active");
    loadProfile();
}

// 📊 LOAD PROFILE DATA
function loadProfile() {
    fetch(API + "/profile?user_id=" + user_id)
    .then(res => res.json())
    .then(data => {
        document.getElementById("p_name").innerText = "Name: " + data.username;
        document.getElementById("p_dob").innerText = "DOB: " + data.dob;
        document.getElementById("p_completed").innerText = "Completed: " + data.completed;
        document.getElementById("p_pending").innerText = "Pending: " + data.pending;
    });
}

// 📜 HISTORY (simple)
function viewHistory() {
    alert("Show completed tasks here");
}

// ==============================
// 🚪 LOGOUT
// ==============================
function logout() {
    localStorage.removeItem("user_id");
    window.location.href = "login.html";
}
function toggleMenu() {
    document.getElementById("menu").classList.toggle("active");
}

function toggleProfile() {
    const box = document.getElementById("profile");
    box.classList.toggle("active");

    const user_id = localStorage.getItem("user_id");

    console.log("User ID:", user_id); // DEBUG

    fetch("http://127.0.0.1:5000/profile?user_id=" + user_id)
    .then(res => res.json())
    .then(data => {
        console.log("Profile Data:", data); // DEBUG

        document.getElementById("p_name").innerText = "Name: " + data.username;
        document.getElementById("p_dob").innerText = "DOB: " + data.dob;
        document.getElementById("p_completed").innerText = "Completed: " + data.completed;
        document.getElementById("p_pending").innerText = "Pending: " + data.pending;
    })
    .catch(err => {
        console.log("ERROR:", err);
    });
}

function viewHistory() {
    alert("History feature coming");
}


function goBack() {
    document.getElementById("planView").style.display = "none";
    document.querySelector(".container").style.display = "block";
}
// ==============================
window.onload = loadTasks;