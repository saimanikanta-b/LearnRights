import { NavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";
import { t } from '../utils/translation';

const Sidebar = () => {
  return (
    <aside className="p-3 border-end bg-light" style={{ minWidth: 200 }}>
      <h2 className="h6 fw-bold mb-3">LR</h2>
      <Nav className="flex-column">
        <Nav.Link as={NavLink} to="/dashboard" className="rounded">{t('dashboard')}</Nav.Link>
        <Nav.Link as={NavLink} to="/modules" className="rounded">{t('modules')}</Nav.Link>
        <Nav.Link as={NavLink} to="/quiz" className="rounded">{t('quiz')}</Nav.Link>
        <Nav.Link as={NavLink} to="/achievements" className="rounded">{t('achievements')}</Nav.Link>
        <Nav.Link as={NavLink} to="/leaderboard" className="rounded">{t('leaderboard')}</Nav.Link>
        <Nav.Link as={NavLink} to="/profile" className="rounded">{t('profile')}</Nav.Link>
        <Nav.Link as={NavLink} to="/chatbot" className="rounded">{t('chatbot')}</Nav.Link>
      </Nav>
    </aside>
  );
};

export default Sidebar;
