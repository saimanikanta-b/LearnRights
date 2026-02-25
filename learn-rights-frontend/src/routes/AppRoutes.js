import React from "react";
import { Routes, Route } from "react-router-dom";
import Welcome from "../pages/Welcome";
import Home from "../pages/Home";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Profile from "../pages/Profile";
import Modules from "../pages/Modules";
import Quiz from "../pages/Quiz";
import Chatbot from "../pages/Chatbot";
import Leaderboard from "../pages/Leaderboard";
import Achievements from "../pages/Achievements";
import AdminDashboard from "../pages/AdminDashboard";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";
import HomeRoute from "../components/HomeRoute";
import MainLayout from "../layouts/MainLayout";

const WithLayout = ({ children }) => <MainLayout>{children}</MainLayout>;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/home" element={<HomeRoute><WithLayout><Home /></WithLayout></HomeRoute>} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<PrivateRoute><WithLayout><Dashboard /></WithLayout></PrivateRoute>} />
    <Route path="/profile" element={<PrivateRoute><WithLayout><Profile /></WithLayout></PrivateRoute>} />
    <Route path="/users" element={<AdminRoute><WithLayout><Users /></WithLayout></AdminRoute>} />
    <Route path="/modules" element={<PrivateRoute><WithLayout><Modules /></WithLayout></PrivateRoute>} />
    <Route path="/quiz" element={<PrivateRoute><WithLayout><Quiz /></WithLayout></PrivateRoute>} />
    <Route path="/chatbot" element={<PrivateRoute><WithLayout><Chatbot /></WithLayout></PrivateRoute>} />
    <Route path="/leaderboard" element={<PrivateRoute><WithLayout><Leaderboard /></WithLayout></PrivateRoute>} />
    <Route path="/achievements" element={<PrivateRoute><WithLayout><Achievements /></WithLayout></PrivateRoute>} />
    <Route path="/admin" element={<AdminRoute><WithLayout><AdminDashboard /></WithLayout></AdminRoute>} />
  </Routes>
);

export default AppRoutes;
