import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import Features from "../components/features";
import HowItWorks from "../components/howitworks";
import TryAushadhiAI from "../components/tryaushidhiai";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./styles.css";
const Home = () => {
  return (
    <div>
      <Header />
      <Sidebar />
      <Features />
      <HowItWorks />
      <TryAushadhiAI />
    </div>
  );
};

export default Home;
