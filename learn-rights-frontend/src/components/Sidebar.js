import { NavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";

const Sidebar = () => {
  return (
    <aside className="p-3 border-end bg-light" style={{ minWidth: 200 }}>
      <h2 className="h6 fw-bold mb-3">LearnRights</h2>
      <Nav className="flex-column">
        <Nav.Link as={NavLink} to="/dashboard" className="rounded">Dashboard</Nav.Link>
        <Nav.Link as={NavLink} to="/modules" className="rounded">Modules</Nav.Link>
        <Nav.Link as={NavLink} to="/quiz" className="rounded">Quiz</Nav.Link>
        <Nav.Link as={NavLink} to="/achievements" className="rounded">Achievements</Nav.Link>
        <Nav.Link as={NavLink} to="/leaderboard" className="rounded">Leaderboard</Nav.Link>
        <Nav.Link as={NavLink} to="/profile" className="rounded">Profile</Nav.Link>
        <Nav.Link as={NavLink} to="/chatbot" className="rounded">Chatbot</Nav.Link>
      </Nav>
    </aside>
  );
};

export default Sidebar;
