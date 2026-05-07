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


/* decode JWT */
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

  /* ===== AUTH ===== */
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [tripTitle, setTripTitle] = useState("我的旅遊行程");

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
          <Panel defaultSize={20} minSize={10}>
            <Sidebar
              places={places}
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
              <Panel defaultSize={40} minSize={20}>
                <Chat
                  messages={messages}
                  setMessages={setMessages}
                  setPlaces={setPlaces}
                  setItinerary={setItinerary}
                />
              </Panel>

              <PanelResizeHandle className="resize-handle-horizontal" />

              <Panel defaultSize={60} minSize={30}>
                <div className="panel-content">
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
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* ⭐ 這裡補上 props */}
          <Panel defaultSize={30} minSize={10}>
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
            />
          </Panel>
        </PanelGroup>
      )}
    </>
  );
}

export default App;

/*import { useEffect, useState } from "react";
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
  const [places, setPlaces] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好！我可以幫你規劃旅遊行程～" },
  ]);

  const [itinerary, setItinerary] = useState({
    Day1: [],
    Day2: [],
    Day3: [],
  });

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activePlaceName, setActivePlaceName] = useState("");

  const [routeInfo, setRouteInfo] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);

  // ⭐ 新增
  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [tripTitle, setTripTitle] = useState("我的旅遊行程");

  // ===== AUTH ===== 
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

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
          <Panel defaultSize={20}>
            <Sidebar
              places={places}
              setSelectedPlace={setSelectedPlace}
              setSelectedDay={setSelectedDay}
              setItinerary={setItinerary}
              activePlaceName={activePlaceName}
              setActivePlaceName={setActivePlaceName}
            />
          </Panel>

          <PanelResizeHandle />

          <Panel defaultSize={50}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={40}>
                <Chat
                  messages={messages}
                  setMessages={setMessages}
                  setPlaces={setPlaces}
                  setItinerary={setItinerary}
                />
              </Panel>

              <PanelResizeHandle />

              <Panel defaultSize={60}>
                <Map
                  places={places}
                  itinerary={itinerary}
                  selectedPlace={selectedPlace}
                  selectedDay={selectedDay}
                  activePlaceName={activePlaceName}
                  setActivePlaceName={setActivePlaceName}
                  setRouteInfo={setRouteInfo}
                />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle />

          <Panel defaultSize={30}>
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

              // ⭐ 新增
              trips={trips}
              setTrips={setTrips}
              currentTripId={currentTripId}
              setCurrentTripId={setCurrentTripId}
              tripTitle={tripTitle}
              setTripTitle={setTripTitle}
            />
          </Panel>
        </PanelGroup>
      )}
    </>
  );
}

export default App;*/