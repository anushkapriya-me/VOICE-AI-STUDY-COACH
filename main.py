import whisper
import pyaudio
import wave
import os
from groq import Groq
from cartesia import Cartesia
from dotenv import load_dotenv

# Load API keys
load_dotenv()

# ── Setup ──────────────────────────────────────────
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
cartesia_client = Cartesia(api_key=os.getenv("CARTESIA_API_KEY"))

# Audio settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
RECORD_SECONDS = 5

# Coach memory - tracks the full conversation
conversation_history = []

SYSTEM_PROMPT = """You are an expert study coach who can teach ANY subject — math, science, history, geography, economics, programming, literature, physics, chemistry, biology, English, or anything else academic.

Your rules:
- Keep all replies under 3 sentences (this is voice, not text)
- Ask one follow up question at the end to test understanding
- If the student struggles, simplify your explanation using real life examples
- Be encouraging, friendly and patient
- Remember what topics have been discussed and reinforce weak areas
- Automatically detect what subject the student is asking about and switch accordingly
- If the student asks something non-academic, politely bring them back to studying"""
# ── Functions ──────────────────────────────────────

def record_audio():
    """Record audio from microphone for 5 seconds"""
    pa = pyaudio.PyAudio()
    stream = pa.open(
        format=FORMAT, channels=CHANNELS,
        rate=RATE, input=True,
        frames_per_buffer=CHUNK
    )
    print("\n🎤 Listening... (speak for 5 seconds)")
    frames = []
    for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)
    print("✅ Got it!")
    stream.stop_stream()
    stream.close()
    pa.terminate()

    # Save to file
    with wave.open("input.wav", "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(pa.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))
    return "input.wav"


def transcribe_audio(filename):
    """Convert audio file to text using Whisper"""
    print("📝 Transcribing...")
    result = whisper_model.transcribe(filename)
    text = result["text"].strip()
    print(f"You said: {text}")
    return text


def get_coach_reply(student_text):
    """Send text to Groq and get coaching reply"""
    print("🧠 Coach is thinking...")

    # Add student message to history
    conversation_history.append({
        "role": "user",
        "content": student_text
    })

    # Send full conversation to Groq
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + conversation_history
    )

    reply = response.choices[0].message.content

    # Save coach reply to history too
    conversation_history.append({
        "role": "assistant",
        "content": reply
    })

    print(f"Coach: {reply}")
    return reply


def speak_reply(text):
    """Convert text to speech and play it"""
    print("🔊 Speaking...")
    response = cartesia_client.tts.generate(
        model_id="sonic-2",
        transcript=text,
        voice={"mode": "id", "id": "694f9389-aac1-45b6-b726-9d9369183238"},
        output_format={
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 22050,
        },
    )
    raw_audio = response.read()

    pa = pyaudio.PyAudio()
    stream = pa.open(
        format=pyaudio.paInt16,
        channels=1, rate=22050,
        output=True
    )
    stream.write(raw_audio)
    stream.stop_stream()
    stream.close()
    pa.terminate()


# ── Main Loop ──────────────────────────────────────

print("\n" + "="*50)
print("🎓 VOICE AI STUDY COACH")
print("="*50)
print("Say 'quit' or 'exit' to stop the session")
print("Each turn: you speak for 5 seconds")
print("="*50)

# Coach introduces itself first
intro = "Hello! I'm your AI study coach. I can help you with any subject — math, science, history, programming, English, or anything else. What would you like to study today?"
print(f"\nCoach: {intro}")
speak_reply(intro)

# Main conversation loop
while True:
    try:
        # Step 1: Record
        audio_file = record_audio()

        # Step 2: Transcribe
        student_text = transcribe_audio(audio_file)

        # Check if student wants to quit
        if any(word in student_text.lower() for word in ["quit", "exit", "stop", "bye"]):
            farewell = "Great session today! Keep practicing and you'll master Python in no time. Goodbye!"
            print(f"\nCoach: {farewell}")
            speak_reply(farewell)
            break

        # Step 3: Get coach reply
        coach_reply = get_coach_reply(student_text)

        # Step 4: Speak reply
        speak_reply(coach_reply)

    except KeyboardInterrupt:
        print("\n\nSession ended. Great work today!")
        break

print("\n✅ Session complete!")