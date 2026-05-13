import requests
import sqlite3
import urllib3
import json

# 關閉 SSL 警告
urllib3.disable_warnings()

DB_NAME = "database.db"

# 台灣觀光資料 API
url = "https://media.taiwan.net.tw/XMLReleaseALL_public/scenic_spot_C_f.json"

# 發送請求
res = requests.get(url, verify=False)

# ✅ 修正 UTF-8 BOM 問題
data = json.loads(res.content.decode("utf-8-sig"))

# 取得景點資料
spots = data["XML_Head"]["Infos"]["Info"]

# 連接 SQLite
conn = sqlite3.connect(DB_NAME)

# 建立 cursor
cursor = conn.cursor()

count = 0

for s in spots:

    # 景點名稱
    name = s.get("Name")

    # 描述
    description = s.get("Description") or s.get("DescriptionDetail")

    # 地址
    address = s.get("Add")

    # 緯度
    lat = float(s.get("Py") or 0)

    # 經度
    lng = float(s.get("Px") or 0)

    # 圖片
    image = s.get("Picture1")

    # 類別
    category = s.get("Class1")

    # 如果沒有名稱就跳過
    if not name:
        continue

    # 寫入資料庫
    cursor.execute("""
        INSERT OR IGNORE INTO Spots
        (name, location, lat, lng, category, image, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        name,
        address,
        lat,
        lng,
        category,
        image,
        description
    ))

    count += 1

# 儲存
conn.commit()

# 關閉資料庫
conn.close()

print(f"✅ 匯入完成！共新增 {count} 筆資料")