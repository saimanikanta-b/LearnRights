import React from "react";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container text-center small">
        <p className="mb-0">© {new Date().getFullYear()} LearnRights | Empowering Rural Women</p>
      </div>
    </footer>
  );
};

export default Footer;
