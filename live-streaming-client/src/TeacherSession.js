// TeacherSession.js
import React, { useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Chat from "./Chat";

const TeacherSession = () => {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [stream, setStream] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const localVideoRef = useRef(null);

  // "Start New Lecture" 버튼 클릭 시 실행
  const handleStartLecture = async () => {
    if (started) return; // 이미 시작한 경우 실행하지 않음

    // 1. 카메라/마이크 스트림 획득 (에러 발생 시 빈 화면으로 진행)
    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing media devices (proceeding with blank video):", error);
      // 에러가 발생하면 stream을 null로 설정하고 계속 진행
      setStream(null);
    }

    // 2. 강의 생성 API 호출 (강사 이름은 "Teacher"로 고정)
    let lectureId;
    try {
      const response = await fetch(
        "http://localhost:8080/api/lectures/start?teacher=Teacher",
        { method: "POST" }
      );
      const data = await response.json();
      lectureId = data.id;
      setSessionId(lectureId);
      console.log("Lecture started with session ID:", lectureId);
    } catch (error) {
      console.error("Error starting lecture:", error);
      return;
    }

    // 3. STOMP/WebSocket 연결 생성
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    client.onConnect = (frame) => {
      console.log("STOMP connected:", frame);
      // 해당 세션의 토픽 구독
      client.subscribe(`/topic/lecture/${lectureId}`, (message) => {
        const msg = JSON.parse(message.body);
        if (msg.type === "CHAT") {
          setChatMessages((prev) => [...prev, msg]);
        }
        // signaling 메시지 처리(offer/answer 등)는 필요에 따라 추가 구현
      });
      // 강사 가입(signaling) 메시지 전송
      const joinMsg = {
        type: "SIGNAL",
        signalSubtype: "teacher-join",
        sender: "Teacher",
        sessionId: lectureId,
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
    setStarted(true);
  };

  const sendChatMessage = (messageContent) => {
    if (!stompClient || !sessionId) {
      console.error("STOMP client not connected or sessionId missing");
      return;
    }
    const chatMsg = {
      type: "CHAT",
      content: messageContent,
      sender: "Teacher",
      sessionId: sessionId,
    };
    stompClient.publish({
      destination: "/app/signal",
      body: JSON.stringify(chatMsg),
    });
  };

  const endLecture = async () => {
    if (!sessionId) return;
    try {
      await fetch(`http://localhost:8080/api/lectures/end/${sessionId}`, {
        method: "POST",
      });
      console.log("Lecture ended");
    } catch (error) {
      console.error("Error ending lecture:", error);
    }
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    // 초기 상태 복원
    setSessionId(null);
    setChatMessages([]);
    setStarted(false);
  };

  return (
    <div>
      {!started ? (
        <button onClick={handleStartLecture}>Start New Lecture</button>
      ) : (
        <div>
          <h2>Teacher Session</h2>
          <p>Session ID: {sessionId}</p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ width: "600px", border: "1px solid black" }}
          ></video>
          <button onClick={endLecture}>End Lecture</button>
          <Chat chatMessages={chatMessages} sendChatMessage={sendChatMessage} />
        </div>
      )}
    </div>
  );
};

export default TeacherSession;
