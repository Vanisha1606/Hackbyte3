import { useNavigate } from "react-router-dom";
import { Stethoscope, CalendarPlus } from "lucide-react";
import "./timetable.css";

const doctors = [
  {
    name: "Dr. Aanya Sharma",
    specialty: "Cardiologist",
    day: "Monday & Thursday",
    time: "10:00 AM – 2:00 PM",
    rating: 4.9,
  },
  {
    name: "Dr. Rohan Kapoor",
    specialty: "Dermatologist",
    day: "Wednesday",
    time: "12:00 PM – 4:00 PM",
    rating: 4.8,
  },
  {
    name: "Dr. Meera Iyer",
    specialty: "Pediatrician",
    day: "Tuesday & Friday",
    time: "9:00 AM – 1:00 PM",
    rating: 4.95,
  },
  {
    name: "Dr. Arjun Mehta",
    specialty: "General Physician",
    day: "Mon – Sat",
    time: "5:00 PM – 9:00 PM",
    rating: 4.7,
  },
];

const Timetable = () => {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors' timetable</h1>
          <p className="page-subtitle">
            Browse availability and book in seconds.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/appointment")}
        >
          <CalendarPlus size={16} /> New appointment
        </button>
      </div>

      <div className="timetable-grid">
        {doctors.map((d, i) => (
          <div className="card card-hover doctor-card" key={i}>
            <div className="doctor-icon">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3>{d.name}</h3>
              <span className="badge">{d.specialty}</span>
              <ul className="doctor-meta">
                <li>
                  <strong>Day</strong>
                  <span>{d.day}</span>
                </li>
                <li>
                  <strong>Time</strong>
                  <span>{d.time}</span>
                </li>
                <li>
                  <strong>Rating</strong>
                  <span>★ {d.rating}</span>
                </li>
              </ul>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => navigate("/appointment")}
              >
                Book appointment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
