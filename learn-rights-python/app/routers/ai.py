import os
import random
import time
from fastapi import APIRouter, HTTPException

from app.schemas import AIChatbotBody, AIQuizBody
from app.config import GOOGLE_AI_API_KEY, GEMINI_MODEL

router = APIRouter()

# Fallback responses when AI is unavailable (same as JS)
FALLBACK_QUESTIONS = {
    "domestic-violence": {
        "question": "Question: Under the Protection of Women from Domestic Violence Act, 2005, what types of abuse are considered domestic violence?\nA) Only physical abuse\nB) Physical, emotional, sexual, and economic abuse\nC) Only verbal arguments\nD) Only property damage\nCorrect Answer: B",
        "metadata": {"moduleId": "domestic-violence", "questionType": "factual", "fallback": True},
    },
    "workplace-harassment": {
        "question": "Question: What is the maximum time limit to file a complaint under the Sexual Harassment of Women at Workplace Act, 2013?\nA) 1 month\nB) 3 months\nC) 6 months\nD) 1 year\nCorrect Answer: B",
        "metadata": {"moduleId": "workplace-harassment", "questionType": "factual", "fallback": True},
    },
}


def _get_google_model():
    if not GOOGLE_AI_API_KEY:
        raise ValueError("Google AI API key not configured")
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_AI_API_KEY)
    return genai.GenerativeModel(
        GEMINI_MODEL,
        generation_config=genai.GenerationConfig(
            max_output_tokens=1024,
            temperature=0.7,
        ),
    )


@router.get("/check-key")
def check_api_key():
    """Check if GOOGLE_AI_API_KEY is set and if it works with Gemini. Call this to verify your .env."""
    key = (GOOGLE_AI_API_KEY or "").strip()
    if not key:
        return {
            "configured": False,
            "working": False,
            "message": "GOOGLE_AI_API_KEY is not set. Add it to your .env file in the learn-rights-python folder.",
        }
    try:
        model = _get_google_model()
        response = model.generate_content("Reply with exactly: OK")
        text = (getattr(response, "text", None) or "").strip()
        if "OK" in text or text:
            return {"configured": True, "working": True, "message": "API key is valid. Chatbot should work."}
        return {"configured": True, "working": False, "message": "API key responded but with unexpected result."}
    except Exception as e:
        err = str(e)
        return {
            "configured": True,
            "working": False,
            "message": "API key is set but Gemini returned an error.",
            "error": err[:200],
        }


@router.post("/quiz")
def generate_quiz(body: AIQuizBody):
    if not body.moduleId or not body.moduleId.strip():
        raise HTTPException(status_code=400, detail="moduleId is required and must be a non-empty string")
    if not isinstance(body.userProgress, dict):
        raise HTTPException(status_code=400, detail="userProgress is required and must be an object")
    try:
        model = _get_google_model()
        seed = random.randint(0, 999999)
        qtype = random.choice(["factual", "conceptual", "application", "analysis"])
        prompt = f'''You are an expert legal educator creating quiz questions for women's legal rights education in India.
Generate ONE unique {qtype} multiple-choice question for the legal education module "{body.moduleId.strip()}".
Make it different from typical questions - focus on practical application and real-world scenarios.
Format exactly as shown:
Question: [Your question]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Correct Answer: [Single letter A, B, C, or D]
Additional Context: seed={seed}-{int(time.time())}'''
        response = model.generate_content(prompt)
        text = (response.text or "").strip()
        if not text or "Question:" not in text or "Correct Answer:" not in text:
            raise ValueError("Invalid question format from AI")
        return {
            "question": text,
            "metadata": {"moduleId": body.moduleId.strip(), "questionType": qtype, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seed": f"{seed}-{int(time.time())}"},
        }
    except Exception as e:
        fallback = FALLBACK_QUESTIONS.get(body.moduleId) or {
            "question": "Question: What is the primary objective of women's legal rights education?\nA) To create dependency on legal system\nB) To empower women with knowledge of their rights\nC) To increase legal disputes\nD) To discourage women from seeking justice\nCorrect Answer: B",
            "metadata": {"moduleId": body.moduleId or "general", "questionType": "conceptual", "fallback": True},
        }
        fallback["metadata"]["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return fallback


def _parse_base64_image(data_url_or_base64: str):
    """Accept data URL (data:image/...;base64,...) or raw base64; return (base64_str, mime_type)."""
    s = (data_url_or_base64 or "").strip()
    if not s:
        return None, None
    if s.startswith("data:"):
        # data:image/jpeg;base64,xxxx
        parts = s.split(",", 1)
        if len(parts) != 2:
            return None, None
        header = parts[0].lower()
        mime = "image/jpeg"
        if "image/png" in header:
            mime = "image/png"
        elif "image/webp" in header:
            mime = "image/webp"
        return parts[1].strip(), mime
    return s, "image/jpeg"


@router.post("/chatbot")
def chatbot(body: AIChatbotBody):
    message = (body.message or "").strip()[:1000]
    has_image = bool(body.imageBase64 and (body.imageBase64.strip() if isinstance(body.imageBase64, str) else True))
    if not message and not has_image:
        raise HTTPException(status_code=400, detail="Message or image is required")
    context = (body.context or "General legal education and support for women in India")
    # Normalize image: support data URL or raw base64 from frontend
    image_b64, image_mime = None, None
    if body.imageBase64:
        image_b64, image_mime = _parse_base64_image(body.imageBase64)
        image_mime = body.imageMimeType or image_mime or "image/jpeg"
    if image_b64 and not image_mime:
        image_mime = "image/jpeg"
    if not message and image_b64:
        message = "(user sent an image)"

    try:
        model = _get_google_model()
        system = (
            "You are LegalAid AI, a knowledgeable and empathetic assistant specializing in women's rights and laws in India. "
            "Provide detailed, well-structured, and descriptive answers. Use clear headings, bullet points, and numbered lists when helpful. "
            "Explain legal concepts in simple, easy-to-understand language. "
            "Always mention relevant Indian laws, acts, and sections with brief explanations of what they mean. "
            "Include practical steps the user can take and relevant helpline numbers. "
            "Emergency contacts: Police 100, Women's Helpline 181 (24/7), NCW Helpline 7827-170-170, Ambulance 108. "
            "Be thorough but organized — aim for comprehensive yet readable answers."
        )

        hist = []
        if body.history and isinstance(body.history, list):
            for item in body.history[-12:]:
                try:
                    sender = (item.get("sender") or "").lower()
                    text = str(item.get("text") or "").strip()
                    if not text:
                        continue
                    role = "user" if sender == "user" else "model"
                    hist.append({"role": role, "parts": [text[:1500]]})
                except Exception:
                    continue

        chat = model.start_chat(history=hist)
        user_content = f"{system}\n\nContext: {context}\n\nUser: {message or '(no text, see image)'}"
        if image_b64 and image_mime:
            import base64
            import io
            try:
                raw = base64.b64decode(image_b64, validate=True)
            except Exception:
                raw = base64.b64decode(image_b64)
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(raw))
                response = chat.send_message([img, user_content])
            except Exception:
                image_part = {"mime_type": image_mime, "data": raw}
                response = chat.send_message([image_part, user_content])
        else:
            response = chat.send_message(user_content)
        text = (getattr(response, "text", None) or "").strip()
        if not text:
            raise ValueError("Empty AI response")
        enhanced = (
            text
            + "\n\n---\n"
            + "Legal Disclaimer: This is educational information only. For personalized legal advice consult a qualified attorney.\n"
            + "Women's Helpline: 181 | Police: 100 | Ambulance: 108"
        )
        return {"response": enhanced, "metadata": {"aiPowered": True, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "disclaimer": "Educational information only"}}
    except Exception:
        lower = message.lower()
        if "emergency" in lower or "danger" in lower or "help me" in lower or "hurt" in lower or "unsafe" in lower:
            return {"response": "EMERGENCY: Call Police 100, Women's Helpline 181 (24/7), Ambulance 108. Go to a safe place and contact authorities.", "metadata": {"aiPowered": False}}
        if "domestic violence" in lower or "abuse" in lower:
            return {"response": "Under PWDVA 2005, domestic violence includes physical, emotional, sexual, economic abuse. You can get protection orders. Call 181 for help. This is educational only.", "metadata": {"aiPowered": False}}
        if "workplace" in lower or "harassment" in lower or "posh" in lower:
            return {"response": "POSH Act 2013 protects against sexual harassment at work. File complaint with Internal Complaints Committee within 3 months. This is educational only.", "metadata": {"aiPowered": False}}
        return {"response": "I specialize in women's rights in India (domestic violence, workplace harassment, marriage, property). Please share your specific question. Helpline: 181.", "metadata": {"aiPowered": False}}
