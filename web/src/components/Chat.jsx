import { useState } from "react";
import { sendMessage } from "../api/api";

function Chat({ setPlaces, setItinerary }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "你好！請輸入你想去哪裡旅遊，我可以幫你推薦景點與安排行程。",
    },
  ]);

  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendMessage(input);

      const aiMessage = {
        sender: "ai",
        text: response.reply || "這是 AI 回覆",
      };

      setMessages((prev) => [...prev, aiMessage]);

      // 更新推薦景點（左側 + 地圖）
      if (response.places) {
        setPlaces(response.places);
      }

      // 更新行程
      if (response.itinerary) {
        setItinerary(response.itinerary);
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "抱歉，目前無法取得回應。" },
      ]);
    }

    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-row ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div className={`message-bubble ${msg.sender}`}>{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入你的旅遊需求..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend}>送出</button>
      </div>
    </div>
  );
}

export default Chat;