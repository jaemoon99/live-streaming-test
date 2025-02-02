package com.example.livestreaming.model;

public class ChatMessage {
    // 메시지 타입: "CHAT" (채팅) 또는 "SIGNAL" (WebRTC signaling)
    private String type;
    // signaling 세부 타입: "join", "offer", "answer", "candidate" 등
    private String signalSubtype;
    // 채팅 내용 (signaling 메시지에는 사용하지 않음)
    private String content;
    // 송신자 ID (예: Teacher, Student1234 등)
    private String sender;
    // 대상자 ID (예: signaling 메시지 시 상대방)
    private String target;
    // 강의 세션 ID
    private String sessionId;
    // signaling 시 SDP, ICE candidate 등의 데이터를 담기 위한 필드
    private Object data;

    public ChatMessage() {}

    // Getter & Setter
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSignalSubtype() { return signalSubtype; }
    public void setSignalSubtype(String signalSubtype) { this.signalSubtype = signalSubtype; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
}
