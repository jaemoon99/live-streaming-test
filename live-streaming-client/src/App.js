// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import TeacherSession from "./TeacherSession";
import StudentSession from "./StudentSession";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/teacher" element={<TeacherSession />} />
        <Route path="/student/:sessionId/:teacherName" element={<StudentSession />} />
      </Routes>
    </Router>
  );
}

export default App;