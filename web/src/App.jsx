import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Itinerary from "./components/Itinerary";
import Map from "./components/Map";

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

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

  return (
    <PanelGroup direction="horizontal">

      {/* Sidebar */}
      <Panel defaultSize={20} minSize={10}>
        <Sidebar
          places={places}
          setSelectedPlace={setSelectedPlace}
          setSelectedDay={setSelectedDay}
          setItinerary={setItinerary}
          activePlaceName={activePlaceName}
          setActivePlaceName={setActivePlaceName}
        />
      </Panel>

      <PanelResizeHandle className="resize-handle" />

      {/* 中間（Chat + Map） */}
      <Panel defaultSize={50} minSize={30}>
        <PanelGroup direction="vertical">

          {/* Chat */}
          <Panel defaultSize={40} minSize={20}>
            <Chat
              messages={messages}
              setMessages={setMessages}
              setPlaces={setPlaces}
              setItinerary={setItinerary}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle-horizontal" />

          {/* Map */}
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

      {/* Itinerary */}
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
        />
      </Panel>

    </PanelGroup>
  );
}

export default App;