import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pdf_parser import parse_pdf_questions

app = FastAPI(title="PDF to Question JSON Converter", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

@app.post("/api/parse-pdf")
async def parse_pdf_endpoint(
    file: UploadFile = File(...),
    topic: str = Form("algebra"),
    subtopic: str = Form("indices")
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF document.")
    
    # Save uploaded file to temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        questions = parse_pdf_questions(
            pdf_path=tmp_path,
            default_topic=topic.strip() if topic else "algebra",
            default_subtopic=subtopic.strip() if subtopic else "indices"
        )
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {
        "status": "success",
        "filename": file.filename,
        "count": len(questions),
        "questions": questions
    }

@app.post("/api/download-json")
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
