# 🎓 Voice AI Study Coach
> A real-time voice-powered AI tutoring system that listens, thinks, and speaks back — like a personal tutor available 24/7.
[Live Demo](https://huggingface.co/spaces/AnushkaPriya/voice-coach)** · **[GitHub](https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH)**

---

## What is this?

Voice AI Study Coach is an end-to-end voice AI application where students can **speak naturally** and get instant coaching responses — just like talking to a real tutor.
No typing. No clicking. Just speak and learn.

---

## Demo

Student: "Can you explain recursion to me?"
Coach:   "Recursion is when a function calls itself to solve
a smaller version of the same problem. Think of it
like Russian nesting dolls — each doll contains a
smaller version of itself. Can you think of a
real-world example where this pattern appears?"

## How it works
🎤 You speak
↓
📝 Groq Whisper  →  converts your voice to text (STT)
↓
🧠 LLaMA 3.1     →  generates a smart coaching reply (LLM)
↓
🔊 Cartesia      →  converts reply to natural speech (TTS)
↓
👂 You hear the response

Round trip time: **under 3 seconds**

---

## Features

- 🎤 **Push to talk** — hold mic button to speak, release to send
- 🧠 **Smart coaching** — spaced repetition logic built into system prompt
- 👨‍🏫 **4 AI coaches** — Dr. Rohan, Prof. Priya, Coach James, Dr. Olivia
- 📚 **9 subjects** — Math, Science, History, Programming, Geography, English, Chemistry, Biology, or Any
- 📊 **Session summary** — AI-generated summary of what you covered
- 📅 **Session history** — remembers past sessions and reinforces weak areas
- 🌐 **Deployed live** — accessible from any device, anywhere

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Speech to Text | Groq Whisper | Voice → text transcription |
| LLM | LLaMA 3.1 8B (via Groq) | Coaching brain |
| Text to Speech | Cartesia Sonic-2 | Natural voice output |
| Backend | Python + Flask | API server |
| Frontend | HTML + CSS + JS | Web interface |
| Deployment | Docker + Hugging Face Spaces | Live hosting |

---

## Why Groq?

Groq runs LLMs on custom LPU hardware — **10x faster** than standard GPU inference. This is critical for voice apps where any delay over 500ms feels unnatural.

---

## Project Structure
voice-coach/
├── app.py              # Flask backend — main API
├── main.py             # Local terminal version
├── templates/
│   └── index.html      # Frontend UI
├── static/
│   ├── style.css       # Styling
│   └── script.js       # Audio pipeline + UI logic
├── requirements.txt    # Python dependencies
└── Dockerfile          # Container config for deployment

---

## Local Setup

**1. Clone the repo**
```bash
git clone https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH.git
cd VOICE-AI-STUDY-COACH
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Add API keys — create a `.env` file**
GROQ_API_KEY=your_groq_key_here
CARTESIA_API_KEY=your_cartesia_key_here

**4. Run**
```bash
python app.py
```

**5. Open** `http://localhost:7860`

---

## API Keys (all free)

| Service | Get key at | Free tier |
|---|---|---|
| Groq | console.groq.com | Unlimited (rate limited) |
| Cartesia | play.cartesia.ai | 1000 chars/month |

---

## Engineering highlights

- **Chunked audio streaming** — browser records in 100ms chunks for low latency
- **In-memory transcription** — audio never written to disk, processed via BytesIO buffer
- **Base64 audio transfer** — TTS output sent as base64 to avoid filesystem issues on cloud
- **Session state management** — full conversation history sent with every request
- **Spaced repetition** — weak topics from past sessions injected into system prompt
- **Voice activity detection** — Web Audio API used to show waveform only when speaking
- **Minimum recording guard** — ignores accidental taps under 1.5 seconds

---

## Deployment

Deployed on **Hugging Face Spaces** using Docker.

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["python", "app.py"]
```

API keys stored as **Hugging Face Secrets** — never exposed in code.

---

## Built by

**Anushka Priya** — built from scratch in one week as a learning project.

> *"Started knowing nothing about voice AI. Built a complete real-time voice pipeline by the end."*

---

## License

MIT — free to use, modify and build upon.