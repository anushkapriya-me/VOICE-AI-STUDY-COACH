
```markdown
<div align="center">
  <img src="static/assets/favicon_io/apple-touch-icon.png" alt="VoiceCoach AI Logo" width="120"/>

# 🎙️ VoiceCoach AI — Real-Time Voice Study Coach
**Talk to your study coach like a real mentor. Free, Local, & Open Source.**

[![Platform](https://img.shields.io/badge/Platform-Web-blue?logo=googlechrome)](#)
[![License](https://img.shields.io/badge/License-MIT-green)](#)
[![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)](#)
[![Flask](https://img.shields.io/badge/Framework-Flask-black?logo=flask)](#)
</div>

---

## 📖 Overview

**VoiceCoach AI** is a lightweight, real-time voice study coach that lives in your browser. It transforms your spoken questions into clear explanations, active recall prompts, revision plans, and voice replies powered by your own local AI backend. 

* **A First of Its Kind:** Currently, the landscape for study tools is heavily text-based. VoiceCoach AI bridges the gap by offering a fully functional, highly optimized, and beautifully designed voice-first interface that simulates talking to a real mentor. 
* **Privacy First:** Your voice processing is handled securely using API integrations via your local Flask server. It operates offline-first on your machine, does not track you unnecessarily, and stores your session history locally.

---

## 📸 Screenshots

| Landing Page | Meet Your Coaches |
| :---: | :---: |
| <img src="static/assets/Landing_page.png" width="400" alt="Landing Page"/> | <img src="static/assets/Meet_ur_Coaches.png" width="400" alt="Coach Selection"/> |

<div align="center">
  <strong>Active Coach Interaction</strong><br>
  <img src="static/assets/Coach_Interaction.png" width="600" alt="Active Session"/>
</div>

---

## ✨ Features Breakdown

| Feature | Included |
| :--- | :---: |
| **Real-time Voice to Text (Whisper-large-v3-turbo)** | ✅ |
| **Smart AI Explanations (Llama-3.1-8b-instant)** | ✅ |
| **Spoken AI Replies (Cartesia Sonic-2)** | ✅ |
| **Multiple Coach Personas (4 Unique Voices/Styles)** | ✅ |
| **Live Session Timer & Question Tracking** | ✅ |
| **Local Session History & JSON Summaries** | ✅ |
| **Premium Glassmorphism UI & Particle Animations** | ✅ |
| **Fully Responsive Design** | ✅ |

---

## 🚀 Installation

### Option 1 — Local Developer Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH.git](https://github.com/anushkapriya-me/VOICE-AI-STUDY-COACH.git)
   cd VOICE-AI-STUDY-COACH

```

2. **Install Dependencies:**
Ensure you have Python installed, then run:
```bash
pip install flask python-dotenv groq cartesia

```


3. **Configure Environment Variables:**
Create a `.env` file in the root directory and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key
CARTESIA_API_KEY=your_cartesia_api_key

```


4. **Run the Backend:**
```bash
python app.py

```


## 🛡️ API & System Requirements

Unlike native Windows apps that might need Administrative Privileges, VoiceCoach AI requires valid API keys to function securely:

* **Groq API:** Used for lightning-fast speech-to-text transcription (Whisper) and reasoning (Llama 3.1).
* **Cartesia API:** Used for low-latency, natural text-to-speech generation.

*No data is sold or harvested by the VoiceCoach backend—your requests go directly to the respective API providers.*

---

## 📁 Repository Structure

```text
VOICE-AI-STUDY-COACH/
├── static/
│   ├── assets/
│   │   ├── Coach_Interaction.png
│   │   ├── Landing_page.png
│   │   ├── Meet_ur_Coaches.png
│   │   └── favicon_io/
│   ├── style.css
│   └── script.js
├── templates/
│   └── index.html
├── .env                  # (Create this file for API keys)
├── app.py                # Main Flask backend
└── session_history.json  # Auto-generated history

```

---

## ☕ The Story Behind VoiceCoach AI

The idea for VoiceCoach AI was born out of a desire for a more natural, interactive learning experience. We searched for a simple, voice-first study app that could actually talk back like a mentor, without expensive subscriptions or clunky text-heavy interfaces.

A massive amount of hard work went into building this completely from scratch—designing the UI, connecting the Web Audio API to Flask, configuring low-latency models with Groq and Cartesia, and making it feel like a seamless study companion.

Please shower your love and support for this app, star the repository, and share it with fellow learners! ❤️

*Made with ❤️ by Anushka Priya.*

```

```
