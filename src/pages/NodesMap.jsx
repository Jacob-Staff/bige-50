import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Radio, Zap, ShieldCheck, Activity } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./NodesMap.css";

const REGIONAL_NODES = [
  { id: 1, country: "Zambia", city: "Lusaka", status: "Active", latency: "24ms", load: "12%" },
  { id: 2, country: "South Africa", city: "Johannesburg", status: "Active", latency: "48ms", load: "45%" },
  { id: 3, country: "Nigeria", city: "Lagos", status: "Active", latency: "82ms", load: "67%" },
  { id: 4, country: "Kenya", city: "Nairobi", status: "Active", latency: "35ms", load: "22%" },
  { id: 5, country: "Egypt", city: "Cairo", status: "Maintenance", latency: "--", load: "0%" },
  { id: 6, country: "Ghana", city: "Accra", status: "Active", latency: "91ms", load: "18%" },
];

export default function NodesMap() {
  const [pulse, setPulse] = useState(true);

  // Simulate live data pulsing
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nodes-page">
      <Topbar2 title="Network Infrastructure" />

      <div className="nodes-container">
        <div className="map-viz">
          <div className="radar-circle"></div>
          <Globe size={120} className="globe-icon" color="#1e293b" strokeWidth={1} />
          <div className="node-ping p1"></div>
          <div className="node-ping p2"></div>
          <div className="node-ping p3"></div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <Activity size={16} color="#10b981" />
            <label>Global Uptime</label>
            <strong>99.98%</strong>
          </div>
          <div className="stat-card">
            <Zap size={16} color="#e2b443" />
            <label>Active Nodes</label>
            <strong>53 / 54</strong>
          </div>
        </div>

        <h3 className="section-label">Regional Liquidity Hubs</h3>
        
        <div className="nodes-list">
          {REGIONAL_NODES.map((node) => (
            <div key={node.id} className={`node-item ${node.status.toLowerCase()}`}>
              <div className="node-info">
                <Radio size={18} className={node.status === "Active" ? "ping-icon" : ""} />
                <div>
                  <strong>{node.country}</strong>
                  <span>{node.city} Terminal</span>
                </div>
              </div>
              <div className="node-data">
                <span className="latency">{node.latency}</span>
                <div className={`status-dot ${node.status.toLowerCase()}`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="security-footer">
          <ShieldCheck size={14} />
          <span>Encrypted P2P Node Routing Active</span>
        </div>
      </div>
    </div>
  );
}