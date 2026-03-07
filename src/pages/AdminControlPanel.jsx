import React, { useState, useEffect } from "react";
import { 
  Settings, Save, Edit3, Trash2, ArrowLeft 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./Admin-control.css";

export default function AdminManagement() {
  const navigate = useNavigate();
  const { id } = useParams(); // Catches the ID from the URL (e.g., AF-992)
  
  // Current state of the report being edited
  const [reportData, setReportData] = useState({
    id: id || "PENDING-ID",
    riskIndex: "02",
    status: "SECURE SETTLEMENT",
    chaosBacking: "0%",
    amlCompliance: "100%",
    clearance: "Level 4 - Institutional"
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    // In a real app, you would fetch data from Supabase here:
    // supabase.from('reports').select('*').eq('id', id)...
  }, [id]);

  const handleSave = () => {
    // Logic to push to Supabase would go here
    alert(`CRITICAL: Dossier ${reportData.id} updated in Sentinel Network.`);
    navigate("/afribas"); // Back to the Dashboard list
  };

  return (
    <div className="report-page-master">
      <div className="terminal-column management-theme">
        
        {/* MANAGEMENT HEADER */}
        <header className="mgmt-nav">
          <div className="mgmt-left">
            <button onClick={() => navigate("/afribas")} className="mgmt-back">
              <ArrowLeft size={16} />
            </button>
            <div className="mgmt-title">
              <Settings size={18} className="spin-slow" />
              <span>DATA MANAGEMENT</span>
            </div>
          </div>
          <button className="save-btn" onClick={handleSave}>
            <Save size={14} /> DEPLOY
          </button>
        </header>

        <main className="report-container">
          <div className="editor-intro">
             <h2>Dossier Editor: <span className="highlight-id">{reportData.id}</span></h2>
             <p>Authorized access only. Modifying records requires Level 5 clearance.</p>
          </div>

          {/* RISK CONFIGURATION */}
          <section className="mgmt-section">
            <label className="section-label">RISK ARCHITECTURE</label>
            <div className="input-group">
              <label>Risk Index (0-99)</label>
              <input 
                type="text" 
                value={reportData.riskIndex}
                onChange={(e) => setReportData({...reportData, riskIndex: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Status Headline</label>
              <input 
                type="text" 
                value={reportData.status}
                onChange={(e) => setReportData({...reportData, status: e.target.value})}
              />
            </div>
          </section>

          {/* COMPLIANCE DATA */}
          <section className="mgmt-section">
            <label className="section-label">METRIC OVERRIDES</label>
            <div className="grid-inputs">
              <div className="input-group">
                <label>Chaos Backing</label>
                <input 
                  type="text" 
                  value={reportData.chaosBacking}
                  onChange={(e) => setReportData({...reportData, chaosBacking: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>AML Score</label>
                <input 
                  type="text" 
                  value={reportData.amlCompliance}
                  onChange={(e) => setReportData({...reportData, amlCompliance: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* TIMELINE GENERATOR */}
          <section className="mgmt-section">
            <label className="section-label">ACTION LOG INJECTOR</label>
            <div className="log-editor-box">
               <div className="log-line-item">
                  <Edit3 size={12} />
                  <span>[0.00ms] Protocol Handshake...</span>
               </div>
               <div className="log-line-item">
                  <Edit3 size={12} />
                  <span>[12.4ms] Scan: CLEAN</span>
               </div>
               <button className="add-log-btn" type="button">+ APPEND NEW LOG ENTRY</button>
            </div>
          </section>

          {/* DANGER ZONE */}
          <div className="danger-zone">
             <button className="delete-report" type="button">
               <Trash2 size={14} /> PURGE DOSSIER FROM NETWORK
             </button>
          </div>
        </main>
      </div>
    </div>
  );
}