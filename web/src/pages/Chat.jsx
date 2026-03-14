import { useState, useRef, useEffect } from "react";
import MessageBubble from "../components/MessageBubble";
import { sendMessage } from "../api/api";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const response = await sendMessage(input);
    const aiMessage = {
      sender: "ai",
      text: response.reply || "AI 回覆",
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  // 滾動到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* 標題 */}
      <h2 style={{ textAlign: "center", padding: "10px", background: "#f0f0f0" }}>
        AI Travel Assistant
      </h2>

      {/* 聊天訊息區 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      <div style={{ display: "flex", padding: "10px", background: "#fff" }}>
        <input
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px 0 0 8px",
            border: "1px solid #ccc",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="問我旅遊問題..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            borderRadius: "0 8px 8px 0",
            background: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;