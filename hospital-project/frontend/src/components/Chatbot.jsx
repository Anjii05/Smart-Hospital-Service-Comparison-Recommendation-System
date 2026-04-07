import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your AI Health Assistant. Describe your symptoms and I can guide you.", type: "text" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage, type: "text" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage({ message: userMessage });
      const data = res.data;

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.reply, type: "text" }
        ]);

        if (data.hospitals && data.hospitals.length > 0) {
          setMessages((prev) => [
            ...prev,
            { 
              sender: "bot", 
              type: "hospitals", 
              text: `Here are the top ${data.department} hospitals:`,
              hospitals: data.hospitals 
            }
          ]);
        }
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't process that right now.", type: "text" }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Network Error: Could not reach the AI service.", type: "text" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button Drop */}
      <button 
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          backgroundColor: "var(--primary, #0f766e)",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px"
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          right: "24px",
          width: "350px",
          height: "500px",
          maxHeight: "70vh",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9998,
          overflow: "hidden",
          fontFamily: "Inter, sans-serif"
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: "var(--primary, #0f766e)",
            color: "white",
            padding: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            🤖 AI Symptom Checker
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f9fafb"
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.sender === "user" ? "var(--primary, #0f766e)" : "#e5e7eb",
                color: msg.sender === "user" ? "white" : "#1f2937",
                padding: "10px 14px",
                borderRadius: "12px",
                maxWidth: "85%",
                fontSize: "0.9rem",
                wordWrap: "break-word"
              }}>
                <div>{msg.text}</div>
                {msg.type === "hospitals" && (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {msg.hospitals.map(h => (
                      <div key={h.id} style={{
                        backgroundColor: "#fff",
                        color: "#111",
                        padding: "8px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        border: "1px solid #d1d5db"
                      }}>
                        <strong>{h.name}</strong><br/>
                        ⭐ {h.rating} • {h.department}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "#e5e7eb", padding: "10px", borderRadius: "12px", fontSize: "0.9rem" }}>
                Typing...
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            display: "flex",
            padding: "12px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "white"
          }}>
            <input 
              type="text" 
              placeholder="Type your symptoms..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "20px",
                outline: "none",
                fontSize: "0.9rem"
              }}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                marginLeft: "8px",
                backgroundColor: "var(--primary, #0f766e)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
