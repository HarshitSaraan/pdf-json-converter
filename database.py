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
        print(f"Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_db():
    global client, db
    if db is None:
        try:
            client = AsyncIOMotorClient(MONGO_URI)
            db = client[DB_NAME]
            print(f"Connected to MongoDB: {DB_NAME}")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
    return db
