const canvas = document.getElementById("particles");
const ctx = canvas ? canvas.getContext("2d") : null;
let particles = [];

function initParticles() {
  if (!canvas || !ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];

  const count = Math.min(95, Math.floor((canvas.width * canvas.height) / 18000));

  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.7,
      speed: Math.random() * 0.35 + 0.12,
      alpha: Math.random() * 0.45 + 0.2
    });
  }
}

function animateParticles() {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(65, 230, 207, ${particle.alpha})`;
    ctx.fill();

    particle.y -= particle.speed;
    particle.x += Math.sin(particle.y * 0.01) * 0.15;

    if (particle.y < -8) {
      particle.y = canvas.height + 8;
      particle.x = Math.random() * canvas.width;
    }
  });

  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
window.addEventListener("resize", initParticles);

const navbar = document.getElementById("navbar");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const startSessionBtn = document.getElementById("start-session-btn");

window.addEventListener("scroll", () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 20);
});

if (navToggle && navbar) {
  navToggle.addEventListener("click", () => {
    const isOpen = navbar.classList.toggle("nav-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");

    if (navbar && navbar.classList.contains("nav-open")) {
      navbar.classList.remove("nav-open");
      document.body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

if (startSessionBtn) {
  startSessionBtn.addEventListener("click", () => {
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  });
}

let currentCoach = "Dr. Rohan";
let currentRole = "Concept Builder";
let currentVoiceId = "1259b7e3-cb8a-43df-9446-30971a46b8b0";
let currentCoachImage = document.getElementById("active-coach-img")?.getAttribute("src") || "/static/assets/coach1.png";
let questionCount = 0;
let seconds = 0;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isPreparingToRecord = false;
let recordingStartedAt = 0;
let shouldDiscardCurrentRecording = false;
let isProcessingVoice = false;

const MIN_RECORDING_MS = 1800;
const CHAT_ENDPOINT = window.location.protocol === "file:"
  ? "http://127.0.0.1:7860/chat"
  : "/chat";

setInterval(() => {
  seconds += 1;
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  setText("timer", `${minutes}:${remainingSeconds}`);
}, 1000);

document.querySelectorAll("[data-coach-button]").forEach((button) => {
  button.addEventListener("click", () => {
    setCoach(button, button.dataset.name, button.dataset.role, button.dataset.image, button.dataset.voice);
  });
});

document.querySelectorAll("[data-coach-card]").forEach((card) => {
  card.addEventListener("click", () => {
    const matchingButton = [...document.querySelectorAll("[data-coach-button]")].find((button) =>
      button.dataset.name === card.dataset.name
    );

    setCoach(
      matchingButton,
      card.dataset.name,
      card.dataset.role,
      card.dataset.image,
      card.dataset.voice || matchingButton?.dataset.voice
    );
  });
});

function setCoach(element, name, role, imageSrc, voiceId) {
  document.querySelectorAll(".mini-coach").forEach((coach) => coach.classList.remove("active"));
  element?.classList.add("active");

  currentCoach = name || "Dr. Rohan";
  currentRole = role || "Concept Builder";
  currentCoachImage = imageSrc || "/static/assets/coach1.png";
  currentVoiceId = voiceId || currentVoiceId;

  setText("active-coach", currentCoach);
  setText("active-role", currentRole);
  setText("active-role-small", currentRole);
  setText("active-coach-plan", currentCoach);
  const activeImage = document.getElementById("active-coach-img");
  if (activeImage) activeImage.src = currentCoachImage;

  const heroImage = document.querySelector(".hero-coach-img");
  if (heroImage) heroImage.src = currentCoachImage;

  document.querySelectorAll("[data-coach-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.name === currentCoach);
  });
  document.querySelectorAll("[data-coach-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.name === currentCoach);
  });

  addCoachMessage(`You are now learning with ${currentCoach}. Click the mic and ask your next question.`);
}

const micButton = document.getElementById("mic-btn");

if (micButton) {
  micButton.addEventListener("click", () => {
    if (isProcessingVoice) {
      setText("control-hint", "Wait for the coach response before recording again.");
      return;
    }

    if (isPreparingToRecord) {
      setText("control-hint", "Opening microphone...");
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

async function startRecording() {
  if (isRecording || isPreparingToRecord || isProcessingVoice) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    setStatus("Mic unsupported", "recording");
    setText("control-hint", "Your browser does not support microphone recording.");
    return;
  }

  try {
    isPreparingToRecord = true;
    shouldDiscardCurrentRecording = false;
    setStatus("Opening mic", "thinking");
    setText("control-hint", "Opening microphone...");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    audioChunks = [];
    isRecording = true;
    isPreparingToRecord = false;
    recordingStartedAt = Date.now();

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      sendAudioToCoach();
    });

    mediaRecorder.start();
    micButton?.classList.add("recording");
    setStatus("Recording", "recording");
    setText("control-hint", "Recording... click the mic again to stop.");
  } catch (error) {
    console.error("Microphone error:", error);
    isPreparingToRecord = false;
    setStatus("Mic blocked", "recording");
    setText("control-hint", "Please allow microphone access and try again.");
  }
}

function stopRecording() {
  if (isPreparingToRecord) {
    setText("control-hint", "Opening microphone...");
    return;
  }

  if (!isRecording || !mediaRecorder) return;

  const elapsed = Date.now() - recordingStartedAt;
  if (elapsed < MIN_RECORDING_MS) {
    shouldDiscardCurrentRecording = true;
  }

  isRecording = false;
  micButton?.classList.remove("recording");
  setStatus(shouldDiscardCurrentRecording ? "Ready" : "Thinking", shouldDiscardCurrentRecording ? "ready" : "thinking");
  setText(
    "control-hint",
    shouldDiscardCurrentRecording
      ? "Record a little longer and speak clearly."
      : "Sending your voice to the AI coach..."
  );
  mediaRecorder.stop();
}

async function sendAudioToCoach() {
  if (shouldDiscardCurrentRecording) {
    audioChunks = [];
    shouldDiscardCurrentRecording = false;
    setStatus("Ready", "ready");
    setText("control-hint", "Click the mic to start recording.");
    return;
  }

  if (!audioChunks.length) {
    setStatus("Ready", "ready");
    setText("control-hint", "No audio captured. Click the mic and speak clearly.");
    return;
  }

  const mimeType = mediaRecorder?.mimeType || "audio/webm";
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  const formData = new FormData();

  formData.append("audio", audioBlob, getAudioFileName(mimeType));
  formData.append("subject", "Any Subject");
  formData.append("voice", currentVoiceId);
  formData.append("coach_name", currentCoach);

  isProcessingVoice = true;

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Voice request failed");
    }

    if (data.student_text) {
      addUserMessage(data.student_text);
    }

    if (data.coach_reply) {
      addCoachMessage(data.coach_reply);
    }

    if (data.audio_b64) {
      playCoachAudio(data.audio_b64);
    }

    questionCount += 1;
    setText("question-count", String(questionCount));
    setStatus("Ready", "ready");
    setText("control-hint", "Click the mic to start recording.");
  } catch (error) {
    console.error("Chat error:", error);
    const errorMessage = error.message || "Something went wrong. Try again.";
    setStatus("Ready", "ready");

    if (errorMessage.toLowerCase().includes("audio too short")) {
      setText("control-hint", "Please record for at least 2 seconds.");
      return;
    }

    setText("control-hint", errorMessage);
    addCoachMessage("I could not process that audio. Please check the backend is running, then try again.");
  } finally {
    isProcessingVoice = false;
  }
}

function getSupportedMimeType() {
  if (!window.MediaRecorder) return "";

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function getAudioFileName(mimeType) {
  if (mimeType.includes("mp4")) return "voice-note.mp4";
  if (mimeType.includes("ogg")) return "voice-note.ogg";
  return "voice-note.webm";
}

function playCoachAudio(audioBase64) {
  const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
  audio.play().catch((error) => {
    console.warn("Audio playback blocked:", error);
  });
}

function addUserMessage(text) {
  const chatWindow = document.getElementById("chat-window");
  if (!chatWindow) return;

  const message = document.createElement("div");
  message.className = "message user-message";
  message.innerHTML = `
    <div class="message-bubble">
      <span>You</span>
      <p>${escapeHtml(text)}</p>
    </div>
  `;

  chatWindow.appendChild(message);
  scrollChat();
}

function addCoachMessage(text) {
  const chatWindow = document.getElementById("chat-window");
  if (!chatWindow) return;

  const message = document.createElement("div");
  message.className = "message coach-message";
  message.innerHTML = `
    <img src="${currentCoachImage}" alt="">
    <div class="message-bubble">
      <span>${escapeHtml(currentCoach)}</span>
      <p>${escapeHtml(text)}</p>
    </div>
  `;

  chatWindow.appendChild(message);
  scrollChat();
}

function scrollChat() {
  const chatWindow = document.getElementById("chat-window");
  if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setStatus(text, state) {
  const status = document.getElementById("status-indicator");
  if (!status) return;

  status.className = `status-badge ${state}`;
  status.textContent = text;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
