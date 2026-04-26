import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useToast } from "../components/Toast";
import "./appointmentform.css";

const AppointmentForm = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    department: "General",
    reason: "",
    patientType: "new",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Appointment request submitted!");
    setFormData({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      department: "General",
      reason: "",
      patientType: "new",
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book an appointment</h1>
          <p className="page-subtitle">
            Pick your slot and we'll confirm with the doctor.
          </p>
        </div>
      </div>

      <form className="card appointment-card" onSubmit={handleSubmit}>
        <div className="grid-2-cols">
          <div className="field">
            <label className="label">Name</label>
            <input
              className="input"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid-2-cols">
          <div className="field">
            <label className="label">Phone</label>
            <input
              className="input"
              type="tel"
              name="phone"
              placeholder="10-digit number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label className="label">Department</label>
            <select
              className="select"
              name="department"
              value={formData.department}
              onChange={handleChange}
            >
              <option>General</option>
              <option>Cardiology</option>
              <option>Dermatology</option>
              <option>Pediatrics</option>
              <option>Neurology</option>
            </select>
          </div>
        </div>

        <div className="grid-2-cols">
          <div className="field">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label className="label">Time</label>
            <input
              className="input"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Reason for visit</label>
          <textarea
            className="textarea"
            name="reason"
            placeholder="Briefly describe symptoms or purpose"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg">
          <CalendarPlus size={16} /> Submit appointment
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
