import asyncio
import httpx
from httpx import ASGITransport
from app import app

async def run_full_test():
    print("--- Starting 2-Role Collaborative Workflow Verification ---")

    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 0: Authenticate as Admin
        print("[0] Authenticating as Admin (harshitsaraan@gmail.com)...")
        auth_res = await client.post("/api/auth/verify-google", json={"email": "harshitsaraan@gmail.com", "credential": "local_dev_bypass"})
        assert auth_res.status_code == 200, f"Auth failed: {auth_res.text}"
        auth_data = auth_res.json()
        assert auth_data["isAuthorized"] is True
        admin_token = auth_data["token"]
        client.headers["Authorization"] = f"Bearer {admin_token}"
        print(f"    -> Admin authenticated successfully (Role: {auth_data['role']}, DBs: {auth_data['allowed_dbs']})")

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

        # Step 8: Test Reviewer RBAC & Database Isolation
        print("\n[8] Testing Reviewer RBAC & Database Isolation...")
        # 8a. Admin assigns a reviewer to CAT Project DB only
        reviewer_email = "cat_reviewer_test@preproute.com"
        print(f"    -> Assigning reviewer '{reviewer_email}' to 'cat_project' only...")
        assign_res = await client.post("/api/admin/users", json={
            "email": reviewer_email,
            "role": "reviewer",
            "allowed_dbs": ["cat_project"],
            "name": "CAT Reviewer"
        })
        assert assign_res.status_code == 200
        print(f"    -> Admin saved user successfully: {assign_res.json()['message']}")

        # 8b. Authenticate as the reviewer
        rev_auth = await client.post("/api/auth/verify-google", json={"email": reviewer_email, "credential": "local_dev_bypass"})
        assert rev_auth.status_code == 200
        rev_token = rev_auth.json()["token"]
        rev_client = httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
        rev_client.headers["Authorization"] = f"Bearer {rev_token}"

        # 8c. Verify reviewer can access their assigned DB (cat_project)
        allowed_res = await rev_client.get("/api/unreviewed-questions/stats?db=cat_project")
        assert allowed_res.status_code == 200, f"Expected 200 for assigned DB, got {allowed_res.status_code}: {allowed_res.text}"
        print("    -> [PASS] Reviewer successfully accessed their assigned DB ('cat_project')")

        # 8d. Verify reviewer CANNOT access other DBs (questify) -> 403 Forbidden
        denied_db_res = await rev_client.get("/api/unreviewed-questions/stats?db=questify")
        assert denied_db_res.status_code == 403, f"Expected 403 for unauthorized DB, got {denied_db_res.status_code}"
        print(f"    -> [PASS] Access to unassigned DB blocked: {denied_db_res.json()['detail']}")

        # 8e. Verify reviewer CANNOT access Mock Test Generator -> 403 Forbidden
        denied_mock_res = await rev_client.post("/api/mock-tests/generate", json=mock_payload)
        assert denied_mock_res.status_code == 403
        print(f"    -> [PASS] Reviewer blocked from Mock Generator: {denied_mock_res.json()['detail']}")

        # 8f. Verify reviewer CANNOT access Question Parser -> 403 Forbidden
        denied_parse_res = await rev_client.post("/api/parse-text", json={"text": "Sample text"})
        assert denied_parse_res.status_code == 403
        print(f"    -> [PASS] Reviewer blocked from Question Parser: {denied_parse_res.json()['detail']}")

        # 8g. Verify /api/databases returns ONLY their assigned DB ('cat_project')
        dbs_res = await rev_client.get("/api/databases")
        assert dbs_res.status_code == 200
        ret_dbs = [d["id"] for d in dbs_res.json()["databases"]]
        assert ret_dbs == ["cat_project"], f"Expected only ['cat_project'], got {ret_dbs}"
        print(f"    -> [PASS] /api/databases dynamically scoped to assigned DB only: {ret_dbs}")

        # Clean up test user
        await client.delete(f"/api/admin/users/{reviewer_email}")
        print("    -> Cleaned up test reviewer successfully.")

        print("\n[SUCCESS] All 8 verification steps (including RBAC isolation) PASSED successfully!")

if __name__ == "__main__":
    asyncio.run(run_full_test())
