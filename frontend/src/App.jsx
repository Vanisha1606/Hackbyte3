import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Timetable from "./pages/timetable";
import AppointmentForm from "./pages/AppointmentForm";
import ProfilePage from "./pages/profilepage";
import UploadPrescription from "./pages/uploadprescription";
import EditProfile from "./pages/editprofile";
import ShowPrescriptions from "./pages/showprescriptions";
import Login from "./pages/Login";
import Signup from "./pages/signup";
import ChatBox from "./pages/ChatBox";
import AboutUs from "./pages/About_Us";
import AdminInventory from "./pages/AdminInventory";
import Shop from "./pages/shop";
import Cart from "./pages/Cart";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/appointment" element={<AppointmentForm />} />
      <Route path="/profilepage" element={<ProfilePage />} />
      <Route path="/uploadprescription" element={<UploadPrescription />} />
      <Route path="/editprofile" element={<EditProfile />} />
      <Route path="/showprescriptions" element={<ShowPrescriptions />} />
      <Route path="/chatbot" element={<ChatBox />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/admin_inventory" element={<AdminInventory />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/cart" element={<Cart />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
