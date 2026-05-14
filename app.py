from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import os
import time
import json
import base64
import io
import struct
from groq import Groq
from gtts import gTTS

load_dotenv()

app = Flask(__name__)

print("Setting up AI clients...")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print("Ready!")

SYSTEM_PROMPT = """You are an expert study coach who can teach ANY subject — math, science, history, geography, economics, programming, literature, physics, chemistry, biology, English, or anything else academic.

Your rules:
- Keep all replies under 3 sentences (this is voice, not text)
- Ask one follow up question at the end to test understanding
- If the student struggles, simplify your explanation using real life examples
- Be encouraging, friendly and patient
- Remember what topics have been discussed and reinforce weak areas
- Automatically detect what subject the student is asking about and switch accordingly
- If the student asks something non-academic, politely bring them back to studying"""

HISTORY_FILE = "session_history.json"

conversation_history = []
session_start_time = time.time()
session_subject = "Any Subject"
question_count = 0

def load_past_sessions():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_session_to_history(summary_data):
    sessions = load_past_sessions()
    sessions.append({
        "date": time.strftime("%Y-%m-%d %H:%M"),
        "subject": summary_data.get("subject", ""),
        "duration": summary_data.get("duration", ""),
        "questions": summary_data.get("questions", 0),
        "topics": summary_data.get("topics", ""),
        "weak_areas": summary_data.get("weak_areas", ""),
        "tip": summary_data.get("tip", "")
    })
    sessions = sessions[-10:]
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(sessions, f, indent=2)
    except:
        pass

def build_context_from_history():
    sessions = load_past_sessions()
    if not sessions:
        return ""
    context = "\n\nPAST SESSION HISTORY (use this to personalize coaching):\n"
    for s in sessions[-3:]:
        context += f"- Date: {s['date']}, Subject: {s['subject']}, "
        context += f"Topics: {s['topics']}, Weak areas: {s['weak_areas']}\n"
    context += "Reinforce any weak areas from past sessions naturally in your coaching."
    return context

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/past-sessions", methods=["GET"])
def past_sessions():
    sessions = load_past_sessions()
    return jsonify(sessions)

@app.route("/chat", methods=["POST"])
def chat():
    global conversation_history, session_subject, question_count

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    selected_subject = request.form.get("subject", "Any Subject")
    session_subject = selected_subject

    if len(audio_bytes) < 1000:
        return jsonify({"error": "Audio too short"}), 400

    # Transcribe directly from memory
    try:
        audio_buffer = io.BytesIO(audio_bytes)
        audio_buffer.name = "audio.mp4"
        transcription = groq_client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_buffer,
            language="en",
        )
        student_text = transcription.text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": "Could not transcribe audio"}), 500

    print(f"Subject: {selected_subject} | Student: {student_text}")

    if not student_text:
        return jsonify({"error": "No speech detected"}), 400

    question_count += 1
    conversation_history.append({"role": "user", "content": student_text})

    history_context = build_context_from_history()
    subject_prompt = SYSTEM_PROMPT + history_context + f"\n\nCurrent session focus: {selected_subject}."

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "system", "content": subject_prompt}] + conversation_history
    )

    coach_reply = response.choices[0].message.content
    conversation_history.append({"role": "assistant", "content": coach_reply})
    print(f"Coach: {coach_reply}")

    # Generate TTS with gTTS (free, no quota!)
    tts = gTTS(text=coach_reply, lang='en', slow=False)
    mp3_buffer = io.BytesIO()
    tts.write_to_fp(mp3_buffer)
    mp3_buffer.seek(0)
    audio_b64 = base64.b64encode(mp3_buffer.read()).decode("utf-8")

    return jsonify({
        "student_text": student_text,
        "coach_reply": coach_reply,
        "audio_b64": audio_b64
    })

@app.route("/summary", methods=["GET"])
def summary():
    global conversation_history, session_start_time, session_subject, question_count

    if len(conversation_history) == 0:
        return jsonify({
            "duration": "0 minutes",
            "questions": 0,
            "subject": session_subject,
            "topics": "No questions asked yet!",
            "weak_areas": "None",
            "tip": "Start by asking a question!"
        })

    duration_seconds = int(time.time() - session_start_time)
    duration_str = f"{duration_seconds // 60}m {duration_seconds % 60}s"

    summary_prompt = """Based on this study session conversation, provide a brief summary in this exact JSON format:
{
  "topics": "comma separated list of topics covered",
  "weak_areas": "topics the student seemed confused about",
  "tip": "one specific study tip for tonight"
}
Only respond with the JSON, nothing else."""

    try:
        summary_response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": summary_prompt}] + conversation_history
        )
        summary_data = json.loads(summary_response.choices[0].message.content.strip())
    except:
        summary_data = {
            "topics": session_subject,
            "weak_areas": "None identified",
            "tip": "Review today's topics and practice with examples!"
        }

    result = {
        "duration": duration_str,
        "questions": question_count,
        "subject": session_subject,
        "topics": summary_data.get("topics", ""),
        "weak_areas": summary_data.get("weak_areas", ""),
        "tip": summary_data.get("tip", "")
    }

    save_session_to_history(result)
    return jsonify(result)

@app.route("/reset", methods=["POST"])
def reset():
    global conversation_history, session_start_time, question_count
    conversation_history = []
    session_start_time = time.time()
    question_count = 0
    return jsonify({"status": "reset"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)