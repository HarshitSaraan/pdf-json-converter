import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pdf_parser import parse_pdf_questions
from gemini_service import generate_ai_hint

app = FastAPI(title="PDF & DOCX Question JSON Converter", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

@app.post("/api/generate-hint")
@app.post("/generate-hint")
async def generate_hint_endpoint(request: Request):
    """Generates AI hint/explanation using Google Gemini API."""
    data = await request.json()
    question_text = data.get("questionText", "")
    options = data.get("options", [])
    api_key = data.get("apiKey", "")

    if not question_text:
        raise HTTPException(status_code=400, detail="questionText is required.")

    try:
        hint_text = generate_ai_hint(question_text=question_text, options=options, api_key=api_key)
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
    subtopic: str = Form(None)
):
    filename_lower = file.filename.lower()
    allowed_exts = [".pdf", ".docx", ".doc"]
    ext = os.path.splitext(filename_lower)[1]
    
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="File must be a PDF or Word document (.docx, .doc).")
    
    # Save uploaded file to temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        questions = parse_pdf_questions(
            file_path=tmp_path,
            subject=subject,
            default_topic=topic.strip() if topic else None,
            default_subtopic=subtopic.strip() if subtopic else None
        )
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

# Serve static frontend files (if static folder exists)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
