// StudentSession.js
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Chat from "./Chat";

const StudentSession = () => {
  const { sessionId, teacherName } = useParams();
  // 학생 고유 id를 생성 (예: "Student_랜덤숫자")
  const [studentId] = useState("Student_" + Math.floor(Math.random() * 10000));
  const [stompClient, setStompClient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  // WebRTC 연결 (학생은 강사와 1:1 연결)
  const [pc, setPc] = useState(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // 1. 강의 참여 API 호출
    fetch(`http://localhost:8080/api/lectures/join/${sessionId}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => console.log("Joined lecture", data))
      .catch((err) => console.error("Error joining lecture", err));

    // 2. STOMP/WebSocket 연결 생성 및 시그널링 처리
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    client.onConnect = (frame) => {
      console.log("STOMP connected for student:", frame);
      // 구독: 강의 세션 토픽
      client.subscribe(`/topic/lecture/${sessionId}`, (message) => {
        const msg = JSON.parse(message.body);
        if (msg.type === "CHAT") {
          setChatMessages((prev) => [...prev, msg]);
        } else if (msg.type === "SIGNAL") {
          // 시그널링 처리
          if (msg.signalSubtype === "offer" && msg.target === studentId) {
            // 강사로부터 offer를 받음
            // RTCPeerConnection 생성 (이미 생성되지 않은 경우)
            let peerConnection = pc;
            if (!peerConnection) {
              peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
              });
              // ICE candidate 발생 시 강사에게 전송
              peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                  const candidateMsg = {
                    type: "SIGNAL",
                    signalSubtype: "candidate",
                    sender: studentId,
                    target: "Teacher",
                    sessionId: sessionId,
                    data: event.candidate,
                  };
                  client.publish({
                    destination: "/app/signal",
                    body: JSON.stringify(candidateMsg),
                  });
                }
              };
              // 강사의 스트림을 받았을 때 (ontrack)
              peerConnection.ontrack = (event) => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = event.streams[0];
                }
              };
              setPc(peerConnection);
            }
            // 강사의 offer를 수신하고 remote description 설정
            peerConnection
              .setRemoteDescription(new RTCSessionDescription(msg.data))
              .then(() => {
                // answer 생성
                return peerConnection.createAnswer();
              })
              .then((answer) => {
                return peerConnection.setLocalDescription(answer).then(() => answer);
              })
              .then((answer) => {
                const answerMsg = {
                  type: "SIGNAL",
                  signalSubtype: "answer",
                  sender: studentId,
                  target: "Teacher",
                  sessionId: sessionId,
                  data: answer,
                };
                client.publish({
                  destination: "/app/signal",
                  body: JSON.stringify(answerMsg),
                });
              })
              .catch((err) => console.error("Error handling offer in student", err));
          } else if (msg.signalSubtype === "candidate" && msg.target === studentId) {
            // 강사로부터 ICE candidate를 받음
            if (pc) {
              pc.addIceCandidate(new RTCIceCandidate(msg.data)).catch((err) =>
                console.error("Error adding ICE candidate in student", err)
              );
            }
          }
        }
      });
      // 학생 가입 시그널 전송
      const joinMsg = {
        type: "SIGNAL",
        signalSubtype: "join",
        sender: studentId,
        target: "Teacher",
        sessionId: sessionId,
      };
      client.publish({
        destination: "/app/signal",
        body: JSON.stringify(joinMsg),
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error in student:", frame);
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [sessionId, teacherName, studentId, pc]);

  const sendChatMessage = (messageContent) => {
    if (!stompClient || !sessionId) {
      console.error("STOMP client not connected or sessionId missing");
      return;
    }
    const chatMsg = {
      type: "CHAT",
      content: messageContent,
      sender: studentId,
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
        playsInline
        controls
        style={{ width: "600px", border: "1px solid black" }}
      />
      <Chat chatMessages={chatMessages} sendChatMessage={sendChatMessage} />
    </div>
  );
};

export default StudentSession;