import React, { useState, useEffect } from "react";
import API from "../api/axios";
import { t } from '../utils/translation';
import { Container, Card, Form, Button, Spinner, Alert, InputGroup, Row, Col } from "react-bootstrap";

function Users() {
  // ...existing code...
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users");
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t("users.fetchError", { defaultValue: "Failed to fetch users" }));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy]?.toLowerCase() || "";
      const bValue = b[sortBy]?.toLowerCase() || "";
      if (sortOrder === "asc") return aValue.localeCompare(bValue);
      return bValue.localeCompare(aValue);
    });

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">{t("users.loading", { defaultValue: "Loading users..." })}</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <span className="fs-2">👥</span>
            <div>
              <h1 className="h4 fw-bold mb-0">{t("users.title", { defaultValue: "User Management" })}</h1>
              <p className="text-muted small mb-0">{t("users.subtitle", { defaultValue: "View and manage all platform users" })}</p>
            </div>
          </div>
          <Card className="border-0 bg-light">
            <Card.Body className="py-2 px-3">
              <span className="fw-bold">{users.length}</span>{" "}
              <span className="text-muted">{t("users.totalUsers", { defaultValue: "Total Users" })}</span>
            </Card.Body>
          </Card>
        </div>

        <Card className="border-0 shadow-sm mb-3">
          <Card.Body>
            <Row className="g-2 align-items-center flex-wrap">
              <Col md>
                <InputGroup>
                  <InputGroup.Text>🔍</InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder={t("users.searchPlaceholder", { defaultValue: "Search users by name or email..." })}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md="auto">
                <span className="text-muted me-2">{t("users.sortBy", { defaultValue: "Sort by:" })}</span>
                <Button variant={sortBy === "name" ? "primary" : "outline-primary"} size="sm" className="me-1 rounded-pill" onClick={() => handleSort("name")}>
                  {t("users.name", { defaultValue: "Name" })} {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
                <Button variant={sortBy === "email" ? "primary" : "outline-primary"} size="sm" className="rounded-pill" onClick={() => handleSort("email")}>
                  {t("users.email", { defaultValue: "Email" })} {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {error && (
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <span>⚠️</span> {error}
          </Alert>
        )}

        {filteredUsers.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5">
            <Card.Body>
              <span className="display-4">👤</span>
              <h3 className="h5 mt-2">{t("users.noUsers", { defaultValue: "No users found" })}</h3>
              <p className="text-muted mb-0">
                {searchTerm
                  ? t("users.noSearchResults", { defaultValue: "Try adjusting your search criteria" })
                  : t("users.noUsersText", { defaultValue: "No users have registered yet" })}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3">
            {filteredUsers.map((user) => (
              <Col key={user._id} md={6} lg={4}>
                <Card className="border-0 shadow-sm h-100 rounded-4">
                  <Card.Body className="d-flex gap-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 fw-bold" style={{ width: 48, height: 48 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <Card.Title className="h6 mb-1">{user.name}</Card.Title>
                      <Card.Text className="small text-muted mb-1">{user.email}</Card.Text>
                      <div className="small text-muted">
                        🌍 {user.preferredLanguage || "en"} · ⭐ {user.points || 0} {t("users.points", { defaultValue: "points" })}
                      </div>
                      <div className="small text-muted">
                        {t("users.joined", { defaultValue: "Joined" })} {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <p className="small text-muted text-center mt-4">
          {t("users.footer", { defaultValue: "Showing {count} of {total} users", count: filteredUsers.length, total: users.length })}
        </p>
      </Container>
  );
}

export default Users;
