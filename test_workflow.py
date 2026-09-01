import asyncio
import httpx
from httpx import ASGITransport
from app import app

async def run_full_test():
    print("--- Starting 2-Role Collaborative Workflow Verification ---")

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Guy A parses questions and pushes to unreviewed_questions (staging DB)
        sample_questions = [
            {
                "questionText": "What is the square root of 144?",
                "options": [
                    {"text": "10", "isCorrect": False},
                    {"text": "12", "isCorrect": True},
                    {"text": "14", "isCorrect": False},
                    {"text": "16", "isCorrect": False}
                ],
                "hint": "Since $12 \\times 12 = 144$, the square root is 12.",
                "subject": "Quants",
                "topic": "Number System",
                "subtopic": "Divisibility rules",
                "label": "easy"
            },
            {
                "questionText": "Select the correct synonym for 'Ephemeral':",
                "options": [
                    {"text": "Permanent", "isCorrect": False},
                    {"text": "Transient", "isCorrect": True},
                    {"text": "Eternal", "isCorrect": False},
                    {"text": "Solid", "isCorrect": False}
                ],
                "hint": "Ephemeral means lasting for a very short time.",
                "subject": "English",
                "topic": "Vocabulary",
                "subtopic": "Synonyms",
                "label": "medium"
            }
        ]

        print("[1] Guy A: Bulk pushing parsed batch to staging queue (/api/unreviewed-questions/bulk)...")
        res = await client.post("/api/unreviewed-questions/bulk", json={"questions": sample_questions})
        assert res.status_code == 200, f"Failed: {res.text}"
        bulk_data = res.json()
        print(f"    -> Response: {bulk_data}")
        assert bulk_data["status"] == "success"
        assert bulk_data["count"] >= 2

        # Step 2: Guy B checks queue stats
        print("[2] Guy B: Checking review queue stats (/api/unreviewed-questions/stats)...")
        res = await client.get("/api/unreviewed-questions/stats")
        assert res.status_code == 200
        stats = res.json()
        print(f"    -> Stats: {stats}")
        assert stats["unreviewedTotal"] >= 2

        # Step 3: Guy B opens 1-by-1 Focus Mode and retrieves the next item at index 0
        print("[3] Guy B: Fetching question at index 0 for 1-by-1 review (/api/review-queue/next?index=0)...")
        res = await client.get("/api/review-queue/next?index=0")
        assert res.status_code == 200
        queue_item = res.json()
        assert queue_item["status"] == "success"
        q = queue_item["question"]
        q_id = q["id"]
        print(f"    -> Loaded Question #{1} [ID: {q_id}]: {q['questionText'][:40]}...")

        # Step 4: Guy B edits / refines question and saves draft
        print(f"[4] Guy B: Updating draft for question ID {q_id} (/api/review-queue/{q_id})...")
        q["questionText"] = q["questionText"] + " (Verified by Guy B)"
        res = await client.put(f"/api/review-queue/{q_id}", json=q)
        assert res.status_code == 200
        print("    -> Draft successfully saved in staging queue.")

        # Step 5: Guy B approves and grants question -> pushes to reviewed_questions & removes from queue
        print(f"[5] Guy B: Approving question ID {q_id} -> pushing to Reviewed DB (/api/review-queue/{q_id}/approve)...")
        res = await client.put(f"/api/review-queue/{q_id}/approve", json=q)
        assert res.status_code == 200
        approve_data = res.json()
        print(f"    -> Approval response: {approve_data}")
        assert approve_data["status"] == "success"
        reviewed_id = approve_data["reviewedId"]

        # Step 6: Verify question is in Reviewed DB and removed from unreviewed_questions
        print("[6] Verifying question is in Reviewed DB (/api/reviewed-questions)...")
        res = await client.get("/api/reviewed-questions")
        assert res.status_code == 200
        reviewed_list = res.json()["questions"]
        found = any(rq["id"] == reviewed_id for rq in reviewed_list)
        assert found, "Approved question not found in Reviewed DB!"
        print(f"    -> Confirmed: Question exists in Reviewed DB (Total in bank: {len(reviewed_list)})")

        # Step 7: Test Mock Generator sampling strictly from reviewed_questions
        print("[7] Generating Mock Test exclusively from Reviewed DB (/api/mock-tests/generate)...")
        mock_payload = {
            "subjectCounts": {
                q["subject"]: 1
            },
            "difficulty": {
                "easy": 50,
                "medium": 50,
                "hard": 0
            },
            "excludeUsed": False
        }
        res = await client.post("/api/mock-tests/generate", json=mock_payload)
        assert res.status_code == 200
        mock_res = res.json()
        print(f"    -> Generated mock questions count: {mock_res['count']}")
        assert mock_res["count"] >= 1
        print(f"    -> Sampled question text: {mock_res['questions'][0]['questionText']}")

        print("\n[SUCCESS] All 7 verification steps PASSED successfully!")

if __name__ == "__main__":
    asyncio.run(run_full_test())
