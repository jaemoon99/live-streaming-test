package com.example.livestreaming.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트가 접속할 엔드포인트 (SockJS 사용)
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트 -> 서버 메시지 경로 prefix
        registry.setApplicationDestinationPrefixes("/app");
        // 서버 -> 클라이언트 브로드캐스트용 경로 prefix
        registry.enableSimpleBroker("/topic");
    }
}
