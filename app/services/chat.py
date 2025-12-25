import google.generativeai as genai
from datetime import datetime
from fastapi import HTTPException
from ..config import settings

SYSTEM_PROMPT = (
    "You are an AI interviewer. Ask one question at a time for the chosen domain. "
    "After a short exchange, give a brief score + actionable tips. "
    "Use bold text for section headers instead of markdown hashtags (#). Keep it conversational."
)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

async def stream_ollama(messages: list[dict]):
    """
    Stream text chunks from Google Gemini API.
    Kept name 'stream_ollama' for compatibility with main.py, 
    but internally uses Gemini.
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Convert messages to Gemini format
        # Gemini expects history as list of Content objects, but we can use simple generation for now
        # or construct a chat session. For simplicity in this stateless API, we'll format the prompt.
        
        # Simple prompt construction
        full_prompt = f"System: {SYSTEM_PROMPT}\n"
        for m in messages:
            role = "User" if m["role"] == "user" else "Model"
            if m["role"] == "system": continue # already added
            full_prompt += f"{role}: {m['content']}\n"
        full_prompt += "Model: "

        response = model.generate_content(full_prompt, stream=True)

        for chunk in response:
            if chunk.text:
                yield {
                    "role": "assistant",
                    "content": chunk.text,
                    "timestamp": datetime.utcnow().isoformat(),
                }

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")
