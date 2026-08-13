import os
import requests
import json
import re

ENGLISH_PROMPT_TEMPLATE = """Generate the solution for the given Verbal Ability question in a clear, structured, and concise format.

Start by identifying the relevant concept or reasoning approach required to solve the question. Explain the concept only to the extent necessary to understand why the correct option works.

Then explain the question by directly referring to the given passage, sentence, word, grammar rule, or arrangement, depending on the question type. The explanation should show the reasoning that leads to the correct answer rather than simply stating the answer.

For Reading Comprehension questions, first refer to the relevant idea or statement from the passage and explain how it supports the correct option. Then briefly explain why each of the other options is incorrect. The explanation should distinguish between the main purpose of the passage and points that are merely supporting details.

For Sentence Completion questions, identify what the blank requires from the context, such as a particular meaning, grammatical structure, tone, or idiomatic expression. Explain why the correct option fits the context and briefly explain why the other options do not.

For Sentence Correction and Grammar questions, first state the relevant grammatical rule. Then apply that rule to the sentence and explain why the correct option is grammatically appropriate. Mention why the other options are incorrect wherever relevant.

For Para Completion questions, first identify the logical structure of the paragraph. Explain what idea should come before and after the blank and how the correct option maintains the flow of the paragraph. Briefly explain why the other options disrupt the logical progression.

For Vocabulary questions, identify the meaning or contextual requirement of the word. Explain what the sentence or passage requires and evaluate the options accordingly. If none of the options is a perfect fit, identify the least incorrect option and explain why it is the best available choice.

For Para Jumbles, identify the logical links between the sentences. Pay particular attention to pronouns, connectors, transition words, examples, cause-and-effect relationships, chronology, and introductory or concluding statements. Establish the necessary sentence pairs or sequences and then explain how they combine to form the final order.

For Idioms and Phrases, explain the meaning of the idiom in the given context and then compare it with the meanings of the options.

For Analogies, first identify the exact relationship between the two words in the question. Then check each option for the same relationship and explain why the correct pair matches it.

For questions involving spelling, punctuation, or other language conventions, state the relevant rule and then apply it directly to the options.

The explanation should be written in natural, connected paragraphs. Do not use bullet points, numbered points, tables, emojis, icons, arrows, or any other decorative symbols. Do not use bold, italics, underlining, or highlighted text.

Use clear headings such as “Concept”, “Explanation”, “Option Elimination”, and “Answer” only when they are relevant to the question. Do not force every heading into every solution.

Maintain proper spacing between sections and paragraphs. Do not leave unnecessary blank lines between the question number and the question itself.

Do not simply repeat the question or passage unnecessarily. Quote only the specific word, phrase, or sentence needed to establish the reasoning.

For incorrect options, explain the exact reason they fail rather than merely saying that they are incorrect. Keep these explanations concise but sufficiently clear for a student preparing for management entrance examinations.

The final answer should always end with the correct option in a boxed format using LaTeX.

Use this structure wherever applicable:

Concept

[Explain the relevant concept or rule.]

Explanation

[Explain the reasoning using the given question, passage, sentence, word, or arrangement.]

Option Elimination

[Explain why the other options are incorrect, in continuous prose without bullets or numbering.]

Answer

\\boxed{\\text{Option X: [Correct Answer]}}

Do not introduce information that is not supported by the question. The explanation should remain focused on solving the given question and should be written at the level appropriate for IPMAT, JIPMAT, and other undergraduate management entrance examinations.

Question:
{question_text}

Options:
{opts_str}"""

QUANTS_PROMPT_TEMPLATE = """Generate the solution for the given Quantitative Ability question in a clear, structured, and student-friendly format suitable for IPMAT, JIPMAT, and other undergraduate management entrance examinations.

The solution should not merely provide calculations. It should explain what the question is asking, identify the relevant concept, show the solution step by step, and arrive at the final answer.

Start by stating exactly what the question is asking us to find. This should be written in simple language so that the student immediately understands the objective of the question.

Then identify the concept being tested. Explain the general idea behind the concept in the context of the question. For example, explain that whenever certain quantities, conditions, or relationships are given, we use a particular concept or method to determine the required quantity. Keep the explanation relevant to the question and do not give unnecessary theoretical information.

Then solve the question step by step. Every important mathematical step should be shown clearly. Do not skip intermediate calculations when they are necessary for understanding the logic. Explain why each step is being performed rather than simply writing a sequence of equations.

Use proper mathematical notation and LaTeX formatting throughout the solution. All mathematical expressions, equations, fractions, powers, roots, inequalities, combinations, permutations, and variables should be written in LaTeX.

If the question involves multiple cases or possibilities, identify them systematically and make sure that no valid case is missed and no invalid case is included. When eliminating a case, briefly explain why it is not possible.

If the question can be solved using an alternative approach that is meaningfully different from the primary approach, provide it after the main solution under the heading “Alternative Approach”. Do not provide an alternative approach merely for the sake of adding one. If there is no useful alternative approach, omit this section.

If a formula is used in the solution and remembering that formula would be useful for solving similar questions, add a section at the end titled “Remember”. State the relevant formula clearly in LaTeX and briefly mention what the formula is used for. Do not add a formula section if there is no important formula to remember.

The final answer should always be given separately at the end under the heading “Final Answer”. The answer should be concise and presented in a boxed LaTeX format.

Use the following structure:

What is the question asking?

[Clearly state what quantity, value, number, probability, arrangement, etc. the question requires us to find.]

Concept

[Explain the mathematical concept being tested. Explain the general relationship or rule: whenever these conditions are given, this is the method we use to find the required quantity.]

Solution

[Work through the question step by step. Explain the reasoning behind each major step and show all necessary calculations in LaTeX.]

[If there are multiple cases, handle them systematically and explain why each case is valid or invalid.]

Alternative Approach

[Only include this section if there is a genuinely useful alternative method.]

Remember

[Only include this section when an important formula or standard relationship has been applied.]

[Formula in LaTeX]

[Brief explanation of what the formula is used for.]

Final Answer

\\boxed{\\text{[Final answer]}}

Do not use bullet points, numbered lists, emojis, icons, arrows, decorative symbols, or tables. Write the explanation in continuous, well-spaced paragraphs.

Do not use bold, italics, underlining, or highlighted text.

Do not write unnecessary introductory statements such as “Let’s solve this question” or “Here is the solution.” Begin directly with “What is the question asking?” or the relevant section.

Do not skip mathematical reasoning merely because the calculation appears obvious. However, avoid excessive explanation of very basic arithmetic.

If the question is time-consuming but conceptually straightforward, you may mention this briefly at the beginning, for example: “This is a time-taking question, but the concept involved is straightforward.” Do not describe a question as difficult or impossible unless the question genuinely requires an unusually advanced method.

For questions involving counting, permutations, combinations, probability, algebra, arithmetic, geometry, number systems, percentages, ratios, averages, functions, sequences, or other Quantitative Ability topics, adapt the “Concept” and “Solution” sections to the specific mathematical concept being tested.

For counting and arrangement questions, clearly identify the objects being arranged, the restrictions or conditions imposed, and whether the positions or objects are being selected first. Explain why multiplication, addition, permutations, or combinations are being used.

For algebraic questions, clearly define the variables and transform the given conditions step by step. Do not jump directly from the given expression to the answer.

For number-system questions, clearly identify the relevant property, divisibility condition, parity condition, factorisation, remainder relationship, or other number-system concept before applying it.

For geometry questions, identify the relevant geometric property or theorem before applying it. Clearly show how the given dimensions or relationships lead to the required quantity.

For arithmetic questions involving percentages, ratios, averages, mixtures, profit and loss, time and work, time-speed-distance, or similar topics, identify the underlying relationship before substituting values.

For questions involving equations or inequalities, maintain the correct mathematical direction and explain any restrictions on the variables.

For questions involving cases, explicitly state when the maximum or minimum possible value has been reached so that the student understands why the case analysis stops.

The final solution should be accurate, logically complete, and easy for a student to revise later. The purpose is not only to obtain the answer but to make the method reusable for similar questions.

The answer must end with the boxed final answer and should contain no additional commentary after it.

Question:
{question_text}

Options:
{opts_str}"""

def clean_text_formatting(text: str) -> str:
    r"""
    Cleans text according to formatting rules:
    1. Remove markdown heading tags (#).
    2. Remove bold formatting syntax (** or __).
    3. Clean up excess spacing while maintaining paragraph double newlines.
    """
    if not text:
        return ""

    # Remove markdown headings (#)
    text = re.sub(r'#+\s*', '', text)

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

def generate_ai_hint_abacus(question_text: str, options: list = None, abacus_key: str = None, subject: str = "English", model: str = "gpt-4o") -> str:
    """
    Generates a complete solution and explanation for a question using Abacus.AI API.
    Supports RouteLLM OpenAI-compatible endpoints as well as direct Abacus REST endpoints.
    """
    key = abacus_key if abacus_key and abacus_key.strip() else os.environ.get("ABACUS_API_KEY", "")
    
    if not key or not key.strip():
        raise ValueError("Abacus.AI API Key is missing. Click 'AI Settings' in top navbar to enter your Abacus.AI API key.")

    key = key.strip()
    options = options or []
    
    opts_lines = []
    if options:
        for idx, opt in enumerate(options):
            if isinstance(opt, dict):
                opt_text = opt.get('text', '')
                is_correct = opt.get('isCorrect', False)
            else:
                opt_text = str(opt)
                is_correct = False
            letter = chr(65 + idx)
            correct_tag = " (Correct Option)" if is_correct else ""
            opts_lines.append(f"Option {letter}: {opt_text}{correct_tag}")
        opts_str = "\n".join(opts_lines)
    else:
        opts_str = "No options provided"

    # Select subject-specific prompt template
    subj_lower = (subject or "").lower().strip()
    if "quant" in subj_lower or "math" in subj_lower:
        prompt = QUANTS_PROMPT_TEMPLATE.replace("{question_text}", question_text).replace("{opts_str}", opts_str)
    else:
        prompt = ENGLISH_PROMPT_TEMPLATE.replace("{question_text}", question_text).replace("{opts_str}", opts_str)

    model_name = model if model and model.strip() else "gpt-4o"

    # 1. Try RouteLLM / OpenAI-compatible endpoint
    routellm_endpoints = [
        "https://routellm.abacus.ai/v1/chat/completions",
        "https://paas.abacus.ai/v1/chat/completions",
        "https://api.abacus.ai/v1/chat/completions"
    ]

    last_err = ""
    for ep in routellm_endpoints:
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": "You are an expert tutor creating detailed exam question solutions."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 4096
        }
        try:
            res = requests.post(ep, json=payload, headers=headers, timeout=30)
            if res.status_code == 200:
                res_data = res.json()
                choices = res_data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "").strip()
                    if content:
                        return clean_text_formatting(content)
            elif res.status_code in [400, 401, 403]:
                err_msg = ""
                try: err_msg = res.json().get("error", {}).get("message", res.text)
                except Exception: err_msg = res.text
                if "api key" in err_msg.lower() or "unauthorized" in err_msg.lower() or res.status_code in [401, 403]:
                    raise ValueError(f"Invalid Abacus.AI API Key ({err_msg}). Check key in Abacus.AI account.")
            last_err = f"{ep} ({res.status_code}): {res.text[:150]}"
        except ValueError:
            raise
        except Exception as e:
            last_err = str(e)

    # 2. Try Abacus REST evaluateChatResponse / getChatResponse endpoint as fallback
    v0_endpoints = [
        "https://api.abacus.ai/api/v0/evaluateChatResponse",
        "https://api.abacus.ai/api/v0/getChatResponse"
    ]
    for ep in v0_endpoints:
        headers = {
            "apiKey": key,
            "Content-Type": "application/json"
        }
        payload = {
            "llmName": model_name,
            "messages": [{"is_user": True, "text": prompt}],
            "temperature": 0.2,
            "numCompletionTokens": 4096
        }
        try:
            res = requests.post(ep, json=payload, headers=headers, timeout=30)
            if res.status_code == 200:
                res_data = res.json()
                if res_data.get("success"):
                    result_text = res_data.get("result", {}).get("content") or res_data.get("result", {}).get("text") or res_data.get("result")
                    if isinstance(result_text, str) and result_text.strip():
                        return clean_text_formatting(result_text)
            last_err = f"{ep} ({res.status_code}): {res.text[:150]}"
        except ValueError:
            raise
        except Exception as e:
            last_err = str(e)

    raise RuntimeError(f"Abacus.AI generation failed: {last_err}")


def generate_ai_hint(
    question_text: str,
    options: list = None,
    api_key: str = None,
    subject: str = "English",
    provider: str = "gemini",
    abacus_key: str = None,
    model: str = "gpt-4o"
) -> str:
    """
    Unified entry point for AI hint & solution generation using either
    Google Gemini or Abacus.AI API.
    """
    provider_clean = (provider or "gemini").lower().strip()

    if provider_clean == "abacus":
        return generate_ai_hint_abacus(
            question_text=question_text,
            options=options,
            abacus_key=abacus_key,
            subject=subject,
            model=model
        )

    # Default provider: Google Gemini
    key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    
    if not key or not key.strip():
        # Fall back to Abacus if Abacus Key is present
        if abacus_key and abacus_key.strip():
            return generate_ai_hint_abacus(
                question_text=question_text,
                options=options,
                abacus_key=abacus_key,
                subject=subject,
                model=model
            )
        raise ValueError("Google Gemini API Key is missing. Click 'AI Settings' in top navbar to enter your API key.")

    key = key.strip()
    options = options or []
    
    opts_lines = []
    if options:
        for idx, opt in enumerate(options):
            if isinstance(opt, dict):
                opt_text = opt.get('text', '')
                is_correct = opt.get('isCorrect', False)
            else:
                opt_text = str(opt)
                is_correct = False
            letter = chr(65 + idx)
            correct_tag = " (Correct Option)" if is_correct else ""
            opts_lines.append(f"Option {letter}: {opt_text}{correct_tag}")
        opts_str = "\n".join(opts_lines)
    else:
        opts_str = "No options provided"

    # Select subject-specific prompt template
    subj_lower = (subject or "").lower().strip()
    if "quant" in subj_lower or "math" in subj_lower:
        prompt = QUANTS_PROMPT_TEMPLATE.replace("{question_text}", question_text).replace("{opts_str}", opts_str)
    else:
        prompt = ENGLISH_PROMPT_TEMPLATE.replace("{question_text}", question_text).replace("{opts_str}", opts_str)

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

    raise RuntimeError(f"Could not generate solution: {last_err}")



