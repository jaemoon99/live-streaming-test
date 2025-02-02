package com.example.livestreaming.controller;

import com.example.livestreaming.model.Lecture;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lectures")
public class LectureController {

    // 메모리 내 강의 관리 (데모용)
    private Map<String, Lecture> lectures = new ConcurrentHashMap<>();

    // 강사가 라이브 강의를 시작 (강의 생성)
    @PostMapping("/start")
    public Lecture startLecture(@RequestParam String teacher) {
        String id = UUID.randomUUID().toString();
        Lecture lecture = new Lecture(id, teacher);
        lectures.put(id, lecture);
        return lecture;
    }

    // 강사가 라이브 강의를 종료
    @PostMapping("/end/{id}")
    public Lecture endLecture(@PathVariable String id) {
        Lecture lecture = lectures.get(id);
        if (lecture != null) {
            lecture.setActive(false);
        }
        return lecture;
    }

    // 학생이 강의에 참여 (존재여부 및 활성 여부 확인)
    @PostMapping("/join/{id}")
    public Lecture joinLecture(@PathVariable String id) {
        Lecture lecture = lectures.get(id);
        if (lecture != null && lecture.isActive()) {
            return lecture;
        }
        throw new RuntimeException("Lecture not found or not active");
    }

    // 학생이 강의를 나갈 때 (데모용)
    @PostMapping("/leave/{id}")
    public String leaveLecture(@PathVariable String id) {
        return "Left lecture " + id;
    }

    // 메인 화면에 활성 강의 목록 제공
    @GetMapping("/active")
    public Collection<Lecture> getActiveLectures() {
        return lectures.values().stream().filter(Lecture::isActive).collect(Collectors.toList());
    }
}
