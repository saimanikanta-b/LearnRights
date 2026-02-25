import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatbotWidget from "../components/ChatbotWidget";

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #1a1744 50%, #24243e 100%)' }}>
      <Navbar />
      <main className="flex-grow-1 overflow-x-hidden" style={{ paddingBottom: "2rem", minWidth: 0 }}>{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default MainLayout;
