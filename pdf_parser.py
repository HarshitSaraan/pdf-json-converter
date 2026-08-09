import re
import fitz  # PyMuPDF
import pdfplumber
import pypdf

def extract_raw_text(pdf_path: str) -> str:
    """Extract raw text from PDF using PyMuPDF with fallback to pdfplumber / pypdf."""
    full_text = ""
    try:
        doc = fitz.open(pdf_path)
        pages_text = []
        for page in doc:
            t = page.get_text("text")
            if t:
                pages_text.append(t)
        full_text = "\n".join(pages_text)
    except Exception as e:
        print(f"PyMuPDF extraction failed: {e}")

    if not full_text.strip():
        try:
            with pdfplumber.open(pdf_path) as pdf:
                pages_text = [p.extract_text() or "" for p in pdf.pages]
                full_text = "\n".join(pages_text)
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")

    if not full_text.strip():
        try:
            reader = pypdf.PdfReader(pdf_path)
            pages_text = [p.extract_text() or "" for p in reader.pages]
            full_text = "\n".join(pages_text)
        except Exception as e:
            print(f"pypdf extraction failed: {e}")

    return full_text

def format_math_latex(text: str) -> str:
    """Ensure math expressions are properly formatted."""
    if not text:
        return ""
    # Clean up double spaces or orphan line breaks
    text = re.sub(r'[ \t]+', ' ', text).strip()
    return text

OFFICIAL_TAXONOMY = {
    "VA": [
        "RC",
        "Para Completion",
        "Para Jumbles",
        "Sentence Correction",
        "Spellings",
        "Verbal Analogy"
    ],
    "Vocabulary": [
        "Idioms & Phrases",
        "Antonyms",
        "Synonyms",
        "Definition"
    ],
    "Grammar": [
        "Active & Passive Voice",
        "Direct & Indirect Speech",
        "Error",
        "Punctuations",
        "Parts of Speech",
        "Subject–Verb Agreement"
    ]
}

TAXONOMY_PATTERNS = [
    # Vocabulary
    ("Vocabulary", "Definition", [r'meaning of', r'what does .* mean', r'definition of', r'word .* means', r'describes something']),
    ("Vocabulary", "Idioms & Phrases", [r'idiom', r'phrasal verb', r'meaning/phrasal verb', r'went by the book', r'blow the whistle', r'devil\'s advocate', r'spill the beans', r'phrase', r'proverb']),
    ("Vocabulary", "Synonyms", [r'synonym', r'similar in meaning', r'closest in meaning', r'same meaning', r'nearest in meaning']),
    ("Vocabulary", "Antonyms", [r'antonym', r'opposite in meaning', r'contrary in meaning', r'furthest in meaning', r'reverse in meaning']),
    ("Vocabulary", "Spellings", [r'correctly spelt', r'misspelt', r'spelling', r'correct spelling', r'incorrectly spelt']),
    
    # Grammar
    ("Grammar", "Active & Passive Voice", [r'active voice', r'passive voice', r'change the voice', r'convert into passive', r'convert into active']),
    ("Grammar", "Direct & Indirect Speech", [r'direct speech', r'indirect speech', r'reported speech', r'convert into indirect', r'said that']),
    ("Grammar", "Error", [r'spot the error', r'error spotting', r'find the error', r'grammatically incorrect', r'error in part']),
    ("Grammar", "Punctuations", [r'punctuation', r'comma', r'semicolon', r'apostrophe', r'properly punctuated', r'pantuations']),
    ("Grammar", "Parts of Speech", [r'parts of speech', r'noun', r'verb', r'adjective', r'adverb', r'preposition', r'conjunction', r'pronoun']),
    ("Grammar", "Subject–Verb Agreement", [r'subject-verb', r'subject verb agreement', r'singular verb', r'plural verb', r'agrees with subject']),
    
    # VA
    ("VA", "RC", [r'passage', r'according to the passage', r'author implies', r'main idea', r'reading comprehension', r'passage below']),
    ("VA", "Para Completion", [r'complete the paragraph', r'para completion', r'completes the paragraph', r'sentence fits best']),
    ("VA", "Para Jumbles", [r'para jumble', r'rearrange', r'jumbled', r'proper sequence', r'logical order', r'sentence A, B, C']),
    ("VA", "Sentence Correction", [r'sentence correction', r'phrase replacement', r'sentence improvement', r'replace the underlined']),
    ("VA", "Spellings", [r'spelling', r'spelt']),
    ("VA", "Verbal Analogy", [r'analogy', r'is to', r'analogous', r'verbal analogy'])
]

def auto_classify_topic_subtopic(question_text: str, hint_text: str = "", default_topic: str = "Vocabulary", default_subtopic: str = "Definition"):
    """Classifies a question into the official 3-topic taxonomy automatically."""
    combined = (question_text + " " + hint_text).lower()
    for topic, subtopic, patterns in TAXONOMY_PATTERNS:
        for pat in patterns:
            if re.search(pat, combined):
                return topic, subtopic
    return default_topic, default_subtopic

def parse_pdf_questions(pdf_path: str, default_topic: str = "algebra", default_subtopic: str = "indices") -> list:
    """
    Parses a question paper PDF and converts its content into the target JSON structure:
    [
      {
        "questionText": "Solve $2x + 5 = 15$",
        "hint": "Solve $2x + 5 = 15$",
        "topic": "algebra",
        "subtopic": "indices",
        "options": [
          { "text": "$x=3$", "isCorrect": false },
          { "text": "$x=5$", "isCorrect": true },
          { "text": "$x=7$", "isCorrect": false },
          { "text": "$x=10$", "isCorrect": false }
        ]
      }
    ]
    """
    text = extract_raw_text(pdf_path)
    if not text:
        return []

    # Detect header title if present
    header_match = re.search(r'^(.*?)(?=\n|Q\d+)', text, re.IGNORECASE)
    detected_topic = default_topic
    if header_match and len(header_match.group(1).strip()) > 3:
        clean_header = header_match.group(1).strip()
        if len(clean_header) < 60:
            detected_topic = clean_header

    # Regex pattern to match question split markers e.g., Q1:, Q2:, Question 1:, 1., etc.
    q_marker_pattern = r'(?:^|\n)\s*(?:Q\s*\d+[:\.]|Question\s+\d+[:\.]|\b\d+[\.\)])\s*'
    
    # Split document by question markers while preserving match offsets
    matches = list(re.finditer(q_marker_pattern, text, re.MULTILINE | re.IGNORECASE))
    
    if not matches:
        # Fallback: try splitting by empty lines or numbered paragraphs
        matches = list(re.finditer(r'(?:^|\n)\s*(\d+[\.\)]|\([0-9]+\))\s*', text, re.MULTILINE))

    question_blocks = []
    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
        block_text = text[start_idx:end_idx].strip()
        question_blocks.append(block_text)

    parsed_questions = []

    for block in question_blocks:
        # Separate question title/marker
        marker_match = re.match(r'^(Q\s*\d+[:\.]|Question\s+\d+[:\.]|\d+[\.\)])\s*', block, re.IGNORECASE)
        body = block
        if marker_match:
            body = block[marker_match.end():].strip()

        # Isolate Solution / Explanation / Hint / Why wrong sections from PDF
        sol_parts = []
        
        # 1. Check for Explanation / Solution / Sol / Hint / Reason
        exp_match = re.search(r'(?:Explanation|Solution|Sol|Hint|Reason|Rationale):\s*(.*?)(?=(?:Why the other options are wrong:|Correct Answer:|Answer:|Key:|$))', body, re.DOTALL | re.IGNORECASE)
        if exp_match:
            exp_text = exp_match.group(1).strip()
            if exp_text and len(exp_text) > 2:
                sol_parts.append(exp_text)

        # 2. Check for "Why the other options are wrong" section
        why_wrong_match = re.search(r'Why the other options are wrong:?\s*(.*?)(?=(?:Q\s*\d+[:\.]|Question\s+\d+[:\.]|\b\d+[\.\)]|$))', body, re.DOTALL | re.IGNORECASE)
        if why_wrong_match:
            why_text = why_wrong_match.group(1).strip()
            if why_text and len(why_text) > 2:
                sol_parts.append("Why the other options are wrong:\n" + why_text)

        # Trim body to remove explanation and why wrong text before extracting options
        clean_body = body
        if why_wrong_match:
            clean_body = clean_body[:why_wrong_match.start()].strip()
        if exp_match:
            clean_body = clean_body[:exp_match.start()].strip()

        # Isolate Correct Answer line
        correct_answer_str = ""
        correct_letter = ""
        ans_match = re.search(r'(?:Correct Answer|Answer|Key):\s*([A-D])\)?\s*(.*)', clean_body, re.IGNORECASE)
        if ans_match:
            correct_letter = ans_match.group(1).upper()
            correct_answer_str = ans_match.group(2).strip()
            # Check if there is text after answer line that wasn't prefixed with Explanation:
            post_ans_text = clean_body[ans_match.end():].strip()
            if post_ans_text and not sol_parts:
                sol_parts.append(post_ans_text)
            clean_body = clean_body[:ans_match.start()].strip()

        # Find option start (e.g. A), (A), A., a), etc.)
        opt_start_match = re.search(r'(?:^|\n)\s*([A-D][\.\)]|\([A-D]\))\s*', clean_body, re.IGNORECASE)
        
        if opt_start_match:
            question_text = clean_body[:opt_start_match.start()].strip()
            options_text = clean_body[opt_start_match.start():].strip()
        else:
            question_text = clean_body.strip()
            options_text = ""

        # Extract Options A, B, C, D
        raw_options = []
        if options_text:
            opt_matches = list(re.finditer(r'(?:^|\n)\s*([A-D])[\.\)]|\(([A-D])\)', options_text, re.IGNORECASE))
            for idx in range(len(opt_matches)):
                op_m = opt_matches[idx]
                letter = (op_m.group(1) or op_m.group(2)).upper()
                start_op = op_m.end()
                end_op = opt_matches[idx+1].start() if idx + 1 < len(opt_matches) else len(options_text)
                opt_val = options_text[start_op:end_op].strip()
                raw_options.append((letter, opt_val))

        # Build options objects
        formatted_options = []
        for letter, opt_val in raw_options:
            is_corr = False
            if correct_letter:
                is_corr = (letter == correct_letter)
            elif correct_answer_str and opt_val and (opt_val in correct_answer_str or correct_answer_str in opt_val):
                is_corr = True

            formatted_options.append({
                "text": format_math_latex(opt_val),
                "isCorrect": is_corr
            })

        # Ensure at least 1 option marked correct if correct letter specified
        if correct_letter and formatted_options:
            for opt, (letter, _) in zip(formatted_options, raw_options):
                if letter == correct_letter:
                    opt["isCorrect"] = True

        # Formulate hint from extracted PDF solution parts
        if sol_parts:
            hint = "\n\n".join(sol_parts)
        else:
            hint = question_text

        # Clean question text and hint
        question_text = format_math_latex(question_text)
        hint = format_math_latex(hint)

        if question_text:
            # Auto-classify into official taxonomy (VA, Vocabulary, Grammar)
            auto_top, auto_sub = auto_classify_topic_subtopic(question_text, hint, default_topic, default_subtopic)
            parsed_questions.append({
                "questionText": question_text,
                "hint": hint,
                "topic": auto_top,
                "subtopic": auto_sub,
                "options": formatted_options
            })

    return parsed_questions
