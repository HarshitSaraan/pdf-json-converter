import os
import requests
import json

def generate_ai_hint(question_text: str, options: list = None, api_key: str = None) -> str:
    """
    Generates a clear, step-by-step hint/explanation for a multiple-choice question
    using the Google Gemini API (gemini-2.0-flash / gemini-1.5-flash).
    """
    key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    
    if not key or not key.strip():
        raise ValueError("Google Gemini API Key is missing. Please set GEMINI_API_KEY or enter your API key in Settings.")

    key = key.strip()
    options = options or []
    
    opts_str = "\n".join([f"- {o.get('text', '')}" for o in options]) if options else "No options provided"
    
    prompt = f"""You are an expert academic tutor. Generate a clear, concise, step-by-step hint/explanation for the following multiple choice question. Use LaTeX delimiters ($...$) for any mathematical expressions, formulas, symbols or equations. Keep the explanation direct, educational, and easy to understand.

Question:
{question_text}

Options:
{opts_str}

Explanation:"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 600
        }
    }
    headers = {"Content-Type": "application/json"}

    # Try gemini-2.0-flash first, fallback to gemini-1.5-flash
    models = ["gemini-2.0-flash", "gemini-1.5-flash"]
    last_err = ""

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=20)
            if res.status_code == 200:
                data = res.json()
                text = data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text
            else:
                last_err = f"Gemini API returned status {res.status_code}: {res.text}"
        except Exception as e:
            last_err = str(e)

    raise RuntimeError(f"Failed to generate hint with Gemini: {last_err}")
