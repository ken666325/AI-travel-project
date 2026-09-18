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


def get_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# =========================================================
# Database Schema Migration
# =========================================================

def ensure_database_schema():
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            AND name='Itinerary_Spots'
        """)

        table_exists = cursor.fetchone()

        if not table_exists:
            print("⚠️ 找不到 Itinerary_Spots，請確認 database.db schema。")
            conn.close()
            return

        cursor.execute("PRAGMA table_info(Itinerary_Spots)")

        columns = {row["name"] for row in cursor.fetchall()}

        # -------------------------
        # Itinerary item fields
        # -------------------------

        if "role" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN role TEXT DEFAULT 'spot'
            """)
            print("✅ 已新增 Itinerary_Spots.role")

        if "start_time" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN start_time TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.start_time")

        if "end_time" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN end_time TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.end_time")

        # -------------------------
        # Transport fields
        # -------------------------

        if "transport_mode" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN transport_mode TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.transport_mode")

        if "transport_duration" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN transport_duration TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.transport_duration")

        if "transport_distance" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN transport_distance TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.transport_distance")

        if "transport_note" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN transport_note TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.transport_note")

        if "transport_steps" not in columns:
            cursor.execute("""
                ALTER TABLE Itinerary_Spots
                ADD COLUMN transport_steps TEXT DEFAULT ''
            """)
            print("✅ 已新增 Itinerary_Spots.transport_steps")

        conn.commit()

        print("✅ Database schema check completed")

    except Exception as e:
        conn.rollback()
        print("❌ Schema migration error:", e)

    finally:
        conn.close()


ensure_database_schema()


# =========================================================
# Register
# =========================================================

@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.json or {}

        name = data["name"]
        email = data["email"]
        password = data["password"]

        hashed = bcrypt.hashpw(
            password.encode(),
            bcrypt.gensalt()
        )

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Users
            (name, email, password)
            VALUES (?, ?, ?)
        """, (
            name,
            email,
            hashed.decode("utf-8")
        ))

        conn.commit()
        conn.close()

        print("✅ REGISTER OK")

        return jsonify({"msg": "registered"})

    except Exception as e:
        print("❌ REGISTER ERROR:", e)
        return jsonify({"error": str(e)}), 500


# =========================================================
# Login
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json or {}

        email = data["email"]
        password = data["password"]

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM Users
            WHERE email=?
        """, (email,))

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({"error": "no user"}), 400

        stored_hash = user["password"].encode("utf-8")

        if not bcrypt.checkpw(
            password.encode(),
            stored_hash
        ):
            return jsonify({"error": "wrong password"}), 400

        token = jwt.encode(
            {
                "user_id": user["user_id"],
                "name": user["name"],
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(hours=24)
            },
            SECRET,
            algorithm="HS256"
        )

        return jsonify({"token": token})

    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        return jsonify({"error": str(e)}), 500


# =========================================================
# Verify JWT
# =========================================================

def verify_token(req):
    authorization = req.headers.get("Authorization")

    if not authorization:
        return None

    try:
        parts = authorization.split(" ")

        if len(parts) != 2:
            return None

        token = parts[1]

        data = jwt.decode(
            token,
            SECRET,
            algorithms=["HS256"]
        )

        return data["user_id"]

    except Exception:
        return None


# =========================================================
# Legacy Itinerary API
# =========================================================

@app.route("/api/itinerary", methods=["POST"])
def save_itinerary():
    user_id = verify_token(request)

    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    data = request.json or {}
    days = json.dumps(data.get("days", []))

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO itinerary
        (user_id, days)
        VALUES (?, ?)
    """, (
        user_id,
        days
    ))

    conn.commit()
    conn.close()

    return jsonify({"msg": "saved"})


@app.route("/api/itinerary", methods=["GET"])
def get_itinerary():
    user_id = verify_token(request)

    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM itinerary
        WHERE user_id=?
    """, (user_id,))

    rows = cursor.fetchall()

    data = [
        {
            "id": row[0],
            "days": json.loads(row[2])
        }
        for row in rows
    ]

    conn.close()

    return jsonify(data)


# =========================================================
# Save Trip
# =========================================================

@app.route("/api/save-trip", methods=["POST"])
def save_trip():
    user_id = verify_token(request)

    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    data = request.json or {}

    trip_id = data.get("trip_id")
    title = data.get("title", "My Trip")
    days = data.get("days", [])

    if not isinstance(days, list):
        return jsonify({
            "error": "days must be an array"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        # =====================================================
        # Existing Trip
        # =====================================================

        if trip_id:

            cursor.execute("""
                SELECT *
                FROM Trips
                WHERE trip_id=?
                AND user_id=?
            """, (
                trip_id,
                user_id
            ))

            trip = cursor.fetchone()

            if not trip:
                conn.close()
                return jsonify({
                    "error": "trip not found"
                }), 404

            cursor.execute("""
                UPDATE Trips
                SET title=?
                WHERE trip_id=?
                AND user_id=?
            """, (
                title,
                trip_id,
                user_id
            ))

            # 刪除舊行程
            cursor.execute("""
                DELETE FROM Itinerary_Spots
                WHERE itinerary_id IN (
                    SELECT itinerary_id
                    FROM Itineraries
                    WHERE trip_id=?
                )
            """, (trip_id,))

            cursor.execute("""
                DELETE FROM Itineraries
                WHERE trip_id=?
            """, (trip_id,))

        # =====================================================
        # New Trip
        # =====================================================

        else:

            cursor.execute("""
                INSERT INTO Trips
                (user_id, title)
                VALUES (?, ?)
            """, (
                user_id,
                title
            ))

            trip_id = cursor.lastrowid

        # =====================================================
        # Save Days
        # =====================================================

        for day_data in days:

            if not isinstance(day_data, dict):
                continue

            day_number = day_data.get("day")

            if not day_number:
                continue

            items = day_data.get("items")

            if not isinstance(items, list):
                items = day_data.get("spots", [])

            # 建立 Itinerary
            cursor.execute("""
                INSERT INTO Itineraries
                (trip_id, day_number)
                VALUES (?, ?)
            """, (
                trip_id,
                day_number
            ))

            itinerary_id = cursor.lastrowid

            # =================================================
            # Save Items
            # =================================================

            for index, item in enumerate(items):

                if not isinstance(item, dict):
                    continue

                name = item.get("name")

                if not name:
                    continue

                # ---------------------------------------------
                # 找 Spot
                # ---------------------------------------------

                place_id = (
                    item.get("placeId")
                    or item.get("spot_id")
                    or item.get("spotId")
                )

                spot = None

                if place_id:

                    cursor.execute("""
                        SELECT *
                        FROM Spots
                        WHERE spot_id=?
                    """, (place_id,))

                    spot = cursor.fetchone()

                if not spot:

                    cursor.execute("""
                        SELECT *
                        FROM Spots
                        WHERE name=?
                    """, (name,))

                    spot = cursor.fetchone()

                if not spot:

                    print(
                        "⚠️ 找不到 Spot，略過：",
                        name
                    )

                    continue

                spot_id = spot["spot_id"]

                # ---------------------------------------------
                # Role
                # ---------------------------------------------

                role = item.get(
                    "role",
                    "spot"
                )

                if role not in [
                    "spot",
                    "restaurant",
                    "hotel"
                ]:
                    role = "spot"

                # ---------------------------------------------
                # Time
                # ---------------------------------------------

                start_time = (
                    item.get("startTime", "")
                    or ""
                )

                end_time = (
                    item.get("endTime", "")
                    or ""
                )

                # ---------------------------------------------
                # Transport
                #
                # current item -> next item
                # ---------------------------------------------

                transport = item.get(
                    "transportToNext"
                )

                if not isinstance(
                    transport,
                    dict
                ):
                    transport = {}

                transport_mode = (
                    transport.get("mode", "")
                    or ""
                )

                transport_duration = (
                    transport.get("duration", "")
                    or ""
                )

                transport_distance = (
                    transport.get("distance", "")
                    or ""
                )

                transport_note = (
                    transport.get("note", "")
                    or ""
                )

                transport_steps = (
                    transport.get("steps", [])
                )

                if not isinstance(
                    transport_steps,
                    list
                ):
                    transport_steps = []

                # SQLite TEXT
                transport_steps_json = json.dumps(
                    transport_steps,
                    ensure_ascii=False
                )

                # ---------------------------------------------
                # Insert Itinerary_Spots
                # ---------------------------------------------

                cursor.execute("""
                    INSERT INTO Itinerary_Spots
                    (
                        itinerary_id,
                        spot_id,
                        visit_order,
                        role,
                        start_time,
                        end_time,
                        transport_mode,
                        transport_duration,
                        transport_distance,
                        transport_note,
                        transport_steps
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    itinerary_id,
                    spot_id,
                    index,
                    role,
                    start_time,
                    end_time,
                    transport_mode,
                    transport_duration,
                    transport_distance,
                    transport_note,
                    transport_steps_json
                ))

        conn.commit()

        print(
            "✅ 行程儲存成功，trip_id =",
            trip_id
        )

        return jsonify({
            "msg": "saved",
            "trip_id": trip_id
        })

    except Exception as e:

        conn.rollback()

        print(
            "❌ 儲存行程失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Get Trips
# =========================================================

@app.route("/api/get-trips", methods=["GET"])
def get_trips():

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error": "unauthorized"
        }), 401

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT *
            FROM Trips
            WHERE user_id=?
            ORDER BY trip_id DESC
        """, (user_id,))

        trips = cursor.fetchall()

        result = []

        # =====================================================
        # Trips
        # =====================================================

        for trip in trips:

            trip_id = trip["trip_id"]

            cursor.execute("""
                SELECT *
                FROM Itineraries
                WHERE trip_id=?
                ORDER BY day_number
            """, (trip_id,))

            itineraries = cursor.fetchall()

            days = []

            # =================================================
            # Days
            # =================================================

            for itinerary in itineraries:

                itinerary_id = itinerary["itinerary_id"]
                day_number = itinerary["day_number"]

                cursor.execute("""
                    SELECT
                        ispot.visit_order,
                        ispot.role,
                        ispot.start_time,
                        ispot.end_time,

                        ispot.transport_mode,
                        ispot.transport_duration,
                        ispot.transport_distance,
                        ispot.transport_note,
                        ispot.transport_steps,

                        s.spot_id,
                        s.name,
                        s.location,
                        s.lat,
                        s.lng,
                        s.category,
                        s.rating,
                        s.cost,
                        s.open_time,
                        s.close_time,
                        s.image

                    FROM Itinerary_Spots ispot

                    JOIN Spots s
                        ON ispot.spot_id = s.spot_id

                    WHERE ispot.itinerary_id=?

                    ORDER BY ispot.visit_order
                """, (itinerary_id,))

                items_rows = cursor.fetchall()

                items = []

                # =============================================
                # Items
                # =============================================

                for row in items_rows:

                    # -----------------------------------------
                    # Active Time
                    # -----------------------------------------

                    if (
                        row["open_time"]
                        and row["close_time"]
                    ):

                        active_time = (
                            f'{row["open_time"]} ~ '
                            f'{row["close_time"]}'
                        )

                    else:

                        active_time = "08:00~17:00"

                    # -----------------------------------------
                    # Transport Steps
                    # -----------------------------------------

                    transport_steps = []

                    raw_steps = row["transport_steps"]

                    if raw_steps:

                        try:

                            parsed_steps = json.loads(
                                raw_steps
                            )

                            if isinstance(
                                parsed_steps,
                                list
                            ):
                                transport_steps = parsed_steps

                        except Exception:

                            print(
                                "⚠️ transport_steps JSON 解析失敗：",
                                row["spot_id"]
                            )

                    # -----------------------------------------
                    # Transport Object
                    # -----------------------------------------

                    transport_mode = (
                        row["transport_mode"]
                        or ""
                    )

                    transport_duration = (
                        row["transport_duration"]
                        or ""
                    )

                    transport_distance = (
                        row["transport_distance"]
                        or ""
                    )

                    transport_note = (
                        row["transport_note"]
                        or ""
                    )

                    # 如果完全沒有交通資料
                    if (
                        not transport_mode
                        and not transport_duration
                        and not transport_distance
                        and not transport_note
                        and not transport_steps
                    ):

                        transport_to_next = None

                    else:

                        transport_to_next = {
                            "mode": transport_mode
                                or "尚未設定",

                            "duration": transport_duration,

                            "distance": transport_distance,

                            "note": transport_note,

                            "steps": transport_steps
                        }

                    # -----------------------------------------
                    # Item
                    # -----------------------------------------

                    items.append({

                        "id":
                            f'item-{day_number}-'
                            f'{row["spot_id"]}-'
                            f'{row["visit_order"]}',

                        "itemType": "place",

                        "role":
                            row["role"]
                            or "spot",

                        "placeId":
                            row["spot_id"],

                        "name":
                            row["name"],

                        "lat":
                            row["lat"],

                        "lng":
                            row["lng"],

                        "address":
                            row["location"]
                            or "",

                        "category":
                            row["category"]
                            or "景點",

                        "type":
                            row["category"]
                            or "景點",

                        "startTime":
                            row["start_time"]
                            or "",

                        "endTime":
                            row["end_time"]
                            or "",

                        "stayTime":
                            "1~2 小時",

                        "activeTime":
                            active_time,

                        "rating":
                            row["rating"],

                        "cost":
                            row["cost"],

                        "image":
                            row["image"]
                            or "",

                        "description":
                            "推薦旅遊景點",

                        # =====================================
                        # ⭐ Transport
                        # =====================================

                        "transportToNext":
                            transport_to_next
                    })

                # =================================================
                # Day
                # =================================================

                days.append({
                    "day": day_number,
                    "items": items
                })

            # =====================================================
            # Trip
            # =====================================================

            result.append({
                "trip_id": trip_id,
                "title": trip["title"],
                "days": days
            })

        return jsonify(result)

    except Exception as e:

        print(
            "❌ 取得 Trips 失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Delete Trip
# =========================================================

@app.route("/api/trip/<int:trip_id>", methods=["DELETE"])
def delete_trip(trip_id):

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error": "unauthorized"
        }), 401

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT *
            FROM Trips
            WHERE trip_id=?
            AND user_id=?
        """, (
            trip_id,
            user_id
        ))

        trip = cursor.fetchone()

        if not trip:
            return jsonify({
                "error": "not found"
            }), 404

        cursor.execute("""
            DELETE FROM Itinerary_Spots
            WHERE itinerary_id IN (
                SELECT itinerary_id
                FROM Itineraries
                WHERE trip_id=?
            )
        """, (trip_id,))

        cursor.execute("""
            DELETE FROM Itineraries
            WHERE trip_id=?
        """, (trip_id,))

        cursor.execute("""
            DELETE FROM Trips
            WHERE trip_id=?
            AND user_id=?
        """, (
            trip_id,
            user_id
        ))

        conn.commit()

        return jsonify({
            "msg": "deleted"
        })

    except Exception as e:

        conn.rollback()

        print(
            "❌ 刪除行程失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Rename Trip
# =========================================================

@app.route("/api/trip/<int:trip_id>", methods=["PUT"])
def rename_trip(trip_id):

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error": "unauthorized"
        }), 401

    data = request.json or {}

    new_title = data.get("title")

    if not new_title:
        return jsonify({
            "error": "title required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            UPDATE Trips
            SET title=?
            WHERE trip_id=?
            AND user_id=?
        """, (
            new_title,
            trip_id,
            user_id
        ))

        if cursor.rowcount == 0:

            conn.rollback()

            return jsonify({
                "error": "trip not found"
            }), 404

        conn.commit()

        return jsonify({
            "msg": "renamed"
        })

    except Exception as e:

        conn.rollback()

        print(
            "❌ 修改行程名稱失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Search Spots
# =========================================================

@app.route("/api/search-spots", methods=["GET"])
def search_spots():

    keyword = request.args.get(
        "q",
        ""
    ).strip()

    if not keyword:
        return jsonify([])

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT *
            FROM Spots
            WHERE
                name LIKE ?
                OR category LIKE ?
                OR location LIKE ?
            LIMIT 10
        """, (
            f"%{keyword}%",
            f"%{keyword}%",
            f"%{keyword}%"
        ))

        spots = cursor.fetchall()

        result = [

            {
                "spot_id":
                    spot["spot_id"],

                "name":
                    spot["name"],

                "location":
                    spot["location"],

                "lat":
                    spot["lat"],

                "lng":
                    spot["lng"],

                "category":
                    spot["category"],

                "rating":
                    spot["rating"],

                "cost":
                    spot["cost"],

                "open_time":
                    spot["open_time"],

                "close_time":
                    spot["close_time"],

                "image":
                    spot["image"]
            }

            for spot in spots
        ]

        return jsonify(result)

    except Exception as e:

        print(
            "❌ 搜尋景點失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Add Sidebar Trip Place
# =========================================================

@app.route("/api/trip-place", methods=["POST"])
def add_trip_place():

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error": "unauthorized"
        }), 401

    data = request.json or {}

    trip_id = data.get("trip_id")
    spot_name = data.get("spot_name")

    if not trip_id or not spot_name:

        return jsonify({
            "error":
                "trip_id and spot_name required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT *
            FROM Trips
            WHERE trip_id=?
            AND user_id=?
        """, (
            trip_id,
            user_id
        ))

        trip = cursor.fetchone()

        if not trip:

            return jsonify({
                "error":
                    "trip not found"
            }), 404

        cursor.execute("""
            SELECT spot_id
            FROM Spots
            WHERE name=?
        """, (spot_name,))

        spot = cursor.fetchone()

        if not spot:

            return jsonify({
                "error":
                    "spot not found"
            }), 404

        spot_id = spot["spot_id"]

        cursor.execute("""
            SELECT *
            FROM Trip_Places
            WHERE trip_id=?
            AND spot_id=?
        """, (
            trip_id,
            spot_id
        ))

        exists = cursor.fetchone()

        if exists:

            return jsonify({
                "msg":
                    "already exists"
            })

        cursor.execute("""
            INSERT INTO Trip_Places
            (
                trip_id,
                spot_id,
                added_at
            )
            VALUES (?, ?, ?)
        """, (
            trip_id,
            spot_id,
            datetime.datetime.now().isoformat()
        ))

        conn.commit()

        return jsonify({
            "msg":
                "added"
        })

    except Exception as e:

        conn.rollback()

        print(
            "❌ 加入 Sidebar 景點失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Get Sidebar Trip Places
# =========================================================

@app.route("/api/trip-places/<int:trip_id>", methods=["GET"])
def get_trip_places(trip_id):

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error":
                "unauthorized"
        }), 401

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT *
            FROM Trips
            WHERE trip_id=?
            AND user_id=?
        """, (
            trip_id,
            user_id
        ))

        trip = cursor.fetchone()

        if not trip:

            return jsonify({
                "error":
                    "trip not found"
            }), 404

        cursor.execute("""
            SELECT
                tp.id,
                s.*
            FROM Trip_Places tp
            JOIN Spots s
                ON tp.spot_id = s.spot_id
            WHERE tp.trip_id=?
            ORDER BY tp.id DESC
        """, (trip_id,))

        rows = cursor.fetchall()

        result = []

        for row in rows:

            if (
                row["open_time"]
                and row["close_time"]
            ):

                active_time = (
                    f'{row["open_time"]} ~ '
                    f'{row["close_time"]}'
                )

            else:

                active_time = "08:00~17:00"

            result.append({

                "trip_place_id":
                    row["id"],

                "spot_id":
                    row["spot_id"],

                "name":
                    row["name"],

                "address":
                    row["location"],

                "lat":
                    row["lat"],

                "lng":
                    row["lng"],

                "type":
                    row["category"],

                "category":
                    row["category"],

                "rating":
                    row["rating"],

                "cost":
                    row["cost"],

                "image":
                    row["image"],

                "stayTime":
                    "1~2 小時",

                "activeTime":
                    active_time,

                "description":
                    "推薦旅遊景點"
            })

        return jsonify(result)

    except Exception as e:

        print(
            "❌ 取得 Sidebar 景點失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Delete Sidebar Trip Place
# =========================================================

@app.route(
    "/api/trip-place/<int:trip_place_id>",
    methods=["DELETE"]
)
def delete_trip_place(trip_place_id):

    user_id = verify_token(request)

    if not user_id:
        return jsonify({
            "error":
                "unauthorized"
        }), 401

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT tp.*
            FROM Trip_Places tp
            JOIN Trips t
                ON tp.trip_id = t.trip_id
            WHERE
                tp.id=?
                AND t.user_id=?
        """, (
            trip_place_id,
            user_id
        ))

        place = cursor.fetchone()

        if not place:

            return jsonify({
                "error":
                    "not found"
            }), 404

        cursor.execute("""
            DELETE FROM Trip_Places
            WHERE id=?
        """, (trip_place_id,))

        conn.commit()

        return jsonify({
            "msg":
                "deleted"
        })

    except Exception as e:

        conn.rollback()

        print(
            "❌ 刪除 Sidebar 景點失敗：",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        conn.close()


# =========================================================
# Main
# =========================================================

if __name__ == "__main__":

    print("===================================")
    print("🚀 AI Travel Assistant Backend")
    print("🚀 Flask Server : http://0.0.0.0:5000")
    print("===================================")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )