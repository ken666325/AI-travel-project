// src/components/Chat.jsx
import React, { useState, useRef, useEffect } from "react";
import { sendMessage } from "../api/api";

export default function Chat({ messages, setMessages }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);

    const response = await sendMessage(input);
    const aiMessage = { sender: "ai", text: response.reply || "AI 回覆" };
    setMessages(prev => [...prev, aiMessage]);

    setInput("");
  };

  // 滾動到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ width:700, flex: 1, display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
      <div style={{ padding: 10, borderBottom: "1px solid #ccc" }}>AI 旅遊助理</div>
      <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: 10
            }}
          >
            <div
              style={{
                maxWidth: "60%",
                padding: "10px 15px",
                borderRadius: 20,
                background: msg.sender === "user" ? "#0078FF" : "#e0e0e0",
                color: msg.sender === "user" ? "#fff" : "#000",
                whiteSpace: "pre-wrap" // 讓換行有效
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ display: "flex", padding: 10 }}>
        <textarea
          style={{
            flex: 1,
            padding: "12px 15px",
            borderRadius: 25,
            border: "1px solid #ccc",
            outline: "none",
            fontSize: 16,
            resize: "none",
            height: 50,
            overflowY: "auto"
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="問我旅遊問題..."
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} style={{ marginLeft: 10 }}>送出</button>
      </div>
    </div>
  );
}