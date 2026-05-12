let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let shouldSend = false;
let selectedSubject = "Any Subject";

function selectSubject(subject, btn) {
    selectedSubject = subject;
    document.querySelectorAll(".subject-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

async function startRecording() {
    if (isRecording || isProcessing) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        shouldSend = false;

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            if (shouldSend) {
                sendAudio();
            } else {
                resetUI();
            }
        };

        mediaRecorder.start(100);
        isRecording = true;
        shouldSend = false;

        document.getElementById("mic-btn").classList.add("recording");
        document.getElementById("mic-btn").innerText = "⏹";
        document.getElementById("status").innerText = "Recording... release to send!";

        const waveform = document.getElementById("waveform");
        if (waveform) waveform.style.display = "flex";

    } catch (err) {
        console.error("Mic error:", err);
        document.getElementById("status").innerText = "Mic error: " + err.name;
    }
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    shouldSend = true;
    isRecording = false;

    try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error("Stop error:", err);
        resetUI();
        return;
    }

    mediaRecorder = null;

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
    isProcessing = true;

    try {
        if (audioChunks.length === 0) {
            isProcessing = false;
            resetUI();
            return;
        }

        const totalSize = audioChunks.reduce((acc, chunk) => acc + chunk.size, 0);
        if (totalSize < 1000) {
            isProcessing = false;
            document.getElementById("status").innerText = "Too short! Hold longer and speak.";
            resetUI();
            return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("subject", selectedSubject);

        const response = await fetch("/chat", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server error: " + response.status);

        const data = await response.json();

        const thinking = document.getElementById("thinking");
        if (thinking) thinking.style.display = "none";

        addMessage("student", data.student_text);
        addMessage("coach", data.coach_reply);

        const speaking = document.getElementById("speaking");
        if (speaking) speaking.style.display = "flex";

        const status = document.getElementById("status");
        if (status) status.style.display = "none";

        await playAudio(data.audio_url);

        if (speaking) speaking.style.display = "none";

        await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err) {
        console.error("Send error:", err);
        document.getElementById("status").innerText = "Something went wrong. Try again!";
        const thinking = document.getElementById("thinking");
        if (thinking) thinking.style.display = "none";

    } finally {
        isProcessing = false;
        resetUI();
    }
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

function resetUI() {
    if (isProcessing) return;

    document.getElementById("mic-btn").classList.remove("loading");
    document.getElementById("mic-btn").classList.remove("recording");
    document.getElementById("mic-btn").innerText = "🎤";

    const status = document.getElementById("status");
    if (status) {
        status.style.display = "block";
        status.innerText = "Hold the button and speak";
    }

    const thinking = document.getElementById("thinking");
    if (thinking) thinking.style.display = "none";

    const speaking = document.getElementById("speaking");
    if (speaking) speaking.style.display = "none";

    const waveform = document.getElementById("waveform");
    if (waveform) waveform.style.display = "none";

    audioChunks = [];
    shouldSend = false;
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

async function resetSession() {
    document.getElementById("status").innerText = "Generating summary...";

    try {
        const response = await fetch("/summary");
        const data = await response.json();

        document.getElementById("sum-duration").innerText = data.duration;
        document.getElementById("sum-questions").innerText = data.questions;
        document.getElementById("sum-subject").innerText = data.subject;
        document.getElementById("sum-topics").innerText = data.topics || "Not enough data";
        document.getElementById("sum-weak").innerText = data.weak_areas || "None identified";
        document.getElementById("sum-tip").innerText = data.tip || "Keep practicing!";

        document.getElementById("summary-modal").style.display = "flex";

    } catch (err) {
        console.error("Summary error:", err);
        confirmReset();
    }
}

async function confirmReset() {
    document.getElementById("summary-modal").style.display = "none";
    isProcessing = false;

    await fetch("/reset", { method: "POST" });

    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = `
        <div class="message coach">
            <div class="label">Coach</div>
            <div class="text">New session started! Pick a subject and let's go! 🎓</div>
        </div>
    `;
    resetUI();
    document.getElementById("status").innerText = "Hold the button and speak";
}

async function toggleHistory() {
    const panel = document.getElementById("history-panel");
    if (panel.style.display === "flex") {
        panel.style.display = "none";
        return;
    }

    const list = document.getElementById("history-list");
    list.innerHTML = '<p class="no-history">Loading...</p>';
    panel.style.display = "flex";

    try {
        const response = await fetch("/past-sessions");
        const sessions = await response.json();

        if (sessions.length === 0) {
            list.innerHTML = '<p class="no-history">No past sessions yet! Complete a session to see history.</p>';
            return;
        }

        list.innerHTML = sessions.reverse().map(s => `
            <div class="history-card">
                <div class="history-date">${s.date}</div>
                <div class="history-subject">📚 ${s.subject} — ${s.duration} · ${s.questions} questions</div>
                <div class="history-detail">✅ ${s.topics}</div>
                ${s.weak_areas && s.weak_areas !== "None identified" ?
                    `<div class="history-detail">⚠️ Review: ${s.weak_areas}</div>` : ""}
            </div>
        `).join("");

    } catch (err) {
        list.innerHTML = '<p class="no-history">Could not load history.</p>';
    }
}