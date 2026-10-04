import os
from motor.motor_asyncio import AsyncIOMotorClient

# Using the connection string provided by the user
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://harshitsaraan_db_user:mongoDBQB@qb.6x0poyl.mongodb.net/?appName=QB")
DEFAULT_DB_NAME = "questify"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DEFAULT_DB_NAME]
        print(f"Connected to MongoDB default database: '{DEFAULT_DB_NAME}'")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_client():
    global client
    if client is None:
        try:
            client = AsyncIOMotorClient(MONGO_URI)
        except Exception as e:
            print(f"Error initializing MongoDB client: {e}")
    return client

def get_db(db_name: str = DEFAULT_DB_NAME):
    """Returns the requested MongoDB database."""
    c = get_client()
    if c is not None:
        target_name = (db_name or DEFAULT_DB_NAME).strip()
        return c[target_name]
    return None

def get_unreviewed_collection(db_name: str = DEFAULT_DB_NAME):
    """Returns the unreviewed questions collection in the specified database."""
    database = get_db(db_name)
    if database is not None:
        return database.unreviewed_questions
    return None

def get_reviewed_collection(db_name: str = DEFAULT_DB_NAME):
    """Returns the reviewed questions collection in the specified database."""
    database = get_db(db_name)
    if database is not None:
        return database.reviewed_questions
    return None

async def list_available_databases():
    """Fetches list of available target databases with their current unreviewed and reviewed counts."""
    c = get_client()
    known_dbs = [
        {"id": "questify", "name": "Questify DB", "desc": "Default repository for general aptitude and exam mocks"},
        {"id": "cat_project", "name": "CAT Project DB", "desc": "Dedicated repository for CAT Quantitative Aptitude & Exam Mocks"},
        {"id": "QA-01", "name": "QA-01 DB", "desc": "Dedicated repository for Quantitative Aptitude Practice & Review"},
        {"id": "CL-T", "name": "CL-T DB", "desc": "Dedicated repository for CL-T Questions & Review"}
    ]
    
    results = []
    for item in known_dbs:
        db_id = item["id"]
        try:
            db_inst = c[db_id] if c is not None else None
            if db_inst is not None:
                unreviewed_cnt = await db_inst.unreviewed_questions.count_documents({})
                # Check both reviewed_questions and reviewed_question
                reviewed_cnt = await db_inst.reviewed_questions.count_documents({})
                results.append({
                    "id": db_id,
                    "name": item["name"],
                    "description": item["desc"],
                    "unreviewedCount": unreviewed_cnt,
                    "reviewedCount": reviewed_cnt
                })
        except Exception as e:
            print(f"Error querying stats for db {db_id}: {e}")
            results.append({
                "id": db_id,
                "name": item["name"],
                "description": item["desc"],
                "unreviewedCount": 0,
                "reviewedCount": 0
            })
    return results

DEFAULT_USER_PERMISSIONS = {
    "cnandini828@gmail.com": {"role": "admin", "allowed_dbs": ["*"], "name": "Nandini"},
    "pratapsinghsusmit@gmail.com": {"role": "admin", "allowed_dbs": ["*"], "name": "Susmit"},
    "thepreproute@gmail.com": {"role": "admin", "allowed_dbs": ["*"], "name": "The Prep Route"},
    "harshitsaraan@gmail.com": {"role": "admin", "allowed_dbs": ["*"], "name": "Harshit"},
}

def get_user_permissions_collection():
    """Returns the user permissions collection in questify database."""
    database = get_db(DEFAULT_DB_NAME)
    if database is not None:
        return database.user_permissions
    return None

async def get_user_permission(email: str):
    """Fetches user permissions from MongoDB, fallback to DEFAULT_USER_PERMISSIONS."""
    if not email:
        return None
    email_clean = email.strip().lower()
    col = get_user_permissions_collection()
    if col is not None:
        try:
            doc = await col.find_one({"email": email_clean})
            if doc:
                return {
                    "email": doc["email"],
                    "name": doc.get("name", email_clean.split("@")[0]),
                    "role": doc.get("role", "reviewer"),
                    "allowed_dbs": doc.get("allowed_dbs", []),
                }
        except Exception as e:
            print(f"Error fetching user permission for {email_clean}: {e}")

    # Fallback to in-memory defaults
    if email_clean in DEFAULT_USER_PERMISSIONS:
        entry = DEFAULT_USER_PERMISSIONS[email_clean]
        return {
            "email": email_clean,
            "name": entry.get("name", "Admin"),
            "role": entry.get("role", "admin"),
            "allowed_dbs": entry.get("allowed_dbs", ["*"]),
        }
    return None

async def set_user_permission(email: str, role: str, allowed_dbs: list, name: str = ""):
    """Upserts a user's permissions and assigned databases in MongoDB."""
    import datetime
    email_clean = email.strip().lower()
    col = get_user_permissions_collection()
    if col is None:
        raise RuntimeError("Database connection not available")

    update_data = {
        "email": email_clean,
        "role": role.strip().lower(),
        "allowed_dbs": allowed_dbs,
        "name": name.strip() if name else email_clean.split("@")[0],
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    await col.update_one(
        {"email": email_clean},
        {"$set": update_data, "$setOnInsert": {"createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}},
        upsert=True
    )
    return update_data

async def delete_user_permission(email: str):
    """Deletes a user from MongoDB permissions collection."""
    email_clean = email.strip().lower()
    if email_clean in DEFAULT_USER_PERMISSIONS:
        raise ValueError("Cannot delete built-in administrator account.")
    col = get_user_permissions_collection()
    if col is None:
        raise RuntimeError("Database connection not available")
    await col.delete_one({"email": email_clean})
    return True

async def list_all_user_permissions():
    """Lists all configured users from MongoDB combined with default admins."""
    col = get_user_permissions_collection()
    users_by_email = {}

    # Pre-populate defaults
    for em, d in DEFAULT_USER_PERMISSIONS.items():
        users_by_email[em] = {
            "email": em,
            "name": d.get("name", "Admin"),
            "role": d.get("role", "admin"),
            "allowed_dbs": d.get("allowed_dbs", ["*"]),
            "isDefault": True
        }

    if col is not None:
        try:
            cursor = col.find({})
            async for doc in cursor:
                em = doc.get("email", "").strip().lower()
                if em:
                    users_by_email[em] = {
                        "email": em,
                        "name": doc.get("name", em.split("@")[0]),
                        "role": doc.get("role", "reviewer"),
                        "allowed_dbs": doc.get("allowed_dbs", []),
                        "isDefault": em in DEFAULT_USER_PERMISSIONS
                    }
        except Exception as e:
            print(f"Error listing user permissions: {e}")

    return list(users_by_email.values())
