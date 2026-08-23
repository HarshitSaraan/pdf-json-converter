import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pdf_parser import parse_pdf_questions
from gemini_service import generate_ai_hint
from database import connect_to_mongo, close_mongo_connection, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="PDF & DOCX Question JSON Converter", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

ALLOWED_EMAILS = {
    "cnandini828@gmail.com",
    "pratapsinghsusmit@gmail.com",
    "thepreproute@gmail.com",
    "harshitsaraan@gmail.com"
}

@app.post("/api/auth/verify-google")
async def verify_google_token_endpoint(request: Request):
    """Verifies Google ID Token and checks if user email is authorized."""
    data = await request.json()
    token = data.get("credential", "")
    user_email = data.get("email", "").strip().lower()

    if token:
        try:
            import requests as req
            r = req.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
            if r.status_code == 200:
                token_data = r.json()
                verified_email = token_data.get("email", "").strip().lower()
                if verified_email:
                    user_email = verified_email
        except Exception as e:
            print(f"Token verification warning: {e}")

    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required.")

    is_authorized = user_email in ALLOWED_EMAILS

    if not is_authorized:
        return {
            "status": "denied",
            "email": user_email,
            "isAuthorized": False,
            "detail": f"Access Denied: {user_email} is not on the authorized user list."
        }

    return {
        "status": "success",
        "email": user_email,
        "isAuthorized": True
    }

@app.post("/api/generate-hint")
@app.post("/generate-hint")
async def generate_hint_endpoint(request: Request):
    """Generates AI hint/explanation using Google Gemini or Abacus.AI API."""
    data = await request.json()
    question_text = data.get("questionText", "")
    options = data.get("options", [])
    api_key = data.get("apiKey", "")
    abacus_key = data.get("abacusApiKey", "")
    provider = data.get("llmProvider", "gemini")
    model = data.get("model", "gpt-4o")
    subject = data.get("subject", "English")
    custom_prompt = data.get("customPrompt", None)

    if not question_text:
        raise HTTPException(status_code=400, detail="questionText is required.")

    try:
        hint_text = generate_ai_hint(
            question_text=question_text,
            options=options,
            api_key=api_key,
            abacus_key=abacus_key,
            provider=provider,
            model=model,
            subject=subject,
            custom_prompt=custom_prompt
        )
        return {
            "status": "success",
            "hint": hint_text
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/api/parse-pdf")
@app.post("/parse-pdf")
@app.post("/api/parse-document")
@app.post("/parse-document")
async def parse_document_endpoint(
    file: UploadFile = File(...),
    subject: str = Form("English"),
    topic: str = Form(None),
    subtopic: str = Form(None),
    apiKey: str = Form(None),
    abacusApiKey: str = Form(None),
    llmProvider: str = Form("gemini"),
    model: str = Form("gpt-4o"),
    useAiTopics: bool = Form(False),
    useAiExtraction: bool = Form(False),
    customPrompt: str = Form(None)
):
    filename_lower = file.filename.lower()
    allowed_exts = [".pdf", ".docx", ".doc"]
    ext = os.path.splitext(filename_lower)[1]
    
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="File must be a PDF or Word document (.docx, .doc).")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        questions = parse_pdf_questions(
            file_path=tmp_path,
            subject=subject,
            default_topic=topic.strip() if topic else None,
            default_subtopic=subtopic.strip() if subtopic else None,
            api_key=apiKey.strip() if apiKey else None,
            abacus_key=abacusApiKey.strip() if abacusApiKey else None,
            provider=llmProvider.strip() if llmProvider else "gemini",
            model=model.strip() if model else "gpt-4o",
            use_ai_topics=useAiTopics,
            use_ai_extraction=useAiExtraction,
            custom_prompt=customPrompt.strip() if customPrompt else None
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {str(e)}")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    return {
        "status": "success",
        "filename": file.filename,
        "subject": subject,
        "count": len(questions),
        "questions": questions
    }

@app.post("/api/download-json")
@app.post("/download-json")
async def download_json_endpoint(request: Request):
    """Returns downloadable JSON file attachment."""
    payload = await request.json()
    json_bytes = json.dumps(payload, indent=2, ensure_ascii=False).encode('utf-8')
    headers = {
        "Content-Disposition": 'attachment; filename="questions.json"'
    }
    return Response(content=json_bytes, media_type="application/json", headers=headers)

@app.get("/api/questions")
async def get_questions():
    """Fetch all questions from the Question Bank."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    questions_cursor = db.question_bank.find({}, {"_id": 0})
    questions = await questions_cursor.to_list(length=10000)
    return {"status": "success", "questions": questions}

@app.post("/api/questions")
async def add_question(request: Request):
    """Add a single question to the Question Bank."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    question_data = await request.json()
    await db.question_bank.insert_one(question_data)
    # Remove _id before returning to avoid JSON serialization issues
    if "_id" in question_data:
        del question_data["_id"]
    return {"status": "success", "message": "Question added to bank", "question": question_data}

@app.post("/api/questions/bulk")
async def add_questions_bulk(request: Request):
    """Add multiple questions to the Question Bank."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    data = await request.json()
    questions = data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided")
    
    await db.question_bank.insert_many(questions)
    return {"status": "success", "message": f"{len(questions)} questions added to bank"}

# Serve static frontend files (if static folder exists)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
