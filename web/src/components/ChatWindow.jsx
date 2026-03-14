import { useState, useRef, useEffect } from "react";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef();

  // 模擬 AI 回覆
  const sendMessage = () => {
    if (!input) return;
    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // 模擬 AI 回覆
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "AI 回覆: " + newMsg.text },
      ]);
    }, 500);
  };

  // 滾動到最底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white p-4">
      {/* 訊息區 */}
      <div className="flex-1 overflow-auto mb-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      <div className="flex">
        <input
          className="flex-1 border rounded-l-lg p-2 focus:outline-none"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入訊息..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-500 text-white px-4 rounded-r-lg"
          onClick={sendMessage}
        >
          送出
        </button>
      </div>
    </div>
  );
}