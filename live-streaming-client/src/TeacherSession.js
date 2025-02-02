// TeacherSession.js
import React, { useState, useRef, useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Chat from "./Chat";

const TeacherSession = () => {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const localVideoRef = useRef(null);

  // "Start New Lecture" 버튼 클릭 시 실행
  const handleStartLecture = async () => {
    if (started) return; // 이미 시작한 경우 무시

    // 1. 카메라/마이크 스트림 획득 (실패 시 fallback 스트림 사용)
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      console.log("Camera stream obtained.");
    } catch (error) {
      console.error(
        "Error accessing media devices, using fallback blank stream:",
        error
      );
      // fallback: 검은색 캔버스 스트림 생성
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stream = canvas.captureStream(30);
      console.log("Fallback blank stream created.");
    }
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    console.log("Stream tracks:", stream.getTracks());

    // 2. 강의 생성 API 호출 (강사 id는 "Teacher")
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
      // 해당 세션의 토픽 구독 (여기서는 채팅만 처리)
      client.subscribe(`/topic/lecture/${lectureId}`, (message) => {
        const msg = JSON.parse(message.body);
        if (msg.type === "CHAT") {
          setChatMessages((prev) => [...prev, msg]);
        }
        // signaling 메시지(offer/answer 등)는 추가 구현 필요
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

  // useEffect: localStream이 변경될 때마다 video 태그에 스트림 할당 및 재생 시도
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current
          .play()
          .then(() => console.log("Video is playing."))
          .catch((error) =>
            console.error("Error playing video via onloadedmetadata:", error)
          );
      };
      // 추가로 수동 재생 시도 (브라우저 정책에 따라 필요할 수 있음)
      localVideoRef.current
        .play()
        .then(() => console.log("Manual play succeeded."))
        .catch((error) => console.error("Manual play error:", error));
    }
  }, [localStream]);

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
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
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
            playsInline
            controls
            style={{ width: "600px", border: "1px solid black" }}
          />
          <button onClick={endLecture}>End Lecture</button>
          <Chat chatMessages={chatMessages} sendChatMessage={sendChatMessage} />
        </div>
      )}
    </div>
  );
};

export default TeacherSession;