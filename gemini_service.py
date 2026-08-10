import os
import requests
import json

def generate_ai_hint(question_text: str, options: list = None, api_key: str = None) -> str:
    """
    Generates a clear, step-by-step hint/explanation for a multiple-choice question
    using the Google Gemini API.
    """
    key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    
    if not key or not key.strip():
        raise ValueError("Google Gemini API Key is missing. Please click 'Gemini Key' in the top right to enter your free API Key.")

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

    # Supported Gemini models in priority order
    model_candidates = [
        ("v1beta", "gemini-2.0-flash"),
        ("v1beta", "gemini-1.5-flash-latest"),
        ("v1beta", "gemini-2.0-flash-exp"),
        ("v1beta", "gemini-1.5-flash-002"),
        ("v1beta", "gemini-1.5-pro-latest"),
        ("v1", "gemini-1.5-flash")
    ]

    last_error_msg = ""

    for version, model in model_candidates:
        url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=20)
            if res.status_code == 200:
                data = res.json()
                text = data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text
            
            res_json = {}
            try:
                res_json = res.json()
            except Exception:
                pass
            
            err_detail = res_json.get("error", {}).get("message", res.text)
            
            if res.status_code in [400, 403] and "API_KEY" in err_detail.upper():
                raise ValueError(f"Invalid or Expired Gemini API Key. Please check your key at https://aistudio.google.com/app/apikey ({err_detail})")
            
            last_error_msg = f"{model} ({res.status_code}): {err_detail}"
            
        except ValueError:
            raise
        except Exception as e:
            last_error_msg = str(e)

    raise RuntimeError(f"Could not connect to Gemini API: {last_error_msg}")
