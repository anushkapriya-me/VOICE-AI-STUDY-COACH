<div align="center">

# 🎙️ VoiceCoach AI

### Real-Time AI Voice Study Coach

Talk to your study coach like a real mentor. Ask questions using your voice, get AI-powered explanations, and receive spoken responses instantly.

<br>

🌐 **Live Demo:** https://anushkapriya-voice-coach.hf.space/

🐙 **GitHub:** https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH

<br>

<img width="100%" src="https://img.shields.io/badge/AI-Powered-41E6CF?style=for-the-badge" />
<img width="100%" src="https://img.shields.io/badge/Voice-Assistant-79A7FF?style=for-the-badge" />
<img width="100%" src="https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask" />
<img width="100%" src="https://img.shields.io/badge/HuggingFace-Deployed-FFD21E?style=for-the-badge&logo=huggingface" />

</div>

---

## 🚀 About The Project

**VoiceCoach AI** is an AI-powered voice learning platform that allows students to interact with study coaches through natural speech.

Instead of typing questions, users can simply click the microphone button and ask questions naturally. The application converts speech into text, processes it using Large Language Models, generates educational responses, and converts those responses back into realistic voice output.

The goal is to create an interactive learning experience that feels like talking to a real mentor.

---

## ✨ Features

### 🎤 Real-Time Voice Interaction
- Browser microphone recording
- One-click voice conversations
- Natural question answering

### 🧠 AI Study Coaching
- Subject-aware explanations
- Active recall based responses
- Personalized learning assistance
- Follow-up questions for better understanding

### 🔊 AI Voice Responses
- Realistic text-to-speech output
- Multiple coach voices
- Instant audio playback

### 👨‍🏫 Multiple AI Coaches

| Coach | Speciality |
|---------|-----------|
| Dr. Rohan | Concept Builder |
| Sarah | Motivation Mentor |
| Aarav | Exam Strategist |
| Maya | Interview Coach |

### 📊 Session Tracking
- Live timer
- Question counter
- Session monitoring
- Learning analytics support

### 🎨 Premium UI
- Glassmorphism design
- Responsive layout
- Interactive animations
- Mobile friendly
- Modern portfolio-ready interface

---

# 🏗️ Architecture

```text
User Voice
    │
    ▼
Speech Recording (Browser)
    │
    ▼
Flask Backend
    │
    ▼
Groq Whisper
(Speech → Text)
    │
    ▼
Llama 3.1 8B
(AI Response)
    │
    ▼
Cartesia TTS
(Text → Voice)
    │
    ▼
Audio Response
```

---

# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript

## Backend

- Python
- Flask

## AI Models

### Groq
- Whisper Large V3 Turbo
- Llama 3.1 8B Instant

### Cartesia
- Sonic 2 Text-To-Speech

## Deployment

- Hugging Face Spaces

---

# 📂 Project Structure

```bash
VOICE-AI-STUDY-COACH
│
├── app.py
│
├── templates
│   └── index.html
│
├── static
│   ├── style.css
│   ├── script.js
│   └── assets
│
├── session_history.json
├── requirements.txt
├── .env
└── README.md
```

---

# ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH.git
```

### Move Into Project

```bash
cd VOICE-AI-STUDY-COACH
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Create .env File

```env
GROQ_API_KEY=your_api_key
CARTESIA_API_KEY=your_api_key
```

### Run Application

```bash
python app.py
```

Application runs on:

```bash
http://localhost:7860
```

---

# 🎯 How It Works

### Step 1
Select your preferred AI Coach.

### Step 2
Click the microphone button.

### Step 3
Ask your academic question.

### Step 4
Audio is sent to Flask Backend.

### Step 5
Groq Whisper transcribes the speech.

### Step 6
Llama 3.1 generates a study-focused answer.

### Step 7
Cartesia converts the response into speech.

### Step 8
VoiceCoach AI plays the answer back instantly.

---

# 🔥 Key Highlights

✅ Real-Time Voice AI

✅ Speech-To-Text Integration

✅ Text-To-Speech Integration

✅ Multiple Coach Personalities

✅ Responsive Portfolio UI

✅ Session Memory Support

✅ Hugging Face Deployment

✅ Full Stack AI Application

---

# 📸 Preview

### Landing Page

- Hero Voice Interface
- Animated UI
- Coach Showcase
- Modern Dashboard

### Voice Workspace

- Live Chat Window
- Voice Controls
- Session Metrics
- AI Coach Switching

---

# 🚀 Future Improvements

- User Authentication
- Progress Tracking
- Study Streaks
- AI Generated Quizzes
- Flashcard Creation
- PDF Notes Upload
- Topic Analytics Dashboard
- Multi-language Support

---

# 👩‍💻 Author

## Anushka Priya

Aspiring Software Engineer passionate about:

- Artificial Intelligence
- Machine Learning
- Full Stack Development
- Educational Technology

### Connect With Me

GitHub:
https://github.com/anushkapriya-me

Live Demo:
https://anushkapriya-voice-coach.hf.space/

---

<div align="center">

### ⭐ If you liked this project, consider giving it a star ⭐

Built with ❤️ by Anushka Priya

</div>