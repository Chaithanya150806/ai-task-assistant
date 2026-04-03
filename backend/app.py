from database import connect_db, init_db
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_logic import calculate_priority


app = Flask(__name__)
CORS(app)

# 🔥 Initialize DB
init_db()

# ==============================
# ✅ TEST ROUTE
# ==============================
@app.route("/")
def home():
    return "Backend is running ✅"

# ==============================
# 🔐 AUTH SYSTEM
# ==============================

# ➕ SIGNUP (ONLY ONCE)
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json

    username = data.get("username")
    password = data.get("password")
    dob = data.get("dob")

    if not username or not password or not dob:
        return jsonify({"message": "All fields required"}), 400

    conn = connect_db()
    cur = conn.cursor()

    # check if user exists
    cur.execute("SELECT * FROM users WHERE username=?", (username,))
    existing = cur.fetchone()

    if existing:
        conn.close()
        return jsonify({"message": "User already exists"}), 400

    # insert user
    cur.execute(
        "INSERT INTO users (username, password, dob) VALUES (?, ?, ?)",
        (username, password, dob)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Signup successful"})


# 🔑 LOGIN
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Missing credentials"}), 400

    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username, password)
    )

    user = cur.fetchone()
    conn.close()

    if user:
        return jsonify({
            "message": "Login successful",
            "user_id": user[0]
        })
    else:
        return jsonify({"message": "Invalid credentials"}), 401


# ==============================
# 📋 TASK MANAGEMENT
# ==============================

# ➕ ADD TASK
@app.route("/add-task", methods=["POST"])
def add_task():
    data = request.json

    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO tasks (user_id, title, deadline, importance, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
    """, (
        data["user_id"],
        data["title"],
        data["deadline"],
        data["importance"],
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Task saved"})


# 📋 GET TASKS
@app.route("/tasks", methods=["GET"])
def get_tasks():
    user_id = request.args.get("user_id")

    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM tasks WHERE status='pending' AND user_id=?",
        (user_id,)
    )
    rows = cur.fetchall()

    tasks = []
    for r in rows:
        task = {
            "id": r[0],
            "title": r[2],
            "deadline": r[3],
            "importance": r[4]
        }

        task["priority"] = calculate_priority(task)
        tasks.append(task)

    tasks.sort(key=lambda x: x["priority"], reverse=True)

    conn.close()
    return jsonify(tasks)


# 🤖 NEXT TASK
@app.route("/next-task", methods=["GET"])
def next_task():
    user_id = request.args.get("user_id")

    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM tasks WHERE status='pending' AND user_id=?",
        (user_id,)
    )
    rows = cur.fetchall()

    if not rows:
        return jsonify({"message": "No tasks"})

    tasks = []
    for r in rows:
        task = {
            "id": r[0],
            "title": r[2],
            "deadline": r[3],
            "importance": r[4]
        }

        task["priority"] = calculate_priority(task)
        tasks.append(task)

    tasks.sort(key=lambda x: x["priority"], reverse=True)
    top_task = tasks[0]

    conn.close()
    return jsonify(top_task)


# ==============================
# ✅ COMPLETE TASK
# ==============================
@app.route("/complete/<int:task_id>", methods=["POST"])
def complete_task(task_id):
    conn = connect_db()
    cur = conn.cursor()

    cur.execute("UPDATE tasks SET status='completed' WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Task completed"})


# ==============================
# 📊 STATS
# ==============================
@app.route("/stats", methods=["GET"])
def stats():
    user_id = request.args.get("user_id")

    conn = connect_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT COUNT(*) FROM tasks WHERE status='completed' AND user_id=?",
        (user_id,)
    )
    completed = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM tasks WHERE user_id=?",
        (user_id,)
    )
    total = cur.fetchone()[0]

    efficiency = (completed / total * 100) if total else 0

    conn.close()

    return jsonify({
        "completed": completed,
        "total": total,
        "efficiency": round(efficiency, 2)
    })

@app.route("/study-plan", methods=["GET"])
def study_plan():
    user_id = request.args.get("user_id")

    conn = connect_db()
    cur = conn.cursor()

    # 🔥 GET TASKS SORTED BY DEADLINE
    cur.execute("""
        SELECT title, deadline FROM tasks 
        WHERE user_id=? 
        ORDER BY deadline ASC
    """, (user_id,))
    
    rows = cur.fetchall()

    plan = []
    week = 1

    for r in rows:
        title = r[0]
        deadline = r[1]

        # 🧠 EXTRACT SUBJECT (FIRST WORD)
        subject = title.split()[0].upper()

        plan.append({
            "week": f"Week {week}",
            "subject": subject,
            "task": title,
            "deadline": deadline
        })

        # rotate weeks (1–4)
        week = week + 1 if week < 4 else 1

    conn.close()
    return jsonify(plan)
@app.route("/profile", methods=["GET"])
def profile():
    user_id = request.args.get("user_id")

    conn = connect_db()
    cur = conn.cursor()

    cur.execute("SELECT username, dob FROM users WHERE id=?", (user_id,))
    user = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM tasks WHERE user_id=? AND status='completed'", (user_id,))
    completed = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM tasks WHERE user_id=? AND status='pending'", (user_id,))
    pending = cur.fetchone()[0]

    conn.close()

    return jsonify({
        "username": user[0],
        "dob": user[1],
        "completed": completed,
        "pending": pending
    })
# ==============================
# 🚀 RUN SERVER
# ==============================
if __name__ == "__main__":
    app.run(debug=True)