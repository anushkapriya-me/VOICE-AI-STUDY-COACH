// Animated particles
(function() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 8000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.3,
                opacity: Math.random() * 0.7 + 0.1,
                speed: Math.random() * 0.15 + 0.02,
                drift: (Math.random() - 0.5) * 0.08,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                cyan: Math.random() < 0.08
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.twinkle += p.twinkleSpeed;
            const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.cyan
                ? `rgba(0, 200, 255, ${opacity})`
                : `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
            p.y -= p.speed;
            p.x += p.drift;
            if (p.y < -2) { p.y = canvas.height + 2; p.x = Math.random() * canvas.width; }
            if (p.x < -2) p.x = canvas.width + 2;
            if (p.x > canvas.width + 2) p.x = -2;
        });
        requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
})();

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let shouldSend = false;
let selectedSubject = "Any Subject";
let selectedVoice = "1259b7e3-cb8a-43df-9446-30971a46b8b0";

function selectSubject(subject, btn) {
    selectedSubject = subject;
    document.querySelectorAll(".subject-btn, .sel-btn[onclick*='selectSubject']").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

function selectVoice(voiceId, btn) {
    selectedVoice = voiceId;
    document.querySelectorAll(".voice-btn, .sel-btn[onclick*='selectVoice']").forEach(b => b.classList.remove("active"));
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
            if (shouldSend) sendAudio();
            else resetUI();
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
        if (audioChunks.length === 0) { isProcessing = false; resetUI(); return; }

        const totalSize = audioChunks.reduce((acc, chunk) => acc + chunk.size, 0);
        if (totalSize < 1000) {
            isProcessing = false;
            document.getElementById("status").innerText = "Too short! Hold longer and speak.";
            resetUI();
            return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
const formData = new FormData();
formData.append("audio", audioBlob, "recording.mp4");
        formData.append("subject", selectedSubject);
        formData.append("voice", selectedVoice);

        const response = await fetch("/chat", { method: "POST", body: formData });
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

        await playAudio(data.audio_b64);

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

function playAudio(audioB64) {
    return new Promise((resolve) => {
        try {
            const binary = atob(audioB64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "audio/mp3" });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(() => resolve());
        } catch (err) {
            console.error("Audio error:", err);
            resolve();
        }
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
        status.innerText = "hold to speak · release to send";
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
        <div class="label">${role === "student" ? "YOU" : "COACH"}</div>
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
            <div class="label">COACH</div>
            <div class="text">New session started! Pick a subject and let's go! 🎓</div>
        </div>
    `;
    resetUI();
    document.getElementById("status").innerText = "hold to speak · release to send";
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
            list.innerHTML = '<p class="no-history">No past sessions yet!</p>';
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