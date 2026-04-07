import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Itinerary from "./components/Itinerary";
import Map from "./components/Map";

function App() {
  const [places, setPlaces] = useState([
    {
      name: "台北101",
      lat: 25.0339,
      lng: 121.5645,
      type: "景點 / 商場",
      stayTime: "2 小時",
      address: "台北市信義區市府路45號",
      description: "台北最具代表性的地標之一，適合觀景、購物與拍照。",
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    },
    {
      name: "象山",
      lat: 25.027,
      lng: 121.57,
      type: "登山 / 夜景",
      stayTime: "1.5 小時",
      address: "台北市信義區信義路五段150巷",
      description: "可俯瞰台北101與城市夜景，是熱門拍照景點。",
      image:
        "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop",
    },
    {
      name: "西門町",
      lat: 25.0422,
      lng: 121.5079,
      type: "商圈 / 美食",
      stayTime: "2~3 小時",
      address: "台北市萬華區西門町",
      description: "台北知名商圈，集合美食、購物與年輕文化。",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    },
  ]);

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
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        places={places}
        setSelectedPlace={setSelectedPlace}
        setSelectedDay={setSelectedDay}
        setItinerary={setItinerary}
        activePlaceName={activePlaceName}
        setActivePlaceName={setActivePlaceName}
      />

      <div className="main-content">
        <div className={`chat-container ${isMapExpanded ? "chat-shrink" : ""}`}>
          <Chat
            messages={messages}
            setMessages={setMessages}
            setPlaces={setPlaces}
            setItinerary={setItinerary}
          />
        </div>

        <div className={`map-section ${isMapExpanded ? "expanded" : ""}`}>
          <div className="map-panel-header">
            <h3>地圖</h3>
            <button
              className="map-expand-btn"
              onClick={() => setIsMapExpanded((prev) => !prev)}
            >
              {isMapExpanded ? "縮小地圖" : "放大地圖"}
            </button>
          </div>

          <Map
            places={places}
            itinerary={itinerary}
            selectedPlace={selectedPlace}
            selectedDay={selectedDay}
            activePlaceName={activePlaceName}
            setActivePlaceName={setActivePlaceName}
          />
        </div>
      </div>

      <Itinerary
        itinerary={itinerary}
        setItinerary={setItinerary}
        setSelectedPlace={setSelectedPlace}
        setSelectedDay={setSelectedDay}
        activePlaceName={activePlaceName}
        setActivePlaceName={setActivePlaceName}
      />
    </div>
  );
}

export default App;