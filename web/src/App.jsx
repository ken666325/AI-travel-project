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
      lat: 25.033964,
      lng: 121.564468,
      address: "台北市信義區",
      type: "景點",
      stayTime: "2 小時",
    },
    {
      name: "象山",
      lat: 25.027033,
      lng: 121.570497,
      address: "台北市信義區",
      type: "夜景 / 登山",
      stayTime: "1.5 小時",
    },
    {
      name: "西門町",
      lat: 25.042233,
      lng: 121.507391,
      address: "台北市萬華區",
      type: "商圈",
      stayTime: "2~3 小時",
    },
  ]);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const [itinerary, setItinerary] = useState({
    Day1: [],
    Day2: [],
    Day3: [],
  });

  return (
    <div className="app-container">
      {/* 左側推薦景點 */}
      <Sidebar
        places={places}
        setSelectedPlace={setSelectedPlace}
        setSelectedDay={setSelectedDay}
        setItinerary={setItinerary}
      />

      {/* 中間：聊天 + 地圖 */}
      <div className="main-content">
        <Chat setPlaces={setPlaces} setItinerary={setItinerary} />

        <div className="map-section">
          <Map
            places={places}
            itinerary={itinerary}
            selectedPlace={selectedPlace}
            selectedDay={selectedDay}
          />
        </div>
      </div>

      {/* 右側行程 */}
      <Itinerary
        itinerary={itinerary}
        setItinerary={setItinerary}
        setSelectedPlace={setSelectedPlace}
        setSelectedDay={setSelectedDay}
      />
    </div>
  );
}

export default App;