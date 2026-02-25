import React from 'react';
import { t } from '../utils/translation';
import { Container } from 'react-bootstrap';


const AdminDashboard = () => (
  <Container className="py-4">
    <h1 className="h3 fw-bold mb-4">{t('admin.title') || 'Admin Dashboard'}</h1>
    <p>This is the admin dashboard. Functionality coming soon.</p>
  </Container>
);

export default AdminDashboard;
