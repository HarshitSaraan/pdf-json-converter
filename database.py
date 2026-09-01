import os
from motor.motor_asyncio import AsyncIOMotorClient

# Using the connection string provided by the user
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://harshitsaraan_db_user:mongoDBQB@qb.6x0poyl.mongodb.net/?appName=QB")
DB_NAME = "questify"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        print(f"Connected to MongoDB database: '{DB_NAME}'")
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

def get_db():
    """Returns the questify database."""
    c = get_client()
    if c is not None:
        return c[DB_NAME]
    return None

def get_unreviewed_collection():
    """Returns the staging collection for Guy A (Parser) in questify.unreviewed_questions."""
    database = get_db()
    if database is not None:
        return database.unreviewed_questions
    return None

def get_reviewed_collection():
    """Returns the production collection for Guy B (Reviewer) in questify.reviewed_questions."""
    database = get_db()
    if database is not None:
        return database.reviewed_questions
    return None


