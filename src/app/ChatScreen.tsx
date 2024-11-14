import React, { useEffect, useRef, useState } from "react";
import "./ChatScreen.css";
import { remark } from 'remark';
import html from 'remark-html';

type ChatScreenProps = {
  setTables: (tables: string[]) => void;
};

const ChatScreen = ({ setTables }: ChatScreenProps) => {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: `Hi there! I'm your SQL Assistant, ready to make your data talk! To get started, please share your database connection string. Need an example? Here's a quick one: <br><br>
    postgres://read_only_user:123456@autorack.proxy.rlwy.net:33527/railway <br><br>
    Once connected, we'll dive straight into querying magic together!` },
  ]);
  const [inputText, setInputText] = useState("");
  const [disabledSendButton, setDisabledSendButton] = useState(false);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") {
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: inputText.trim(),
    };
    setMessages([...messages, newMessage]);
    setInputText("");
    setDisabledSendButton(true);

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputText.trim(), history: messages }),
      })
      const data = await res.json()
      console.log({ data })
      const message = data.message;

      if (data.model) {
        const uniqueTables = data.model.map((v: { table_name: string }) => v.table_name).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
        console.log({ uniqueTables })
        setTables(uniqueTables);
      }

      console.log({ message })
      console.log({ transformed: await transformFromMarkdown(message) })
      const assistantMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: await transformFromMarkdown(message),
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

    setDisabledSendButton(false);
  };

  const handleInputChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: { key: string; }) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const transformFromMarkdown = async (content: string) => {
    // first check if the string is already in html format
    const htmlRegex = /<[^>]*>/g;
    if (htmlRegex.test(content)) {
      return content;
    }
    const processedContent = await remark()
      .use(html)
      .process(content);
    return processedContent.toString();
  }

  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content" dangerouslySetInnerHTML={{ __html: message.content }}>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div role="status" className="loading-spinner" hidden={!disabledSendButton}>
        <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSendMessage} disabled={disabledSendButton}>Send</button>
      </div>
    </div>

  );
};

export default ChatScreen;
