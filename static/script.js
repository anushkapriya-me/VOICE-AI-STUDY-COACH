let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let shouldSend = false;

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

        const response = await fetch("/chat", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        const thinking = document.getElementById("thinking");
        if (thinking) thinking.style.display = "none";

        addMessage("student", data.student_text);
        addMessage("coach", data.coach_reply);

        const speaking = document.getElementById("speaking");
        if (speaking) speaking.style.display = "flex";

        const status = document.getElementById("status");
        if (status) status.style.display = "none";

        // Play audio then wait 1.5s before re-enabling mic
        await playAudio(data.audio_url);

        if (speaking) speaking.style.display = "none";

        // Wait 1.5 seconds after coach finishes
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
    isProcessing = false;
    await fetch("/reset", { method: "POST" });
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = `
        <div class="message coach">
            <div class="label">Coach</div>
            <div class="text">Session reset! What would you like to study today? 🎓</div>
        </div>
    `;
    resetUI();
}