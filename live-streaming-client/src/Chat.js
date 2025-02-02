// Chat.js
import React, { useState } from "react";

const Chat = ({ chatMessages, sendChatMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage("");
    }
  };

  return (
    <div style={{ border: "1px solid gray", padding: "10px", width: "600px" }}>
      <h3>Chat</h3>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {chatMessages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message"
          style={{ width: "80%" }}
        />
        <button type="submit" style={{ width: "18%", marginLeft: "2%" }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;