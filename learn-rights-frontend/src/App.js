import React from "react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./contexts/UserContext";
import OfflineBanner from "./components/OfflineBanner";
import { GlowCursor } from "./components/AnimatedElements";
import ParticleBackground from "./components/ParticleBackground";
import "./styles/main.css";

// Set your Google OAuth Client ID here or in .env as REACT_APP_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <UserProvider>
            <ParticleBackground particleCount={35} color="#7c3aed" connectDistance={100} />
            <GlowCursor />
            <AppRoutes />
            <OfflineBanner />
        </UserProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
