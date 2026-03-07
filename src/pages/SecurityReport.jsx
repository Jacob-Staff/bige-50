import React, { useState, useEffect } from "react";
import { 
  Zap, ArrowLeft, FileText, Globe, 
  Fingerprint, Download, ShieldCheck, ShieldAlert 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./Security-report.css";

export default function SecurityReport() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.backgroundColor = "#000000";

    const fetchSecurityData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, risk_index, is_quarantined, afribas_id')
            .eq('id', user.id)
            .single();
          setProfile(data);
        }
      } catch (err) {
        console.error("Dossier access denied");
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();

    return () => {
      document.body.style.backgroundColor = ""; 
    };
  }, []);

  const isRestricted = profile?.is_quarantined;
  const statusColor = isRestricted ? "#ef4444" : "#f59e0b";

  if (loading) return <div className="loading-overlay">DECRYPTING SECURITY DOSSIER...</div>;

  return (
    <div className="report-page-master">
      <div className="terminal-column">
        
        {/* TOP NAVIGATION */}
        <nav className="report-nav">
          <button onClick={() => navigate(-1)} className="back-link">
            <ArrowLeft size={18} /> <span>TERMINAL</span>
          </button>
          <div className="report-clearance">
             <div className={`live-dot ${isRestricted ? 'red' : 'pulse'}`}></div>
             {isRestricted ? "NODE RESTRICTED" : "LEVEL 4 CLEARANCE"}
          </div>
        </nav>

        {/* CONTENT AREA */}
        <main className="report-container">
          <header className="investigative-header">
            <div className="pulse-icon-container">
              <Fingerprint size={48} color={statusColor} />
              <div className={`icon-pulse ${isRestricted ? 'danger' : ''}`}></div>
            </div>
            <h1>Institutional Security Report</h1>
            <p className="dossier-id">REF: {profile?.afribas_id || "AF-000-PENDING"}</p>
          </header>

          {/* COMPLIANCE STATUS CARD */}
          <section className={`risk-score-card ${isRestricted ? 'card-danger' : ''}`}>
            <div className="score-main">
              <div className="score-circle" style={{ borderColor: statusColor }}>
                <span className="score-num" style={{ color: statusColor }}>
                    {isRestricted ? "!!" : "00"}
                </span>
                <span className="score-label">INCIDENTS</span>
              </div>
              <div className="score-text">
                <h3>{isRestricted ? "NODE LIMITATION ACTIVE" : "INTEGRITY VERIFIED"}</h3>
                <p>{isRestricted ? "Your node is currently under institutional review." : "Your account meets all continental settlement standards."}</p>
              </div>
            </div>
            <div className="risk-metrics">
               <div className="metric">
                  <span>Settlement Standing</span> 
                  <strong className={isRestricted ? "danger" : "safe"}>{isRestricted ? "REVIEW" : "OPTIMAL"}</strong>
               </div>
               <div className="metric">
                  <span>Node Reputation</span> 
                  <strong className={isRestricted ? "danger" : "safe"}>{isRestricted ? "LOW" : "HIGH"}</strong>
               </div>
               <div className="metric">
                  <span>Institutional AML</span> 
                  <strong className="verified">PASSED</strong>
               </div>
            </div>
          </section>

          {/* NODE INTEGRITY VIZ */}
          <section className="node-section">
             <div className="section-head">
                <Globe size={14} color="#94a3b8" /> <h2>NETWORK TOPOLOGY</h2>
             </div>
             <div className="node-viz">
                <div className="node-line"></div>
                <div className="node-point active"><span>LOCAL NODE</span></div>
                <div className={`node-point ${isRestricted ? 'blocked' : 'target'}`}><span>BIGE-50 HUB</span></div>
                <div className={`scanning-bar ${isRestricted ? 'danger' : ''}`}></div>
             </div>
          </section>

          {/* DATA DOSSIER */}
          <section className="data-dossier">
            <div className="section-head">
               <FileText size={14} color="#94a3b8" /> <h2>CLEARANCE DETAILS</h2>
            </div>
            <div className="data-grid">
              <div className="data-item">
                <label>Institutional KYC</label>
                <p>Status: Completed</p>
              </div>
              <div className="data-item">
                <label>Cyber-Shield</label>
                <p>{isRestricted ? "Suspended" : "Active & Protecting"}</p>
              </div>
              <div className="data-item">
                <label>Identity Hash</label>
                <p>Verified (AFRIBAS-V5)</p>
              </div>
              <div className="data-item">
                <label>Settlement Access</label>
                <p>{isRestricted ? "Restricted" : "Unrestricted"}</p>
              </div>
            </div>
          </section>

          {/* SENTINEL LOG */}
          <section className="security-timeline">
            <div className="section-head">
              <Zap size={14} color={statusColor} /> <h2>SYSTEM LOGS</h2>
            </div>
            <div className="timeline-box">
              {[
                { time: "0.01ms", title: "Gateway Handshake", desc: "Institutional connection secure." },
                { time: "14.2ms", title: "Identity Validation", desc: `Credentials confirmed for ${profile?.full_name?.toUpperCase()}.` },
                { time: "42.5ms", title: "Integrity Scan", desc: isRestricted ? "Safety protocol triggered: Please contact admin." : "No anomalies detected in settlement history." },
                { time: "98.9ms", title: "Dossier Finalized", desc: "Report generated and encrypted." }
              ].map((item, idx) => (
                <div key={idx} className={`timeline-item ${idx === 1 && !isRestricted ? 'highlight' : ''}`}>
                  <div className="time">{item.time}</div>
                  <div className="log-content">
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER ACTIONS */}
          <footer className="report-footer">
            <button className="download-btn" onClick={() => window.print()}>
              <Download size={18} /> EXPORT CLEARANCE PDF
            </button>
            <p className="auth-stamp">BIGE-50 CONTINENTAL INVESTIGATIVE BOARD // ZAMBIA SECURE NODE</p>
          </footer>
        </main>
      </div>
    </div>
  );
}