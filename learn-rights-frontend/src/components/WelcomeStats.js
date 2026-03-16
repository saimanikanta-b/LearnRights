import React, { useEffect, useState } from "react";
import { AnimatedCounter } from "./AnimatedElements";
import API from "../api/axios";

const WelcomeStats = () => {
  const [stats, setStats] = useState({ users: 0, modules: 0, languages: 0 });
  useEffect(() => {
    API.get("/admin/public-stats")
      .then(res => {
        const data = res.data;
        setStats({
          users: data.totalUsers || 0,
          modules: data.totalModules || 0,
          languages: data.totalLanguages || 0
        });
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="wlc-stat-item">
        <span className="wlc-stat-number"><AnimatedCounter end={stats.users} duration={1500} /></span>
        <span className="wlc-stat-label">Users</span>
      </div>
      <div className="wlc-stat-item">
        <span className="wlc-stat-number"><AnimatedCounter end={stats.modules} duration={1200} /></span>
        <span className="wlc-stat-label">Modules</span>
      </div>
      <div className="wlc-stat-item">
        <span className="wlc-stat-number"><AnimatedCounter end={stats.languages} duration={1300} /></span>
        <span className="wlc-stat-label">Languages</span>
      </div>
    </>
  );
};

export default WelcomeStats;