from flask import Flask, request, jsonify
import sqlite3
import bcrypt
import jwt
import datetime
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

SECRET = "secret123"


# ===== DB =====
def get_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


# ===== REGISTER =====
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.json
        name = data["name"]
        email = data["email"]
        password = data["password"]

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO Users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed.decode("utf-8"))
        )

        conn.commit()
        conn.close()

        print("✅ REGISTER OK")
        return jsonify({"msg": "registered"})

    except Exception as e:
        print("❌ REGISTER ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ===== LOGIN =====
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Users WHERE email=?", (email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({"error": "no user"}), 400

        stored_hash = user["password"].encode("utf-8")

        if not bcrypt.checkpw(password.encode(), stored_hash):
            return jsonify({"error": "wrong password"}), 400

        token = jwt.encode(
            {
                "user_id": user["user_id"],
                "name": user["name"], 
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            SECRET,
            algorithm="HS256"
        )

        return jsonify({"token": token})

    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        return jsonify({"error": str(e)}), 500
    

# ===== 驗證 middleware =====
def verify_token(req):
    token = req.headers.get("Authorization")
    if not token:
        return None

    token = token.split(" ")[1]

    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
        return data["user_id"]
    except:
        return None

# ===== 存行程 =====
@app.route("/api/itinerary", methods=["POST"])
def save_itinerary():
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    days = json.dumps(request.json["days"])

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO itinerary (user_id, days) VALUES (?, ?)",
        (user_id, days)
    )
    conn.commit()

    return jsonify({"msg": "saved"})

# ===== 讀行程 =====
@app.route("/api/itinerary", methods=["GET"])
def get_itinerary():
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM itinerary WHERE user_id=?", (user_id,))
    rows = cursor.fetchall()

    data = []
    for r in rows:
        data.append({
            "id": r[0],
            "days": json.loads(r[2])
        })

    return jsonify(data)

@app.route("/api/save-trip", methods=["POST"])
def save_trip():
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    data = request.json
    trip_id = data.get("trip_id")
    title = data.get("title", "My Trip")
    days = data.get("days")

    conn = get_db()
    cursor = conn.cursor()

    # ===== 如果有 trip_id → 更新 =====
    if trip_id:
        # 刪掉舊 itinerary
        cursor.execute("""
            DELETE FROM Itinerary_Spots 
            WHERE itinerary_id IN (
                SELECT itinerary_id FROM Itineraries WHERE trip_id=?
            )
        """, (trip_id,))

        cursor.execute(
            "DELETE FROM Itineraries WHERE trip_id=?",
            (trip_id,)
        )

    # ===== 沒有 → 新建 Trip =====
    else:
        cursor.execute(
            "INSERT INTO Trips (user_id, title) VALUES (?, ?)",
            (user_id, title)
        )
        trip_id = cursor.lastrowid

    # ===== 重建 itinerary =====
    for day_key, spots in days.items():
        day_number = int(day_key.replace("Day", ""))

        cursor.execute(
            "INSERT INTO Itineraries (trip_id, day_number) VALUES (?, ?)",
            (trip_id, day_number)
        )
        itinerary_id = cursor.lastrowid

        for index, spot in enumerate(spots):
            cursor.execute(
                "SELECT spot_id FROM Spots WHERE name=?",
                (spot.get("name"),)
            )
            result = cursor.fetchone()
            if not result:
                continue

            spot_id = result[0]

            cursor.execute("""
                INSERT INTO Itinerary_Spots 
                (itinerary_id, spot_id, visit_order)
                VALUES (?, ?, ?)
            """, (itinerary_id, spot_id, index))

    conn.commit()
    conn.close()

    return jsonify({
        "msg": "saved",
        "trip_id": trip_id
    })

@app.route("/api/get-trips", methods=["GET"])
def get_trips():
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM Trips WHERE user_id=? ORDER BY trip_id DESC",
        (user_id,)
    )
    trips = cursor.fetchall()

    result = []

    for trip in trips:
        trip_id = trip[0]

        cursor.execute(
            "SELECT * FROM Itineraries WHERE trip_id=?",
            (trip_id,)
        )
        itineraries = cursor.fetchall()

        days = {}

        for it in itineraries:
            itinerary_id = it[0]
            day_number = it[2]

            cursor.execute("""
                SELECT s.*
                FROM Itinerary_Spots ispot
                JOIN Spots s ON ispot.spot_id = s.spot_id
                WHERE ispot.itinerary_id=?
                ORDER BY ispot.visit_order
            """, (itinerary_id,))

            spots = cursor.fetchall()

            days[f"Day{day_number}"] = [
                {
                    "name": s[1],
                    "lat": s[3],
                    "lng": s[4],
                    "type": s[5],        # category
                    "stayTime": "1~2 小時"  # 可以先寫死或之後用 DB
                }
                for s in spots
            ]

        result.append({
            "trip_id": trip_id,
            "title": trip[2],  # ⭐ 加這行
            "days": days
        })

    return jsonify(result)

# ===== 刪除行程 =====
@app.route("/api/trip/<int:trip_id>", methods=["DELETE"])
def delete_trip(trip_id):
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()

    # 檢查是不是自己的行程
    cursor.execute(
        "SELECT * FROM Trips WHERE trip_id=? AND user_id=?",
        (trip_id, user_id)
    )
    trip = cursor.fetchone()

    if not trip:
        return jsonify({"error": "not found"}), 404

    # 刪 itinerary_spots
    cursor.execute("""
        DELETE FROM Itinerary_Spots 
        WHERE itinerary_id IN (
            SELECT itinerary_id FROM Itineraries WHERE trip_id=?
        )
    """, (trip_id,))

    # 刪 itineraries
    cursor.execute(
        "DELETE FROM Itineraries WHERE trip_id=?",
        (trip_id,)
    )

    # 刪 trip
    cursor.execute(
        "DELETE FROM Trips WHERE trip_id=?",
        (trip_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"msg": "deleted"})

    # ===== 重新命名行程 =====
@app.route("/api/trip/<int:trip_id>", methods=["PUT"])
def rename_trip(trip_id):
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    data = request.json
    new_title = data.get("title")

    if not new_title:
        return jsonify({"error": "title required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE Trips SET title=? WHERE trip_id=? AND user_id=?",
        (new_title, trip_id, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"msg": "renamed"})

app.run(host="0.0.0.0", port=5000, debug=True)