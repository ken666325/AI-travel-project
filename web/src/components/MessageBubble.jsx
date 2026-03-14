export default function MessageBubble({ message }) {
  const isUser = message.sender === "user";
  return (
    <div style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      background: isUser ? "#0078FF" : "#e5e5ea",
      color: isUser ? "#fff" : "#000",
      padding: "10px 15px",
      borderRadius: "20px",
      marginBottom: "10px",
      maxWidth: "70%",
      wordBreak: "break-word", // 防止超長文字
      whiteSpace: "pre-wrap"   // ✅ 保留換行符號
    }}>
      {message.text}
    </div>
  )
}