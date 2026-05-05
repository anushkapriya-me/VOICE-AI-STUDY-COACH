let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = sendAudio;
        mediaRecorder.start();

        isRecording = true;
        document.getElementById("mic-btn").classList.add("recording");
        document.getElementById("mic-btn").innerText = "⏹";
        document.getElementById("status").innerText = "Recording... press again to stop";
    } catch (err) {
        document.getElementById("status").innerText = "Microphone access denied!";
    }
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    document.getElementById("mic-btn").classList.remove("recording");
    document.getElementById("mic-btn").classList.add("loading");
    document.getElementById("mic-btn").innerText = "⏳";
    document.getElementById("status").innerHTML = 'Thinking <div class="dots"><span>●</span><span>●</span><span>●</span></div>';
}

async function sendAudio() {
    try {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        const response = await fetch("/chat", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        addMessage("student", data.student_text);
        addMessage("coach", data.coach_reply);
        playAudio(data.audio_url);

    } catch (err) {
        document.getElementById("status").innerText = "Something went wrong. Try again!";
    } finally {
        document.getElementById("mic-btn").classList.remove("loading");
        document.getElementById("mic-btn").innerText = "🎤";
        document.getElementById("status").innerText = "Press the button and speak";
    }
}

function addMessage(role, text) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.innerHTML = `
        <div class="label">${role === "student" ? "You" : "Coach"}</div>
        <div class="text">${text}</div>
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl + "?t=" + Date.now());
    audio.play();
}

async function resetSession() {
    await fetch("/reset", { method: "POST" });
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = `
        <div class="message coach">
            <div class="label">Coach</div>
            <div class="text">Session reset! What would you like to study today? 🎓</div>
        </div>
    `;
}