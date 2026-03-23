import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { sendMessage } from "../api/api";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const response = await sendMessage(input);
    const aiMessage = { sender: "ai", text: response.reply || "AI 回覆" };
    setMessages(prev => [...prev, aiMessage]);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      flex: 1,                    // 右側自動撐滿
      display: "flex",
      flexDirection: "column",
      background: "#f7f7f8",
      minWidth: "0"
    }}>
      {/* 標題 */}
      <div style={{
        padding: "15px",
        borderBottom: "1px solid #ccc",
        background: "#fff"
      }}>
        <h2 style={{margin:0, textAlign:"center", fontWeight:"600"}}>AI Travel Assistant</h2>
      </div>

      {/* 訊息區 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column"
      }}>
        {messages.map((msg,i)=><MessageBubble key={i} message={msg}/>)}
        <div ref={scrollRef}></div>
      </div>

      {/* 輸入區 */}
      <div style={{
        display:"flex",
        padding:"10px",
        borderTop:"1px solid #ccc",
        background:"#fff"
      }}>
        <input
          style={{
            flex:1,
            padding:"12px 15px",
            borderRadius:"25px",
            border:"1px solid #ccc",
            outline:"none",
            fontSize:"16px"
          }}
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="問我旅遊問題..."
          onKeyDown={e=>e.key==="Enter" && handleSend()}
        />
        <button
          style={{
            marginLeft:"10px",
            padding:"0 20px",
            borderRadius:"25px",
            border:"none",
            background:"#0078FF",
            color:"#fff",
            cursor:"pointer",
            fontSize:"16px"
          }}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}