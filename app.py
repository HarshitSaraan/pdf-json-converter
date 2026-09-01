import os
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pdf_parser import parse_pdf_questions, parse_raw_text_questions
from gemini_service import generate_ai_hint
from database import connect_to_mongo, close_mongo_connection, get_db, get_unreviewed_collection, get_reviewed_collection
from bson.objectid import ObjectId
import random

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
    """Generates AI hint/explanation using Google Gemini API."""
    data = await request.json()
    question_text = data.get("questionText", "")
    options = data.get("options", [])
    api_key = data.get("apiKey", "")
    provider = data.get("llmProvider", "gemini")
    model = data.get("model", "gemini-2.0-flash")
    subject = data.get("subject", "English")
    custom_prompt = data.get("customPrompt", None)

    if not question_text:
        raise HTTPException(status_code=400, detail="questionText is required.")

    try:
        hint_text = generate_ai_hint(
            question_text=question_text,
            options=options,
            api_key=api_key,
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
    llmProvider: str = Form("gemini"),
    model: str = Form("gemini-2.0-flash"),
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
            provider="gemini", # Enforce Gemini for document parsing
            model="gemini-2.0-flash", # Enforce Gemini model
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

@app.post("/api/parse-text")
@app.post("/parse-text")
async def parse_text_endpoint(request: Request):
    """Parses raw copy-pasted text containing MCQs into structured JSON."""
    data = await request.json()
    raw_text = data.get("text", "")
    subject = data.get("subject", "English")
    topic = data.get("topic", None)
    subtopic = data.get("subtopic", None)
    api_key = data.get("apiKey", None)
    provider = data.get("llmProvider", "gemini")
    model = data.get("model", "gemini-2.0-flash")
    use_ai_topics = data.get("useAiTopics", False)
    use_ai_extraction = data.get("useAiExtraction", False)
    custom_prompt = data.get("customPrompt", None)

    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Text content is required for parsing.")

    try:
        questions = parse_raw_text_questions(
            raw_text=raw_text,
            subject=subject,
            default_topic=topic.strip() if topic else None,
            default_subtopic=subtopic.strip() if subtopic else None,
            api_key=api_key.strip() if api_key else None,
            provider=provider,
            model=model,
            use_ai_topics=use_ai_topics,
            use_ai_extraction=use_ai_extraction,
            custom_prompt=custom_prompt.strip() if custom_prompt else None
        )
        return {
            "status": "success",
            "subject": subject,
            "count": len(questions),
            "questions": questions
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Text parsing failed: {str(e)}")

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

# ==========================================
# GUY A: UNREVIEWED STAGING DATABASE ENDPOINTS
# ==========================================

@app.post("/api/unreviewed-questions/bulk")
async def add_unreviewed_questions_bulk(request: Request):
    """Guy A (Parser) sends parsed questions to the unreviewed staging queue."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    data = await request.json()
    questions = data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided")

    import datetime
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    docs_to_insert = []
    for q in questions:
        doc = dict(q)
        if "id" in doc and not "_id" in doc:
            del doc["id"]
        doc["status"] = "unreviewed"
        doc["isUsed"] = False
        if "createdAt" not in doc:
            doc["createdAt"] = now_iso
        docs_to_insert.append(doc)

    result = await col.insert_many(docs_to_insert)
    return {
        "status": "success",
        "message": f"{len(result.inserted_ids)} questions successfully sent to Review Queue (Staging DB)",
        "count": len(result.inserted_ids)
    }

@app.get("/api/unreviewed-questions")
async def get_unreviewed_questions(subject: str = None, topic: str = None, difficulty: str = None, search: str = None, limit: int = 500, skip: int = 0):
    """Fetch unreviewed questions from the staging queue."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if subject and subject.strip() and subject.strip().lower() != "all":
        query["subject"] = {"$regex": f"^{subject.strip()}$", "$options": "i"}
    if topic and topic.strip() and topic.strip().lower() != "all":
        query["topic"] = {"$regex": f"^{topic.strip()}$", "$options": "i"}
    if difficulty and difficulty.strip() and difficulty.strip().lower() != "all":
        query["label"] = difficulty.strip().lower()
    if search and search.strip():
        query["questionText"] = {"$regex": search.strip(), "$options": "i"}

    total_count = await col.count_documents(query)
    cursor = col.find(query).sort("_id", -1).skip(skip).limit(limit)
    questions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        questions.append(doc)

    return {
        "status": "success",
        "total": total_count,
        "count": len(questions),
        "questions": questions
    }

@app.get("/api/unreviewed-questions/stats")
async def get_unreviewed_stats():
    """Returns counts and statistics of unreviewed questions waiting for Guy B."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    total = await col.count_documents({})
    english_cnt = await col.count_documents({"subject": {"$regex": "^english$", "$options": "i"}})
    quants_cnt = await col.count_documents({"subject": {"$regex": "^quants$", "$options": "i"}})
    lrdi_cnt = await col.count_documents({"subject": {"$regex": "^(lrdi|logical reasoning|data interpretation)$", "$options": "i"}})

    reviewed_col = get_reviewed_collection()
    reviewed_total = await reviewed_col.count_documents({}) if reviewed_col is not None else 0

    return {
        "status": "success",
        "unreviewedTotal": total,
        "reviewedTotal": reviewed_total,
        "bySubject": {
            "English": english_cnt,
            "Quants": quants_cnt,
            "LRDI": lrdi_cnt
        }
    }

# ==========================================
# GUY B: REVIEWER QUEUE & APPROVAL WORKFLOW
# ==========================================

@app.get("/api/review-queue/next")
async def get_next_review_question(index: int = 0, subject: str = None):
    """Fetch a single question by queue index for focused one-by-one review."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    query = {}
    if subject and subject.strip() and subject.strip().lower() != "all":
        query["subject"] = {"$regex": f"^{subject.strip()}$", "$options": "i"}

    total = await col.count_documents(query)
    if total == 0 or index >= total:
        return {"status": "empty", "total": total, "question": None}

    cursor = col.find(query).sort("_id", 1).skip(index).limit(1)
    doc = None
    async for d in cursor:
        doc = d
        break

    if not doc:
        return {"status": "empty", "total": total, "question": None}

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return {
        "status": "success",
        "total": total,
        "currentIndex": index,
        "question": doc
    }

@app.put("/api/review-queue/{question_id}")
async def update_unreviewed_draft(question_id: str, request: Request):
    """Saves draft edits to an unreviewed question while in queue."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    updated_data = await request.json()
    if "id" in updated_data:
        del updated_data["id"]
    if "_id" in updated_data:
        del updated_data["_id"]

    try:
        res = await col.update_one({"_id": ObjectId(question_id)}, {"$set": updated_data})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found in staging queue")
        return {"status": "success", "message": "Draft updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/review-queue/{question_id}")
async def reject_unreviewed_question(question_id: str):
    """Guy B rejects and permanently deletes an invalid question from the staging queue."""
    col = get_unreviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        res = await col.delete_one({"_id": ObjectId(question_id)})
        if res.deleted_count == 1:
            return {"status": "success", "message": "Question rejected and removed from queue"}
        else:
            raise HTTPException(status_code=404, detail="Question not found in staging queue")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/review-queue/{question_id}/approve")
async def approve_and_push_question(question_id: str, request: Request):
    """
    Guy B grants and approves the question.
    Saves reviewer's edits, inserts into reviewed_questions database,
    and removes it from unreviewed_questions staging queue.
    """
    unreviewed_col = get_unreviewed_collection()
    reviewed_col = get_reviewed_collection()
    if unreviewed_col is None or reviewed_col is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    payload = await request.json()
    import datetime
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        obj_id = ObjectId(question_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid question ID")

    # If reviewer supplied full updated object, use it; otherwise fetch from staging
    existing_doc = await unreviewed_col.find_one({"_id": obj_id})
    
    doc_to_save = dict(existing_doc) if existing_doc else {}
    if "_id" in doc_to_save:
        del doc_to_save["_id"]

    # Merge reviewer payload
    for key, val in payload.items():
        if key not in ["_id", "id"]:
            doc_to_save[key] = val

    doc_to_save["status"] = "reviewed"
    doc_to_save["isUsed"] = False
    doc_to_save["reviewedAt"] = now_iso

    # Insert into reviewed_questions collection
    insert_res = await reviewed_col.insert_one(doc_to_save)
    doc_to_save["id"] = str(insert_res.inserted_id)
    if "_id" in doc_to_save:
        del doc_to_save["_id"]

    # Remove from unreviewed staging collection
    if existing_doc:
        await unreviewed_col.delete_one({"_id": obj_id})

    # Return remaining unreviewed count for smooth queue progression
    remaining_unreviewed = await unreviewed_col.count_documents({})

    return {
        "status": "success",
        "message": "Question approved and pushed to Reviewed Question Bank!",
        "reviewedId": str(insert_res.inserted_id),
        "remainingUnreviewed": remaining_unreviewed,
        "question": doc_to_save
    }

# ==========================================
# REVIEWED QUESTION BANK ENDPOINTS
# ==========================================

@app.get("/api/reviewed-questions")
@app.get("/api/questions")
async def get_reviewed_questions(subject: str = None, topic: str = None, difficulty: str = None, search: str = None):
    """Fetch all vetted questions from the Reviewed Question Bank."""
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if subject and subject.strip() and subject.strip().lower() != "all":
        query["subject"] = {"$regex": f"^{subject.strip()}$", "$options": "i"}
    if topic and topic.strip() and topic.strip().lower() != "all":
        query["topic"] = {"$regex": f"^{topic.strip()}$", "$options": "i"}
    if difficulty and difficulty.strip() and difficulty.strip().lower() != "all":
        query["label"] = difficulty.strip().lower()
    if search and search.strip():
        query["questionText"] = {"$regex": search.strip(), "$options": "i"}

    cursor = col.find(query).sort("_id", -1)
    questions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        questions.append(doc)

    return {
        "status": "success",
        "count": len(questions),
        "questions": questions
    }

@app.post("/api/reviewed-questions")
async def add_reviewed_question_direct(request: Request):
    """Directly add a question to the Reviewed Question Bank."""
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    question_data = await request.json()
    if "_id" in question_data:
        del question_data["_id"]
    question_data["status"] = "reviewed"
    question_data["isUsed"] = False
    
    result = await col.insert_one(question_data)
    question_data["id"] = str(result.inserted_id)
    if "_id" in question_data:
        del question_data["_id"]
    return {"status": "success", "message": "Question added to Reviewed Bank", "question": question_data}

@app.put("/api/reviewed-questions/{question_id}")
async def update_reviewed_question(question_id: str, request: Request):
    """Update a question in the Reviewed Question Bank."""
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    updated_data = await request.json()
    if "id" in updated_data:
        del updated_data["id"]
    if "_id" in updated_data:
        del updated_data["_id"]

    try:
        res = await col.update_one({"_id": ObjectId(question_id)}, {"$set": updated_data})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found in Reviewed Bank")
        return {"status": "success", "message": "Reviewed question updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/reviewed-questions/{question_id}")
@app.delete("/api/questions/{question_id}")
async def delete_reviewed_question(question_id: str):
    """Delete a question from the Reviewed Question Bank by ID."""
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        res = await col.delete_one({"_id": ObjectId(question_id)})
        if res.deleted_count == 1:
            return {"status": "success", "message": "Question deleted from Reviewed Bank"}
        else:
            raise HTTPException(status_code=404, detail="Question not found in Reviewed Bank")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/reviewed-questions/reset-used")
@app.post("/api/questions/reset-used")
async def reset_used_reviewed_questions():
    """Resets the isUsed status back to false for all questions in Reviewed Question Bank."""
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    result = await col.update_many({}, {"$set": {"isUsed": False}})
    return {"status": "success", "message": f"Reset {result.modified_count} reviewed questions back to unused status"}

# ==========================================
# MOCK / SECTION TEST GENERATOR (FROM REVIEWED DB)
# ==========================================

@app.post("/api/mock-tests/generate")
async def generate_mock_test(request: Request):
    """
    Generates a Mock or Sectional Test paper STRICTLY from the Reviewed Question Bank (reviewed_questions).
    Applies subject quotas and difficulty percentages (easy/medium/hard), tracking isUsed flags.
    """
    col = get_reviewed_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    payload = await request.json()
    subject_counts = payload.get("subjectCounts", {}) # e.g. {"English": 10, "Quants": 10, "LRDI": 5}
    difficulty = payload.get("difficulty", {"easy": 30, "medium": 50, "hard": 20})
    exclude_used = payload.get("excludeUsed", True)

    easy_pct = float(difficulty.get("easy", 30)) / 100.0
    medium_pct = float(difficulty.get("medium", 50)) / 100.0
    hard_pct = float(difficulty.get("hard", 20)) / 100.0

    selected_questions = []
    ids_to_mark_used = []

    for subj, total_q in subject_counts.items():
        total_q = int(total_q)
        if total_q <= 0:
            continue

        easy_target = round(total_q * easy_pct)
        hard_target = round(total_q * hard_pct)
        medium_target = max(0, total_q - (easy_target + hard_target))

        tier_targets = [
            ("easy", easy_target),
            ("medium", medium_target),
            ("hard", hard_target)
        ]

        subj_picked_ids = set()

        for label, count in tier_targets:
            if count <= 0:
                continue

            query = {"subject": {"$regex": f"^{subj}$", "$options": "i"}, "label": label.lower()}
            if exclude_used:
                query["isUsed"] = {"$ne": True}

            cursor = col.find(query)
            matching_docs = await cursor.to_list(length=1000)

            # Fallback to used questions if not enough unused exist
            if len(matching_docs) < count and exclude_used:
                query_fallback = {"subject": {"$regex": f"^{subj}$", "$options": "i"}, "label": label.lower()}
                cursor_fb = col.find(query_fallback)
                matching_docs = await cursor_fb.to_list(length=1000)

            # Filter out already picked
            available = [d for d in matching_docs if d["_id"] not in subj_picked_ids]
            if available:
                picked = random.sample(available, min(count, len(available)))
                for doc in picked:
                    subj_picked_ids.add(doc["_id"])
                    ids_to_mark_used.append(doc["_id"])
                    doc["id"] = str(doc["_id"])
                    del doc["_id"]
                    doc["isUsed"] = True
                    selected_questions.append(doc)

        # Backfill if we still need more questions for this subject
        needed = total_q - len(subj_picked_ids)
        if needed > 0:
            query_general = {"subject": {"$regex": f"^{subj}$", "$options": "i"}}
            if exclude_used:
                query_general["isUsed"] = {"$ne": True}
            cursor_gen = col.find(query_general)
            gen_docs = await cursor_gen.to_list(length=1000)
            if len(gen_docs) < needed and exclude_used:
                cursor_gen_all = col.find({"subject": {"$regex": f"^{subj}$", "$options": "i"}})
                gen_docs = await cursor_gen_all.to_list(length=1000)

            available_gen = [d for d in gen_docs if d["_id"] not in subj_picked_ids]
            if available_gen:
                picked_gen = random.sample(available_gen, min(needed, len(available_gen)))
                for doc in picked_gen:
                    subj_picked_ids.add(doc["_id"])
                    ids_to_mark_used.append(doc["_id"])
                    doc["id"] = str(doc["_id"])
                    del doc["_id"]
                    doc["isUsed"] = True
                    selected_questions.append(doc)

    # Mark selected questions as used in MongoDB reviewed_questions
    if ids_to_mark_used:
        await col.update_many(
            {"_id": {"$in": ids_to_mark_used}},
            {"$set": {"isUsed": True}}
        )

    return {
        "status": "success",
        "count": len(selected_questions),
        "questions": selected_questions
    }

# Serve static frontend files (if static folder exists)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
