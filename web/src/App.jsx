// src/App.jsx

import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Itinerary from "./components/Itinerary";
import Map from "./components/Map";
import AuthPage from "./auth/AuthPage";
import Navbar from "./components/Navbar";

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

/* =========================================================
   JWT
========================================================= */

function parseToken(token) {
  try {
    const decoded = JSON.parse(
      atob(token.split(".")[1])
    );

    const now = Date.now() / 1000;

    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/* =========================================================
   建立空白行程
========================================================= */

const createEmptyDays = (count = 3) => {
  return Array.from(
    { length: count },
    (_, index) => ({
      day: index + 1,
      items: [],
    })
  );
};

/* =========================================================
   建立 itinerary item ID
========================================================= */

const createItemId = () => {
  return `item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

/* =========================================================
   將舊 spots 資料轉換成新的 items
========================================================= */

const normalizePlaceItem = (
  place,
  dayNumber,
  index
) => {
  return {
    id:
      place.id ||
      place.itemId ||
      `item-${dayNumber}-${index}-${String(
        place.name || "place"
      )
        .replace(/\s+/g, "-")
        .slice(0, 20)}`,

    itemType: "place",

    // spot / restaurant / hotel
    role: place.role || "spot",

    placeId:
      place.placeId ||
      place.spot_id ||
      place.spotId ||
      null,

    name: place.name || "未命名地點",

    lat: place.lat,
    lng: place.lng,

    address: place.address || "",

    // 新欄位
    category:
      place.category ||
      place.type ||
      "景點",

    // 舊欄位保留，避免其他元件暫時壞掉
    type:
      place.type ||
      place.category ||
      "景點",

    // 行程時間
    startTime: place.startTime || "",
    endTime: place.endTime || "",

    // 舊欄位
    stayTime:
      place.stayTime ||
      "1~2 小時",

    // 營業時間
    activeTime:
      place.activeTime ||
      "08:00~17:00",

    rating: place.rating,
    cost: place.cost,

    image: place.image || "",

    description:
      place.description ||
      "推薦旅遊景點",
  };
};

/* =========================================================
   將整個 itinerary 正規化
========================================================= */

const normalizeItinerary = (days) => {
  if (!Array.isArray(days)) {
    return createEmptyDays();
  }

  return days.map((dayObj, dayIndex) => {
    const dayNumber =
      dayObj.day || dayIndex + 1;

    // 新格式優先
    const sourceItems = Array.isArray(
      dayObj.items
    )
      ? dayObj.items
      : Array.isArray(dayObj.spots)
      ? dayObj.spots
      : [];

    return {
      ...dayObj,

      day: dayNumber,

      items: sourceItems.map(
        (item, itemIndex) =>
          normalizePlaceItem(
            item,
            dayNumber,
            itemIndex
          )
      ),

      // 不再使用 spots
      // 這裡刻意不保留 spots，
      // 避免之後兩份資料不同步。
      spots: undefined,
    };
  });
};

/* =========================================================
   App
========================================================= */

function App() {
  /* =======================================================
     Sidebar / Places
  ======================================================= */

  const [places, setPlaces] = useState([
    {
      name: "台北101",
      lat: 25.0339,
      lng: 121.5645,
      type: "景點 / 商場",
      category: "景點 / 商場",

      stayTime: "2 小時",

      activeTime: "08:00~17:00",

      address:
        "台北市信義區市府路45號",

      description:
        "台北最具代表性的地標之一",

      image:
        "https://stage.taipei101mall.com.tw/uploads/article/616965e786a25.png",
    },

    {
      name: "象山",
      lat: 25.027,
      lng: 121.57,
      type: "登山 / 夜景",
      category: "登山 / 夜景",

      stayTime: "1.5 小時",

      activeTime: "08:00~17:00",

      address:
        "台北市信義區信義路五段150巷",

      description:
        "熱門夜景景點",

      image:
        "https://egoldenyears.com/wp-content/uploads/2018/10/20181011_a0115.jpg",
    },

    {
      name: "西門町",
      lat: 25.0422,
      lng: 121.5079,
      type: "商圈 / 美食",
      category: "商圈 / 美食",

      stayTime: "2~3 小時",

      activeTime: "08:00~17:00",

      address:
        "台北市萬華區西門町",

      description:
        "知名商圈",

      image:
        "https://www.taiwan.net.tw/att/1/big_scenic_spots/pic_2254_3.jpg",
    },
  ]);

  /* =======================================================
     Chat
  ======================================================= */

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "你好！我可以幫你規劃旅遊行程～",
    },
  ]);

  /* =======================================================
     ⭐⭐⭐ NEW ITINERARY MODEL
     
     舊：
       Day
         spots[]

     新：
       Day
         items[]
           └─ place item
  ======================================================= */

  const [itinerary, setItinerary] =
    useState(() =>
      createEmptyDays(3)
    );

  /* =======================================================
     Selected place
  ======================================================= */

  const [selectedPlace, setSelectedPlace] =
    useState(null);

  const [selectedDay, setSelectedDay] =
    useState(null);

  const [activePlaceName, setActivePlaceName] =
    useState("");

  /* =======================================================
     Route / Transport
  ======================================================= */

  const [routeInfo, setRouteInfo] =
    useState({});

  const [expandedDay, setExpandedDay] =
    useState(null);

  /*
    transportDirty:

    {
      1: true,
      2: false,
      3: true
    }

    true  = 這一天的交通資訊可能已經過期
    false = 目前沒有標記為過期
  */
  const [transportDirty, setTransportDirty] =
    useState({});

  /* =======================================================
     Transport Dirty Helpers
  ======================================================= */

  // 標記指定 Day 的交通資訊需要重新計算
  const markTransportDirty = (
    dayNumbers
  ) => {
    const days = Array.isArray(dayNumbers)
      ? dayNumbers
      : [dayNumbers];

    setTransportDirty((prev) => {
      const next = {
        ...prev,
      };

      days.forEach((dayNumber) => {
        if (dayNumber != null) {
          next[dayNumber] = true;
        }
      });

      return next;
    });
  };

  // 清除指定 Day 的交通過期狀態
  const clearTransportDirty = (
    dayNumber
  ) => {
    setTransportDirty((prev) => ({
      ...prev,
      [dayNumber]: false,
    }));
  };

  /* =======================================================
     ⭐ 更新交通資訊
     
     現階段後端 AI 尚未完成，
     所以這裡先建立 callback。

     未來接 API 時，只需要在這裡：
       1. 傳 itinerary day items 給 backend
       2. backend 回傳 routeInfo
       3. setRouteInfo(...)
       4. clearTransportDirty(...)
  ======================================================= */

  const handleRefreshTransport = async (
    dayNumber
  ) => {
    const day = itinerary.find(
      (dayObj) =>
        dayObj.day === dayNumber
    );

    if (!day) return;

    console.log(
      "準備更新交通資訊：",
      day
    );

    /*
      TODO:

      未來接後端 AI API：

      const token =
        localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/api/transport`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            day: day.day,
            items: day.items,
          }),
        }
      );

      const data = await res.json();

      setRouteInfo((prev) => ({
        ...prev,
        [`Day${dayNumber}`]:
          data.routeInfo,
      }));

      clearTransportDirty(dayNumber);
    */

    alert(
      "目前後端 AI 交通 API 尚未完成，\n這裡已先預留更新交通資訊的功能。"
    );
  };

  /* =======================================================
     Auth
  ======================================================= */

  const [token, setToken] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [showAuth, setShowAuth] =
    useState(false);

  /* =======================================================
     Trips
  ======================================================= */

  const [trips, setTrips] =
    useState([]);

  const [currentTripId, setCurrentTripId] =
    useState(null);

  const [tripTitle, setTripTitle] =
    useState("我的旅遊行程");

  /* =======================================================
     Map
  ======================================================= */

  const [showMap, setShowMap] =
    useState(false);

  /* =======================================================
     Load Token
  ======================================================= */

  useEffect(() => {
    const saved =
      localStorage.getItem("token");

    if (saved) {
      setToken(saved);
    }
  }, []);

  /* =======================================================
     Parse User
  ======================================================= */

  useEffect(() => {
    if (token) {
      const userData =
        parseToken(token);

      if (!userData) {
        localStorage.removeItem(
          "token"
        );

        setToken(null);
        setUser(null);
      } else {
        setUser(userData);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  /* =======================================================
     Logout
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    setToken(null);
    setUser(null);
  };

  /* =======================================================
     Login
  ======================================================= */

  const handleLogin = () => {
    setShowAuth(true);
  };

  /* =======================================================
     ⭐ 移動 itinerary item
     
     支援：
       Day 1 → Day 1
       Day 1 → Day 2
  ======================================================= */

  const moveItem = (
    sourceDayNumber,
    sourceIndex,
    destDayNumber,
    destIndex
  ) => {
    setItinerary((prev) => {
      const sourceDay =
        prev.find(
          (day) =>
            day.day ===
            sourceDayNumber
        );

      const destDay =
        prev.find(
          (day) =>
            day.day ===
            destDayNumber
        );

      if (!sourceDay || !destDay) {
        return prev;
      }

      const sourceItems = [
        ...(sourceDay.items || []),
      ];

      const destItems =
        sourceDayNumber ===
        destDayNumber
          ? sourceItems
          : [
              ...(destDay.items || []),
            ];

      const [movedItem] =
        sourceItems.splice(
          sourceIndex,
          1
        );

      if (!movedItem) {
        return prev;
      }

      destItems.splice(
        destIndex,
        0,
        movedItem
      );

      const updated =
        prev.map((dayObj) => {
          // 同一天移動
          if (
            sourceDayNumber ===
              destDayNumber &&
            dayObj.day ===
              sourceDayNumber
          ) {
            return {
              ...dayObj,
              items: destItems,
            };
          }

          // 跨天來源
          if (
            dayObj.day ===
            sourceDayNumber
          ) {
            return {
              ...dayObj,
              items: sourceItems,
            };
          }

          // 跨天目的地
          if (
            dayObj.day ===
            destDayNumber
          ) {
            return {
              ...dayObj,
              items: destItems,
            };
          }

          return dayObj;
        });

      return updated;
    });

    // 交通關係可能改變
    markTransportDirty([
      sourceDayNumber,
      destDayNumber,
    ]);
  };

  /* =======================================================
     ⭐ 刪除 itinerary item
  ======================================================= */

  const deleteItem = (
    dayNumber,
    index
  ) => {
    setItinerary((prev) =>
      prev.map((dayObj) =>
        dayObj.day === dayNumber
          ? {
              ...dayObj,
              items: (
                dayObj.items || []
              ).filter(
                (_, i) =>
                  i !== index
              ),
            }
          : dayObj
      )
    );

    // 刪除後交通順序可能改變
    markTransportDirty(
      dayNumber
    );
  };

  /* =======================================================
     新增 item
     
     這個 helper 給未來 Chat / AI 使用
  ======================================================= */

  const addItemToDay = (
    dayNumber,
    place,
    extra = {}
  ) => {
    const newItem = {
      id:
        place.id ||
        createItemId(),

      itemType: "place",

      role:
        extra.role ||
        place.role ||
        "spot",

      placeId:
        place.placeId ||
        place.spot_id ||
        place.spotId ||
        null,

      name:
        place.name ||
        "未命名地點",

      lat: place.lat,
      lng: place.lng,

      address:
        place.address || "",

      category:
        place.category ||
        place.type ||
        "景點",

      type:
        place.type ||
        place.category ||
        "景點",

      startTime:
        extra.startTime ||
        place.startTime ||
        "",

      endTime:
        extra.endTime ||
        place.endTime ||
        "",

      stayTime:
        place.stayTime ||
        "1~2 小時",

      activeTime:
        place.activeTime ||
        "08:00~17:00",

      rating: place.rating,
      cost: place.cost,

      image:
        place.image || "",

      description:
        place.description ||
        "推薦旅遊景點",
    };

    setItinerary((prev) =>
      prev.map((dayObj) =>
        dayObj.day === dayNumber
          ? {
              ...dayObj,
              items: [
                ...(dayObj.items ||
                  []),
                newItem,
              ],
            }
          : dayObj
      )
    );

    markTransportDirty(
      dayNumber
    );

    return newItem;
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <>
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {showAuth && !token ? (
        <AuthPage
          setToken={(t) => {
            localStorage.setItem(
              "token",
              t
            );

            setToken(t);
            setShowAuth(false);
          }}
        />
      ) : (
        <PanelGroup direction="horizontal">

          {/* =================================================
              Sidebar
          ================================================= */}
          <Panel
            defaultSize={10}
            minSize={10}
          >
            <Sidebar
              places={places}
              setPlaces={setPlaces}

              currentTripId={
                currentTripId
              }

              itinerary={itinerary}
              setItinerary={
                setItinerary
              }

              setSelectedPlace={
                setSelectedPlace
              }

              setSelectedDay={
                setSelectedDay
              }

              activePlaceName={
                activePlaceName
              }

              setActivePlaceName={
                setActivePlaceName
              }
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* =================================================
              Main
          ================================================= */}
          <Panel
            defaultSize={50}
            minSize={30}
          >
            <PanelGroup direction="vertical">

              {/* =================================================
                  Chat
              ================================================= */}
              <Panel
                defaultSize={35}
                minSize={20}
              >
                <Chat
                  messages={messages}
                  setMessages={
                    setMessages
                  }

                  setPlaces={
                    setPlaces
                  }

                  setItinerary={
                    setItinerary
                  }
                />
              </Panel>

              <PanelResizeHandle className="resize-handle-horizontal" />

              {/* =================================================
                  Itinerary
              ================================================= */}
              <Panel
                defaultSize={65}
                minSize={30}
              >
                <div className="itinerary-wrapper">
                  <Itinerary
                    itinerary={
                      itinerary
                    }

                    setItinerary={
                      setItinerary
                    }

                    setSelectedPlace={
                      setSelectedPlace
                    }

                    setSelectedDay={
                      setSelectedDay
                    }

                    activePlaceName={
                      activePlaceName
                    }

                    setActivePlaceName={
                      setActivePlaceName
                    }

                    routeInfo={
                      routeInfo
                    }

                    expandedDay={
                      expandedDay
                    }

                    setExpandedDay={
                      setExpandedDay
                    }

                    user={user}

                    moveItem={
                      moveItem
                    }

                    deleteItem={
                      deleteItem
                    }

                    trips={trips}
                    setTrips={
                      setTrips
                    }

                    currentTripId={
                      currentTripId
                    }

                    setCurrentTripId={
                      setCurrentTripId
                    }

                    tripTitle={
                      tripTitle
                    }

                    setTripTitle={
                      setTripTitle
                    }

                    setShowMap={
                      setShowMap
                    }

                    places={places}
                    setPlaces={
                      setPlaces
                    }

                    /* ===== NEW ===== */
                    transportDirty={
                      transportDirty
                    }

                    markTransportDirty={
                      markTransportDirty
                    }

                    clearTransportDirty={
                      clearTransportDirty
                    }

                    handleRefreshTransport={
                      handleRefreshTransport
                    }

                    addItemToDay={
                      addItemToDay
                    }
                  />
                </div>
              </Panel>

            </PanelGroup>
          </Panel>
        </PanelGroup>
      )}

      {/* =====================================================
          Map Modal
      ===================================================== */}

      <div
        className={`map-modal-overlay ${
          showMap
            ? "show-map"
            : "hide-map"
        }`}
      >
        <div className="map-modal">

          <div className="map-modal-header">
            <span>
              🗺 行程地圖
            </span>

            <button
              onClick={() =>
                setShowMap(false)
              }
            >
              ✕
            </button>
          </div>

          <div className="map-modal-content">
            <Map
              places={places}

              itinerary={
                itinerary
              }

              selectedPlace={
                selectedPlace
              }

              selectedDay={
                selectedDay
              }

              activePlaceName={
                activePlaceName
              }

              setActivePlaceName={
                setActivePlaceName
              }

              setRouteInfo={
                setRouteInfo
              }
            />
          </div>

        </div>
      </div>
    </>
  );
}

export default App;



/*// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Itinerary from "./components/Itinerary";
import Map from "./components/Map";
import AuthPage from "./auth/AuthPage";
import Navbar from "./components/Navbar";

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";


// decode JWT 
function parseToken(token) {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));

    const now = Date.now() / 1000;
    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

function App() {
  const [places, setPlaces] = useState([
    {
      name: "台北101",
      lat: 25.0339,
      lng: 121.5645,
      type: "景點 / 商場",
      stayTime: "2 小時",
      activeTime: "08:00~17:00",
      address: "台北市信義區市府路45號",
      description: "台北最具代表性的地標之一",
      image:
        "https://stage.taipei101mall.com.tw/uploads/article/616965e786a25.png",
    },
    {
      name: "象山",
      lat: 25.027,
      lng: 121.57,
      type: "登山 / 夜景",
      stayTime: "1.5 小時",
      activeTime: "08:00~17:00",
      address: "台北市信義區信義路五段150巷",
      description: "熱門夜景景點",
      image:
        "https://egoldenyears.com/wp-content/uploads/2018/10/20181011_a0115.jpg",
    },
    {
      name: "西門町",
      lat: 25.0422,
      lng: 121.5079,
      type: "商圈 / 美食",
      stayTime: "2~3 小時",
      activeTime: "08:00~17:00",
      address: "台北市萬華區西門町",
      description: "知名商圈",
      image:
        "https://www.taiwan.net.tw/att/1/big_scenic_spots/pic_2254_3.jpg",
    },
  ]);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好！我可以幫你規劃旅遊行程～" },
  ]);

  const [itinerary, setItinerary] = useState([
    { day: 1, spots: [] },
    { day: 2, spots: [] },
    { day: 3, spots: [] },
  ]);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activePlaceName, setActivePlaceName] = useState("");

  const [routeInfo, setRouteInfo] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);

  // ===== AUTH ===== 
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [tripTitle, setTripTitle] = useState("我的旅遊行程");

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) {
      const userData = parseToken(token);

      if (!userData) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } else {
        setUser(userData);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const handleLogin = () => {
    setShowAuth(true);
  };

  // =========================================
  // ⭐⭐⭐ 這裡是你缺的功能（重點）
  // =========================================

  // ⬆️⬇️ 移動景點
  const moveItem = (dayIndex, index, direction) => {
    setItinerary((prev) => {
      const newDays = [...prev];
      const list = [...newDays[dayIndex].spots];

      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= list.length) return prev;

      [list[index], list[newIndex]] = [list[newIndex], list[index]];
      newDays[dayIndex].spots = list;

      return newDays;
    });
  };

  // ❌ 刪除景點
  const deleteItem = (dayIndex, index) => {
    setItinerary((prev) => {
      const newDays = [...prev];
      newDays[dayIndex].spots.splice(index, 1);
      return newDays;
    });
  };

  return (
    <>
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />

      {showAuth && !token ? (
        <AuthPage
          setToken={(t) => {
            localStorage.setItem("token", t);
            setToken(t);
            setShowAuth(false);
          }}
        />
      ) : (
        <PanelGroup direction="horizontal">
          <Panel defaultSize={10} minSize={10}>
            <Sidebar
              places={places}
              setPlaces={setPlaces}
              currentTripId={currentTripId}
              itinerary={itinerary}
              setItinerary={setItinerary}
              setSelectedPlace={setSelectedPlace}
              setSelectedDay={setSelectedDay}
              activePlaceName={activePlaceName}
              setActivePlaceName={setActivePlaceName}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">

              // Chat 
              <Panel defaultSize={35} minSize={20}>
                <Chat
                  messages={messages}
                  setMessages={setMessages}
                  setPlaces={setPlaces}
                  setItinerary={setItinerary}
                />
              </Panel>

              <PanelResizeHandle className="resize-handle-horizontal" />

              {// Itinerary 
              <Panel defaultSize={65} minSize={30}>
                <div className="itinerary-wrapper">
                  <Itinerary
                    itinerary={itinerary}
                    setItinerary={setItinerary}
                    setSelectedPlace={setSelectedPlace}
                    setSelectedDay={setSelectedDay}
                    activePlaceName={activePlaceName}
                    setActivePlaceName={setActivePlaceName}
                    routeInfo={routeInfo}
                    expandedDay={expandedDay}
                    setExpandedDay={setExpandedDay}
                    user={user}
                    moveItem={moveItem}
                    deleteItem={deleteItem}
                    trips={trips}
                    setTrips={setTrips}
                    currentTripId={currentTripId}
                    setCurrentTripId={setCurrentTripId}
                    tripTitle={tripTitle}
                    setTripTitle={setTripTitle}
                    setShowMap={setShowMap}
                    places={places}
                    setPlaces={setPlaces}
                  />
                </div>
              </Panel>

            </PanelGroup>
          </Panel>

        </PanelGroup>
        
      )}
      
      <div
          className={`map-modal-overlay ${
            showMap ? "show-map" : "hide-map"
          }`}
        >
          <div className="map-modal">

            <div className="map-modal-header">
              <span>🗺 行程地圖</span>

              <button onClick={() => setShowMap(false)}>
                ✕
              </button>
            </div>

            <div className="map-modal-content">
              <Map
                places={places}
                itinerary={itinerary}
                selectedPlace={selectedPlace}
                selectedDay={selectedDay}
                activePlaceName={activePlaceName}
                setActivePlaceName={setActivePlaceName}
                setRouteInfo={setRouteInfo}
              />
            </div>

          </div>
        </div>
    </>
    
  );
}

export default App;*/