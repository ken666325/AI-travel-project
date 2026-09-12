-- 使用者（Users 資料表：儲存系統中的所有使用者資訊）
CREATE TABLE IF NOT EXISTS Users (  -- 如果 Users 表不存在才建立，避免重複建立造成錯誤

    user_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 使用者ID（主鍵），自動遞增，每個使用者唯一
    name TEXT NOT NULL,                         -- 使用者姓名（文字型態），不可為空
    email TEXT NOT NULL UNIQUE,                        -- 使用者Email（文字型態），不可為空
    password TEXT NOT NULL                      -- 使用者密碼（文字型態），不可為空（實務應加密）
);


-- 旅遊行程（Trips 資料表：儲存每個使用者的旅遊計畫）
CREATE TABLE IF NOT EXISTS Trips (  -- 如果 Trips 表不存在才建立

    trip_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 行程ID（主鍵），自動遞增
    user_id INTEGER,                            -- 對應的使用者ID（外鍵）
    title TEXT NOT NULL,                        -- 行程名稱（例如：台北三日遊），不可為空
    start_date TEXT,                            -- 行程開始日期（文字格式，例如 YYYY-MM-DD）
    end_date TEXT,                              -- 行程結束日期
    budget REAL,                                -- 行程預算（數值型態，可有小數）

    FOREIGN KEY(user_id) REFERENCES Users(user_id)  -- 外鍵：此行程屬於哪個使用者
);


-- 景點（Spots 資料表：儲存所有旅遊景點資訊）
CREATE TABLE IF NOT EXISTS Spots (
    spot_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 景點ID（主鍵）

    name TEXT UNIQUE,                                  -- 景點名稱
    location TEXT,                              -- 地址

    lat REAL,                                   -- 🆕 緯度（地圖用）
    lng REAL,                                   -- 🆕 經度（地圖用）

    category TEXT,                              -- 類型（景點 / 美食 / 商場）
    rating REAL,                                -- 評分
    cost REAL,                                  -- 花費

    open_time TEXT,                             -- 開放時間（例如 09:00）
    close_time TEXT,                            -- 關閉時間（例如 22:00）

    image TEXT,                                 -- 🆕 圖片URL（前端顯示用）
    description TEXT
);


-- 行程日（Itineraries：一個行程的每天安排）
CREATE TABLE IF NOT EXISTS Itineraries (  -- 如果不存在才建立

    itinerary_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 行程日ID（主鍵）
    trip_id INTEGER,                                 -- 對應的行程ID（外鍵）
    day_number INTEGER,                              -- 第幾天（例如：第1天、第2天）
    date TEXT,                                       -- 日期（例如 2026-04-22）

    FOREIGN KEY(trip_id) REFERENCES Trips(trip_id)    -- 外鍵：這一天屬於哪個行程
);


-- 行程與景點（多對多關係表）
CREATE TABLE IF NOT EXISTS Itinerary_Spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    itinerary_id INTEGER,
    spot_id INTEGER,

    visit_order INTEGER,

    role TEXT,
    start_time TEXT,
    end_time TEXT,

    stay_time INTEGER,

    FOREIGN KEY(itinerary_id)
        REFERENCES Itineraries(itinerary_id),

    FOREIGN KEY(spot_id)
        REFERENCES Spots(spot_id)
);


-- 評價（Reviews：使用者對景點的評價）
CREATE TABLE IF NOT EXISTS Reviews (  -- 如果不存在才建立

    review_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 評價ID（主鍵）
    user_id INTEGER,                              -- 哪個使用者評論（外鍵）
    spot_id INTEGER,                              -- 評論哪個景點（外鍵）
    rating INTEGER,                               -- 評分（例如 1~5 分）
    comment TEXT,                                 -- 評論內容

    FOREIGN KEY(user_id) REFERENCES Users(user_id),  -- 關聯使用者
    FOREIGN KEY(spot_id) REFERENCES Spots(spot_id)   -- 關聯景點
);


-- 偏好（Preferences：使用者旅遊偏好設定）
CREATE TABLE IF NOT EXISTS Preferences (  -- 如果不存在才建立

    pref_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 偏好ID（主鍵）
    user_id INTEGER,                            -- 對應使用者（外鍵）
    category TEXT,                              -- 偏好類型（例如：美食、自然）
    budget_min REAL,                            -- 最低預算
    budget_max REAL,                            -- 最高預算

    FOREIGN KEY(user_id) REFERENCES Users(user_id)  -- 關聯使用者
);


-- AI推薦（AI_Recommendations：系統產生的推薦內容）
CREATE TABLE IF NOT EXISTS AI_Recommendations (  -- 如果不存在才建立

    rec_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 推薦ID（主鍵）
    user_id INTEGER,                           -- 對應使用者（外鍵）
    trip_id INTEGER,                           -- 對應行程（外鍵）
    generated_text TEXT,                       -- AI產生的推薦內容（文字）
    created_at TEXT,                           -- 建立時間（例如 timestamp）

    FOREIGN KEY(user_id) REFERENCES Users(user_id),  -- 關聯使用者
    FOREIGN KEY(trip_id) REFERENCES Trips(trip_id)   -- 關聯行程
);

CREATE TABLE IF NOT EXISTS Trip_Places (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    trip_id INTEGER,
    spot_id INTEGER,

    added_at TEXT,

    FOREIGN KEY(trip_id) REFERENCES Trips(trip_id),
    FOREIGN KEY(spot_id) REFERENCES Spots(spot_id)
);

INSERT INTO Spots (name, location, lat, lng, category, rating, cost, open_time, close_time, image)
VALUES 
('台北101', '台北市信義區信義路五段7號', 25.033964, 121.564468, '景點 / 商場', NULL, NULL, NULL, NULL,
 'https://stage.taipei101mall.com.tw/uploads/article/616965e786a25.png?q=80&w=1200&auto=format&fit=crop'),

('象山', '台北市信義區', 25.027033, 121.570497, '夜景 / 登山', NULL, NULL, NULL, NULL,
 'https://egoldenyears.com/wp-content/uploads/2018/10/20181011_a0115.jpg?q=80&w=1200&auto=format&fit=crop'),

('西門町', '台北市萬華區', 25.042233, 121.507391, '商圈 / 美食', NULL, NULL, NULL, NULL,
 'https://www.taiwan.net.tw/att/1/big_scenic_spots/pic_2254_3.jpg?q=80&w=1200&auto=format&fit=crop'),

('中正紀念堂', '台北市中正區中山南路21號', 25.034535, 121.521275, '歷史景點', NULL, NULL, NULL, NULL,
 'https://upload.wikimedia.org/wikipedia/commons/0/0d/2022%E5%B9%B4%E7%9A%84%E4%B8%AD%E6%AD%A3%E7%B4%80%E5%BF%B5%E5%A0%82.jpg?q=80&w=1200&auto=format&fit=crop');

 