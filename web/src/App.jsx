import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Itinerary from "./components/Itinerary";

function App() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "歡迎使用 AI 旅遊助理！" },
  ]);

  const [aiRecommendations, setAiRecommendations] = useState([
    "台北101",
    "九份老街",
    "淡水漁人碼頭",
  ]);

  const [itinerary, setItinerary] = useState({ Day1: [], Day2: [], Day3: [], Day4: [], Day5: [] });

  // 加入景點
  const addToDay = (spot, day) => {
    setItinerary((prev) => ({ ...prev, [day]: [...prev[day], spot] }));
  };

  // 刪除景點
  const removeSpot = (day, index) => {
    setItinerary((prev) => {
      const dayList = [...prev[day]];
      dayList.splice(index, 1);
      return { ...prev, [day]: dayList };
    });
  };

  // 上下移動景點
  const moveSpot = (day, index, direction) => {
    setItinerary((prev) => {
      const dayList = [...prev[day]];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= dayList.length) return prev;
      [dayList[index], dayList[newIndex]] = [dayList[newIndex], dayList[index]];
      return { ...prev, [day]: dayList };
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar aiRecommendations={aiRecommendations} addToDay={addToDay} />
      <Chat messages={messages} setMessages={setMessages} />
      <Itinerary
        itinerary={itinerary}
        removeSpot={removeSpot}
        moveSpot={moveSpot}
      />
    </div>
  );
}

export default App;