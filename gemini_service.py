import os
import requests
import json
import re

def clean_text_formatting(text: str) -> str:
    r"""
    Cleans text according to exact formatting rules:
    1. Use inline-safe LaTeX only ($...$), convert \[ ... \] or $$ ... $$ to $...$.
    2. Don't write step 1, step 2... instead just line by line.
    3. Don't use bold letters (remove ** and __).
    4. Don't use ### or # headings.
    """
    if not text:
        return ""

    # Remove markdown headings and '###'
    text = re.sub(r'#+\s*', '', text)

    # Convert display LaTeX \[...\] or $$...$$ to inline $...$
    text = text.replace(r'\[', '$').replace(r'\]', '$')
    text = text.replace('$$', '$')

    # Remove newlines inside $...$ to ensure inline-safety (same line)
    def inline_latex(match):
        latex_content = match.group(1).strip()
        latex_content = re.sub(r'\s+', ' ', latex_content)
        return f"${latex_content}$"
    text = re.sub(r'\$([^\$\n]+)\$', inline_latex, text)

    # Remove "Step 1", "Step 2", "Step 1:", "Step 2.", "Step 1 -", etc.
    text = re.sub(r'(?i)\bStep\s*\d+[:\.-]?\s*', '', text)

    # Remove bold syntax (**text** or __text__ or stray ** / __)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    text = text.replace('**', '').replace('__', '')

    # Clean up excess spaces / blank lines
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines).strip()
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text

def generate_ai_hint(question_text: str, options: list = None, api_key: str = None) -> str:
    """
    Generates a complete, line-by-line hint/explanation for a multiple-choice question
    using the Google Gemini API with dynamic model discovery.
    """
    key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    
    if not key or not key.strip():
        raise ValueError("Google Gemini API Key is missing. Click 'Gemini Key' in the top right of the page to enter your free API key.")

    key = key.strip()
    options = options or []
    
    opts_str = "\n".join([f"- {o.get('text', '')}" for o in options]) if options else "No options provided"
    
    prompt = f"""You are an expert academic tutor. Generate a complete, clear, line-by-line solution and explanation for the following multiple choice question.

CRITICAL FORMATTING RULES YOU MUST FOLLOW STRICTLY:
1. Use inline-safe LaTeX ONLY with single dollar signs: $...$ for any mathematical expressions, variables, formulas, or equations (e.g. $2x + 5 = 15$). NEVER use display LaTeX delimiters like \\[ \\] or $$.
2. Do NOT write "Step 1", "Step 2", "Step 3", etc. Write the solution line by line in clean consecutive normal sentences without step numbers or step titles.
3. Do NOT use bold letters or bold markdown syntax (do NOT use ** or __ anywhere).
4. Do NOT use ### or any markdown heading tags anywhere in the output.

Question:
{question_text}

Options:
{opts_str}

Solution & Explanation:"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
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
            res = requests.post(gen_url, json=payload, headers=headers, timeout=25)
            if res.status_code == 200:
                res_data = res.json()
                candidates = res_data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    text = "\n".join([p.get('text', '') for p in parts if 'text' in p]).strip()
                    if text:
                        return clean_text_formatting(text)
            
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

