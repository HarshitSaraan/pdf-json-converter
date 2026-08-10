import re
import os
import pypdf
import docx

def extract_raw_text(file_path: str) -> str:
    """Extract raw text from PDF or DOCX file."""
    ext = os.path.splitext(file_path)[1].lower()
    full_text = ""

    if ext in ['.docx', '.doc']:
        try:
            doc = docx.Document(file_path)
            lines = []
            for p in doc.paragraphs:
                if p.text.strip():
                    lines.append(p.text.strip())
            for t in doc.tables:
                for row in t.rows:
                    row_txt = ' | '.join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_txt:
                        lines.append(row_txt)
            full_text = "\n".join(lines)
        except Exception as e:
            print(f"docx extraction failed: {e}")

    if not full_text.strip():
        # Try pypdf (pure Python, lightweight for Vercel serverless)
        try:
            reader = pypdf.PdfReader(file_path)
            pages_text = [p.extract_text() or "" for p in reader.pages]
            full_text = "\n".join(pages_text)
        except Exception as e:
            print(f"pypdf extraction failed: {e}")

    if not full_text.strip():
        try:
            import fitz
            doc = fitz.open(file_path)
            pages_text = [page.get_text("text") or "" for page in doc]
            full_text = "\n".join(pages_text)
        except Exception as e:
            print(f"fitz extraction failed: {e}")

    if not full_text.strip():
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                pages_text = [p.extract_text() or "" for p in pdf.pages]
                full_text = "\n".join(pages_text)
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")

    return full_text

def format_math_latex(text: str) -> str:
    """Ensure math expressions are properly formatted."""
    if not text:
        return ""
    text = re.sub(r'[ \t]+', ' ', text).strip()
    return text

OFFICIAL_TAXONOMY = {
    "English": {
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
    },
    "Quants": {
        "Arithmetic": [
            "Averages",
            "Mixtures & Alligation",
            "Percentages",
            "Profit & Loss",
            "Ratio & Proportion",
            "SI/CI",
            "Time & Work",
            "Time–Speed–Distance"
        ],
        "Number System": [
            "Digit properties",
            "Divisibility rules",
            "Factorials",
            "Factorization",
            "Factors/Multiples",
            "HCF/LCM",
            "Integral Solution",
            "Miscellaneous",
            "Remainders",
            "Unit digits"
        ],
        "Algebra": [
            "Binomial Theorem",
            "Matrices & Determinants",
            "Algebraic identities",
            "Functions",
            "Indices & Surds",
            "Inequalities",
            "Linear/Quadratic equations",
            "Maxima & Minima",
            "Modulus",
            "Polynomials",
            "Progressions",
            "Sets"
        ],
        "Geometry & Mensuration": [
            "Area & Perimeter",
            "Circles",
            "Coordinate Geometry",
            "Heights & Distances",
            "Lines & Angles",
            "Polygons",
            "Quadrilaterals",
            "Solids",
            "Triangles",
            "Trigonometry"
        ],
        "Modern Maths": [
            "Binomial Theorem",
            "Logarithm",
            "Matrices & Determinants",
            "P & C",
            "Probability",
            "Set Theory"
        ]
    }
}

ENGLISH_PATTERNS = [
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

QUANTS_PATTERNS = [
    # Arithmetic
    ("Arithmetic", "Averages", [r'average', r'mean', r'weighted average']),
    ("Arithmetic", "Mixtures & Alligation", [r'mixture', r'alligation', r'solution contains', r'milk and water']),
    ("Arithmetic", "Percentages", [r'percent', r'percentage', r'increase by', r'decrease by']),
    ("Arithmetic", "Profit & Loss", [r'cost price', r'selling price', r'profit', r'loss', r'discount', r'marked price']),
    ("Arithmetic", "Ratio & Proportion", [r'ratio', r'proportion', r'proportional', r'divided in the ratio']),
    ("Arithmetic", "SI/CI", [r'simple interest', r'compound interest', r'principal', r'rate of interest', r'annually']),
    ("Arithmetic", "Time & Work", [r'time and work', r'efficiency', r'pipes and cistern', r'days to complete']),
    ("Arithmetic", "Time–Speed–Distance", [r'speed', r'distance', r'train', r'relative speed', r'boat and stream', r'km/h', r'm/s']),

    # Number System
    ("Number System", "Digit properties", [r'digit', r'unit digit', r'ten\'s digit', r'two-digit number']),
    ("Number System", "Divisibility rules", [r'divisible', r'divisibility', r'multiple of']),
    ("Number System", "Factorials", [r'factorial', r'n!']),
    ("Number System", "Factorization", [r'factorization', r'prime factor']),
    ("Number System", "Factors/Multiples", [r'factors', r'number of factors', r'multiples']),
    ("Number System", "HCF/LCM", [r'hcf', r'lcm', r'greatest common divisor']),
    ("Number System", "Integral Solution", [r'integral solution', r'integer solutions', r'positive integer']),
    ("Number System", "Remainders", [r'remainder', r'remains', r'divided by']),
    ("Number System", "Unit digits", [r'unit digit', r'last digit']),
    ("Number System", "Miscellaneous", [r'number system', r'real number', r'irrational']),

    # Algebra
    ("Algebra", "Binomial Theorem", [r'binomial', r'expansion of', r'coefficient of']),
    ("Algebra", "Matrices & Determinants", [r'matrix', r'matrices', r'determinant', r'eigen']),
    ("Algebra", "Algebraic identities", [r'identity', r'a\^2 \+ b\^2', r'algebraic']),
    ("Algebra", "Functions", [r'function', r'f\(x\)', r'domain', r'range of f']),
    ("Algebra", "Indices & Surds", [r'indices', r'surds', r'exponent', r'power']),
    ("Algebra", "Inequalities", [r'inequality', r'greater than', r'less than', r'linear inequality']),
    ("Algebra", "Linear/Quadratic equations", [r'quadratic', r'roots of', r'equation', r'linear equation']),
    ("Algebra", "Maxima & Minima", [r'maxima', r'minima', r'maximum value', r'minimum value']),
    ("Algebra", "Modulus", [r'modulus', r'\|x\|', r'absolute value']),
    ("Algebra", "Polynomials", [r'polynomial', r'degree of polynomial']),
    ("Algebra", "Progressions", [r'progression', r'arithmetic progression', r'geometric progression', r'ap', r'gp', r'hp']),
    ("Algebra", "Sets", [r'set', r'subset', r'union', r'intersection']),

    # Geometry & Mensuration
    ("Geometry & Mensuration", "Area & Perimeter", [r'area', r'perimeter', r'circumference']),
    ("Geometry & Mensuration", "Circles", [r'circle', r'radius', r'diameter', r'chord', r'tangent']),
    ("Geometry & Mensuration", "Coordinate Geometry", [r'coordinate', r'slope', r'intercept', r'distance formula', r'locus']),
    ("Geometry & Mensuration", "Heights & Distances", [r'angle of elevation', r'angle of depression', r'height', r'tower']),
    ("Geometry & Mensuration", "Lines & Angles", [r'parallel lines', r'transversal', r'angle', r'degree']),
    ("Geometry & Mensuration", "Polygons", [r'polygon', r'hexagon', r'pentagon', r'diagonals of polygon']),
    ("Geometry & Mensuration", "Quadrilaterals", [r'rectangle', r'square', r'parallelogram', r'rhombus', r'trapezium', r'quadrilateral']),
    ("Geometry & Mensuration", "Solids", [r'sphere', r'cylinder', r'cone', r'cube', r'cuboid', r'volume', r'surface area']),
    ("Geometry & Mensuration", "Triangles", [r'triangle', r'hypotenuse', r'isosceles', r'equilateral', r'pythagoras']),
    ("Geometry & Mensuration", "Trigonometry", [r'sin', r'cos', r'tan', r'cot', r'sec', r'cosec', r'trigonometric']),

    # Modern Maths
    ("Modern Maths", "Logarithm", [r'logarithm', r'log', r'log_']),
    ("Modern Maths", "P & C", [r'permutation', r'combination', r'ncr', r'npr', r'arranged', r'selection']),
    ("Modern Maths", "Probability", [r'probability', r'random', r'dice', r'coins', r'cards', r'favourable outcomes']),
    ("Modern Maths", "Set Theory", [r'venn diagram', r'set theory', r'universal set'])
]

def auto_classify_topic_subtopic(question_text: str, hint_text: str = "", subject: str = "English"):
    """Classifies a question into the taxonomy automatically based on chosen subject."""
    combined = (question_text + " " + hint_text).lower()
    
    is_quants = (subject or "").strip().lower() == "quants"
    patterns = QUANTS_PATTERNS if is_quants else ENGLISH_PATTERNS
    
    for topic, subtopic, pats in patterns:
        for pat in pats:
            if re.search(pat, combined):
                return topic, subtopic
                
    if is_quants:
        return "Arithmetic", "Averages"
    else:
        return "Vocabulary", "Definition"

def parse_pdf_questions(file_path: str, subject: str = "English", default_topic: str = None, default_subtopic: str = None) -> list:
    """
    Parses a question paper PDF or DOCX and converts its content into target JSON structure.
    """
    text = extract_raw_text(file_path)
    if not text:
        return []

    q_marker_pattern = r'(?:^|\n)\s*(?:Q\s*\d+[:\.]|Question\s+\d+[:\.]|\b\d+[\.\)])\s*'
    matches = list(re.finditer(q_marker_pattern, text, re.MULTILINE | re.IGNORECASE))
    
    if not matches:
        matches = list(re.finditer(r'(?:^|\n)\s*(\d+[\.\)]|\([0-9]+\))\s*', text, re.MULTILINE))

    question_blocks = []
    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
        block_text = text[start_idx:end_idx].strip()
        question_blocks.append(block_text)

    parsed_questions = []

    for block in question_blocks:
        marker_match = re.match(r'^(Q\s*\d+[:\.]|Question\s+\d+[:\.]|\d+[\.\)])\s*', block, re.IGNORECASE)
        body = block
        if marker_match:
            body = block[marker_match.end():].strip()

        sol_parts = []
        correct_letter = ""

        # Check for (Ans: D) or Ans: D
        ans_inline_match = re.search(r'\(?Ans:\s*([A-D0-9a-zA-Z]+)\)?', body, re.IGNORECASE)
        if ans_inline_match:
            ans_val = ans_inline_match.group(1).strip().upper()
            if ans_val in ['A', 'B', 'C', 'D']:
                correct_letter = ans_val
            sol_parts.append(f"Correct Answer: {ans_val}")
            body = body[:ans_inline_match.start()].strip() + "\n" + body[ans_inline_match.end():].strip()
        
        explanation_parts = []
        
        exp_match = re.search(r'(?:Explanation|Solution|Sol|Hint|Reason|Rationale):\s*(.*?)(?=(?:Why the other options are wrong:|Correct Answer:|Answer:|Key:|$))', body, re.DOTALL | re.IGNORECASE)
        if exp_match:
            exp_text = exp_match.group(1).strip()
            if exp_text and len(exp_text) > 2:
                explanation_parts.append(exp_text)

        why_wrong_match = re.search(r'Why the other options are wrong:?\s*(.*?)(?=(?:Q\s*\d+[:\.]|Question\s+\d+[:\.]|\b\d+[\.\)]|$))', body, re.DOTALL | re.IGNORECASE)
        if why_wrong_match:
            why_text = why_wrong_match.group(1).strip()
            if why_text and len(why_text) > 2:
                explanation_parts.append("Why the other options are wrong:\n" + why_text)

        clean_body = body
        if why_wrong_match:
            clean_body = clean_body[:why_wrong_match.start()].strip()
        if exp_match:
            clean_body = clean_body[:exp_match.start()].strip()

        # Isolate Correct Answer line
        if not correct_letter:
            ans_match = re.search(r'(?:Correct Answer|Answer|Key):\s*([A-D])\)?\s*(.*)', clean_body, re.IGNORECASE)
            if ans_match:
                correct_letter = ans_match.group(1).upper()
                ans_extra = ans_match.group(2).strip()
                if ans_extra:
                    explanation_parts.append(ans_extra)
                clean_body = clean_body[:ans_match.start()].strip()

        # Find option start (e.g. A), (A), A., a), etc.)
        opt_start_match = re.search(r'(?:^|\n|\s{2,})([A-D][\.\)]|\([A-D]\))\s*', clean_body, re.IGNORECASE)
        
        if opt_start_match:
            question_text = clean_body[:opt_start_match.start()].strip()
            options_text = clean_body[opt_start_match.start():].strip()
        else:
            question_text = clean_body.strip()
            options_text = ""

        # Extract Options A, B, C, D
        raw_options = []
        if options_text:
            opt_matches = list(re.finditer(r'(?:^|\n|\s{2,})([A-D])[\.\)]|\(([A-D])\)', options_text, re.IGNORECASE))
            for idx in range(len(opt_matches)):
                op_m = opt_matches[idx]
                letter = (op_m.group(1) or op_m.group(2)).upper()
                start_op = op_m.end()
                end_op = opt_matches[idx+1].start() if idx + 1 < len(opt_matches) else len(options_text)
                opt_val = options_text[start_op:end_op].strip()
                raw_options.append((letter, opt_val))

        formatted_options = []
        for letter, opt_val in raw_options:
            is_corr = False
            if correct_letter:
                is_corr = (letter == correct_letter)

            formatted_options.append({
                "text": format_math_latex(opt_val),
                "isCorrect": is_corr
            })

        if correct_letter and formatted_options:
            for opt, (letter, _) in zip(formatted_options, raw_options):
                if letter == correct_letter:
                    opt["isCorrect"] = True

        if explanation_parts:
            hint = "\n\n".join(explanation_parts)
        else:
            hint = ""

        question_text = format_math_latex(question_text)
        hint = format_math_latex(hint)

        if question_text:
            auto_top, auto_sub = auto_classify_topic_subtopic(question_text, hint, subject=subject)
            parsed_questions.append({
                "questionText": question_text,
                "hint": hint,
                "topic": auto_top,
                "subtopic": auto_sub,
                "options": formatted_options
            })

    return parsed_questions
