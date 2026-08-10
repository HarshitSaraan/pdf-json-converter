import os
import requests
import json

def generate_ai_hint(question_text: str, options: list = None, api_key: str = None) -> str:
    """
    Generates a clear, step-by-step hint/explanation for a multiple-choice question
    using the Google Gemini API with dynamic model discovery.
    """
    key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    
    if not key or not key.strip():
        raise ValueError("Google Gemini API Key is missing. Click 'Gemini Key' in the top right of the page to enter your free API key.")

    key = key.strip()
    options = options or []
    
    opts_str = "\n".join([f"- {o.get('text', '')}" for o in options]) if options else "No options provided"
    
    prompt = f"""You are an expert academic tutor. Generate a complete, clear, step-by-step solution and explanation for the following multiple choice question.

Instructions:
1. Use LaTeX delimiters ($...$) for any mathematical expressions, variables, formulas, or equations (e.g. $2x + 5 = 15$).
2. Provide a complete explanation from start to finish without cutting off.
3. State the correct answer clearly at the end.

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
            "maxOutputTokens": 2048
        }
    }
    headers = {"Content-Type": "application/json"}

    # 1. Dynamically query available models for this specific API Key
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    discovered_models = []
    
    try:
        r = requests.get(list_url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            for m in data.get("models", []):
                m_name = m.get("name", "") # e.g. "models/gemini-1.5-flash-latest"
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    discovered_models.append(m_name)
        elif r.status_code in [400, 403]:
            err_msg = r.json().get("error", {}).get("message", "API key invalid.")
            raise ValueError(f"Invalid Gemini API Key ({err_msg}). Get a free API Key at https://aistudio.google.com/app/apikey")
    except ValueError:
        raise
    except Exception as e:
        print(f"ListModels lookup warning: {e}")

    # Default fallback models if discovery fails
    if not discovered_models:
        discovered_models = [
            "models/gemini-2.0-flash",
            "models/gemini-1.5-flash-latest",
            "models/gemini-1.5-flash",
            "models/gemini-2.0-flash-exp",
            "models/gemini-1.5-pro-latest"
        ]

    # Prioritize 2.0-flash and 1.5-flash models
    def model_priority(m):
        m_lower = m.lower()
        if "2.0-flash" in m_lower: return 0
        if "1.5-flash" in m_lower: return 1
        if "flash" in m_lower: return 2
        return 3

    discovered_models.sort(key=model_priority)

    # 2. Call generateContent on discovered model
    last_err = ""
    for m_full_name in discovered_models:
        # Strip "models/" prefix if present to format URL
        clean_model_name = m_full_name.replace("models/", "")
        gen_url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model_name}:generateContent?key={key}"
        
        try:
            res = requests.post(gen_url, json=payload, headers=headers, timeout=20)
            if res.status_code == 200:
                res_data = res.json()
                text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
                return text
            
            err_json = {}
            try: err_json = res.json()
            except Exception: pass
            
            err_msg = err_json.get("error", {}).get("message", res.text)
            if res.status_code in [400, 403] and "API_KEY" in err_msg.upper():
                raise ValueError(f"Invalid Gemini API Key ({err_msg}). Get a free key at https://aistudio.google.com/app/apikey")
                
            last_err = f"{clean_model_name} ({res.status_code}): {err_msg}"
        except ValueError:
            raise
        except Exception as e:
            last_err = str(e)

    raise RuntimeError(f"Could not generate hint: {last_err}")
