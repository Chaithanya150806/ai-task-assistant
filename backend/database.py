import sqlite3

def connect_db():
    return sqlite3.connect("tasks.db", check_same_thread=False)

def init_db():
    conn = connect_db()
    cur = conn.cursor()

    # 🔥 FORCE RESET USERS TABLE (fix your error)
    cur.execute("DROP TABLE IF EXISTS users")

    # ✅ CREATE USERS TABLE
    cur.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        dob TEXT
    )
    """)

    # ✅ CREATE TASKS TABLE (USER BASED)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        deadline TEXT,
        importance INTEGER,
        status TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()