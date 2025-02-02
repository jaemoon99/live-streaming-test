// StudentSession.js
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Chat from "./Chat";

const StudentSession = () => {
  const { sessionId, teacherName } = useParams();
  const [stompClient, setStompClient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // 강의 참여 API 호출
    fetch(`http://localhost:8080/api/lectures/join/${sessionId}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => console.log("Joined lecture", data))
      .catch((err) => console.error("Error joining lecture", err));

    // STOMP/WebSocket 연결 생성
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });
    client.onConnect = (frame) => {
      console.log("STOMP connected for student:", frame);
      client.subscribe(`/topic/lecture/${sessionId}`, (message) => {
        const msg = JSON.parse(message.body);
        if (msg.type === "CHAT") {
          setChatMessages((prev) => [...prev, msg]);
        }
      });
      const joinMsg = {
        type: "SIGNAL",
        signalSubtype: "join",
        sender: "Student",
        target: teacherName,
        sessionId: sessionId,
      };
      client.publish({
        destination: "/app/signal",
        body: JSON.stringify(joinMsg),
      });
    };
    client.onStompError = (frame) => {
      console.error("STOMP error:", frame);
    };
    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [sessionId, teacherName]);

  const sendChatMessage = (messageContent) => {
    if (!stompClient || !sessionId) {
      console.error("STOMP client not connected or sessionId missing");
      return;
    }
    const chatMsg = {
      type: "CHAT",
      content: messageContent,
      sender: "Student",
      sessionId: sessionId,
    };
    stompClient.publish({
      destination: "/app/signal",
      body: JSON.stringify(chatMsg),
    });
  };

  return (
    <div>
      <h2>Student Session</h2>
      <p>Session ID: {sessionId}</p>
      <video
        ref={remoteVideoRef}
        autoPlay
        style={{ width: "600px", border: "1px solid black" }}
      ></video>
      <Chat chatMessages={chatMessages} sendChatMessage={sendChatMessage} />
    </div>
  );
};

export default StudentSession;
