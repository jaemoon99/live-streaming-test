// MainPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const [lectures, setLectures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/lectures/active")
      .then((response) => response.json())
      .then((data) => setLectures(data))
      .catch((err) => console.error("Error fetching lectures", err));
  }, []);

  const handleStartLecture = () => {
    navigate("/teacher");
  };

  const handleJoinLecture = (lecture) => {
    navigate(`/student/${lecture.id}/${lecture.teacher}`);
  };

  return (
    <div>
      <h1>Main Page</h1>
      <button onClick={handleStartLecture}>Start New Lecture (Teacher)</button>
      <h2>Active Lectures</h2>
      {lectures.length === 0 ? (
        <p>No active lectures.</p>
      ) : (
        <ul>
          {lectures.map((lecture) => (
            <li key={lecture.id}>
              <strong>{lecture.teacher}</strong> - Session ID: {lecture.id}
              <button onClick={() => handleJoinLecture(lecture)}>Join Lecture</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MainPage;
