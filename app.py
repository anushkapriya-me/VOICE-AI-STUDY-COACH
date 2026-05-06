from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import os
import struct
from groq import Groq
from cartesia import Cartesia

load_dotenv()

app = Flask(__name__)

print("Setting up AI clients...")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
cartesia_client = Cartesia(api_key=os.getenv("CARTESIA_API_KEY"))
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

conversation_history = []

def save_wav(raw_audio, filename):
    sample_rate = 22050
    num_channels = 1
    bits_per_sample = 16
    with open(filename, "wb") as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + len(raw_audio)))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<I', 16))
        f.write(struct.pack('<H', 1))
        f.write(struct.pack('<H', num_channels))
        f.write(struct.pack('<I', sample_rate))
        f.write(struct.pack('<I', sample_rate * num_channels * bits_per_sample // 8))
        f.write(struct.pack('<H', num_channels * bits_per_sample // 8))
        f.write(struct.pack('<H', bits_per_sample))
        f.write(b'data')
        f.write(struct.pack('<I', len(raw_audio)))
        f.write(raw_audio)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    global conversation_history

    # Get audio from browser
    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()

    # Check if audio is too short
    if len(audio_bytes) < 1000:
        return jsonify({"error": "Audio too short"}), 400

    # Save temporarily as webm
    with open("temp_input.webm", "wb") as f:
        f.write(audio_bytes)

    # Transcribe with Groq Whisper
    try:
        with open("temp_input.webm", "rb") as audio:
            transcription = groq_client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio,
            )
        student_text = transcription.text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": "Could not transcribe audio"}), 500

    print(f"Student said: {student_text}")

    # Skip empty transcriptions
    if not student_text:
        return jsonify({"error": "No speech detected"}), 400

    # Add to history and get reply
    conversation_history.append({
        "role": "user",
        "content": student_text
    })

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + conversation_history
    )

    coach_reply = response.choices[0].message.content
    conversation_history.append({
        "role": "assistant",
        "content": coach_reply
    })
    print(f"Coach: {coach_reply}")

    # Convert to speech
    tts_response = cartesia_client.tts.generate(
        model_id="sonic-2",
        transcript=coach_reply,
        voice={"mode": "id", "id": "694f9389-aac1-45b6-b726-9d9369183238"},
        output_format={
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 22050,
        },
    )
    raw_audio = tts_response.read()
    save_wav(raw_audio, "static/reply.wav")

    return jsonify({
        "student_text": student_text,
        "coach_reply": coach_reply,
        "audio_url": "/static/reply.wav"
    })

@app.route("/reset", methods=["POST"])
def reset():
    global conversation_history
    conversation_history = []
    return jsonify({"status": "reset"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)