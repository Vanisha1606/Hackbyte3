import React, { useState } from "react";
import { Link } from "react-router-dom";
import { List } from "lucide-react";
import "./sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isOpen ? "⏪" : "⏩"}
      </button>
      <ul className="menu-list">
        <li>
          <Link to="/timetable">
            <List /> {isOpen && "Timetable"}
          </Link>
        </li>
        <li>
          <Link to="/feedbackform">
            <List /> {isOpen && "Feedback"}
          </Link>
        </li>
        <li>
          <Link to="/signup">
            <List /> {isOpen && "Sign Up"}
          </Link>
        </li>
        <li>
          <Link to="/login">
            <List /> {isOpen && "Login"}
          </Link>
        </li>
        <li>
          <Link to="/appointment">
            <List /> {isOpen && "Appointment"}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;