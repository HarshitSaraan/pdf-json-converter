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
        {"id": "cat_project", "name": "CAT Project DB", "desc": "Dedicated repository for CAT Quantitative Aptitude & Exam Mocks"}
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
