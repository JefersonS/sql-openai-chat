import React, { useEffect, useRef, useState, useCallback } from "react";
import { remark } from "remark";
import html from "remark-html";
import LoadingIcon from "./icons/LoadingIcon";

type ChatScreenProps = {
  setTables: (tables: string[]) => void;
};

const ChatScreen = ({ setTables }: ChatScreenProps) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: `Hi there! I'm your SQL Assistant, ready to make your data talk! To get started, please share your database connection string. Need an example? Here's a quick one: <br><br>
      postgres://read_only_user:123456@junction.proxy.rlwy.net:34216/railway <br><br>
      Once connected, we'll dive straight into querying magic together!`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [disabledSendButton, setDisabledSendButton] = useState(false);

  // Use memoized function for scrolling
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      });
      const data = await res.json();
      const message = data.message;

      if (data.model) {
        const uniqueTables = data.model
          .map((v: { table_name: string }) => v.table_name)
          .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
        setTables(uniqueTables);
      }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const transformFromMarkdown = async (content: string) => {
    const htmlRegex = /<[^>]*>/g;
    if (htmlRegex.test(content)) {
      return content;
    }
    const processedContent = await remark().use(html).process(content);
    return processedContent.toString();
  };

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-white">
      <div className="h-[70vh] w-full overflow-y-auto p-5 flex-grow">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg break-words my-3 sm:mx-[20%] ${message.role === "user"
              ? "bg-gray-200 self-end ml-auto max-w-[90%] sm:ml-auto sm:max-w-[40%]"
              : "bg-white text-black self-start mr-auto max-w-[80%] sm:mr-auto sm:max-w-[60%]"
              }`}
          >{/* Repeating ml-auto and mr-right above /\ cause, for some reason, it loses this prop when resizing */}
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {disabledSendButton && (
        <div role="status" className="mt-2">
          <LoadingIcon />
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <div className="w-full flex justify-between items-center p-4">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="w-[85%] sm:ml-[20%] p-2 border border-gray-300 border-r-0 rounded-l-full text-base focus:outline-none"
          aria-label="Type a message input"
        />
        <button
          onClick={handleSendMessage}
          disabled={disabledSendButton}
          className={`w-[100px] sm:w-[200px] p-2 sm:mr-[20%] rounded-r-full border border-gray-300 border-l-0 ${disabledSendButton
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-400 text-white"
            }`}
          aria-label="Send message button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
