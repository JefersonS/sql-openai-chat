import React, { useState } from "react";
import "./ChatScreen.css";
import { markdownTransformer } from "./utils/markdownTransformer";

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hello, I'm a SQL assistant, please provide a connection string to get started." },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = async () => {
    if (inputText.trim() !== "") {
      const newMessage = {
        id: messages.length + 1,
        role: "user",
        content: inputText.trim(),
      };
      setMessages([...messages, newMessage]);
      setInputText("");

      try {
        const res = await fetch(`http://localhost:3000/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: inputText.trim(), history: messages }),
        })
        const data = await res.json()
        console.log({ data })
        const message = data.message;

        console.log({ message })
        console.log({ md: await markdownTransformer(message) })
        const assistantMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: message,
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } catch (error) {
        console.error("Error fetching response from OpenAI:", error);
        const assistantMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      }
    }
  };

  const handleInputChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <p dangerouslySetInnerHTML={{ __html: message.content }}></p>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div >
  );
};

export default ChatScreen;
