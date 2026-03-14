function MessageBubble({message}){

  const isUser = message.sender === "user";

  return(

    <div style={{
      textAlign:isUser ? "right":"left",
      marginBottom:"10px"
    }}>

      <span style={{
        background:isUser ? "#4CAF50":"#ddd",
        color:isUser ? "white":"black",
        padding:"10px",
        borderRadius:"10px",
        display:"inline-block"
      }}>
        {message.text}
      </span>

    </div>

  )

}

export default MessageBubble;