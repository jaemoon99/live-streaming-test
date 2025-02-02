package com.example.livestreaming.model;

public class Lecture {
    private String id;
    private String teacher;
    private boolean active;

    public Lecture(String id, String teacher) {
        this.id = id;
        this.teacher = teacher;
        this.active = true;
    }

    // Getter & Setter
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getTeacher() {
        return teacher;
    }
    public void setTeacher(String teacher) {
        this.teacher = teacher;
    }
    public boolean isActive() {
        return active;
    }
    public void setActive(boolean active) {
        this.active = active;
    }
}
