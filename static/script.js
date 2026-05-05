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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = sendAudio;
        mediaRecorder.start();

        isRecording = true;
        document.getElementById("mic-btn").classList.add("recording");
        document.getElementById("mic-btn").innerText = "⏹";
        document.getElementById("status").innerText = "Recording... press again to stop";

        const waveform = document.getElementById("waveform");
        if (waveform) waveform.style.display = "flex";

    } catch (err) {
        console.error("Mic error:", err);
        document.getElementById("status").innerText = "Mic error: " + err.name + " - " + err.message;
    }
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;

    const waveform = document.getElementById("waveform");
    if (waveform) waveform.style.display = "none";

    document.getElementById("mic-btn").classList.remove("recording");
    document.getElementById("mic-btn").classList.add("loading");
    document.getElementById("mic-btn").innerText = "⏳";

    const thinking = document.getElementById("thinking");
    if (thinking) thinking.style.display = "flex";

    const status = document.getElementById("status");
    if (status) status.style.display = "none";
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

        const thinking = document.getElementById("thinking");
        if (thinking) thinking.style.display = "none";

        const status = document.getElementById("status");
        if (status) status.style.display = "block";

        addMessage("student", data.student_text);
        addMessage("coach", data.coach_reply);

        const speaking = document.getElementById("speaking");
        if (speaking) speaking.style.display = "flex";
        if (status) status.style.display = "none";

        await playAudio(data.audio_url);

        if (speaking) speaking.style.display = "none";
        if (status) status.style.display = "block";

    } catch (err) {
        console.error("Send error:", err);
        document.getElementById("status").innerText = "Something went wrong. Try again!";

        const thinking = document.getElementById("thinking");
        if (thinking) thinking.style.display = "none";
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
    return new Promise((resolve) => {
        const audio = new Audio(audioUrl + "?t=" + Date.now());
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(err => {
            console.error("Audio play error:", err);
            resolve();
        });
    });
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