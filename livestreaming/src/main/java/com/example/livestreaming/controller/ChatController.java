package com.example.livestreaming.controller;

import com.example.livestreaming.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // 모든 signaling 및 채팅 메시지는 "/app/signal"으로 전송됨
    @MessageMapping("/signal")
    public void processSignal(@Payload ChatMessage chatMessage) {
        // 각 강의 세션별로 "/topic/lecture/{sessionId}"로 메시지 브로드캐스트
        String destination = "/topic/lecture/" + chatMessage.getSessionId();
        messagingTemplate.convertAndSend(destination, chatMessage);
    }
}
