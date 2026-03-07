import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ShieldCheck, QrCode, Copy, Check, Loader2,
  Search, Activity, CheckCircle2,
  Lock, Cpu, Scan
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import { generateAfribasId } from "../utils/afribasUtils"; 
import "./Afribas.css"; // We can keep the CSS filename or rename to bige50.css later

export default function Bige50User() {
  const navigate = useNavigate();
  const [institutionalId, setInstitutionalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Bige-50 Protocol Verification Steps
  const [verifyStep, setVerifyStep] = useState(2); 
  const steps = ["Auth", "Biometrics", "Node Binding", "Protocol Clearance"];

  useEffect(() => {
    const fetchUserIdentity = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        let { data } = await supabase.from('profiles').select('afribas_id').eq('id', user.id).single();

        if (data?.afribas_id) {
          setInstitutionalId(data.afribas_id);
          setVerifyStep(4); 
        } else {
          const newId = generateAfribasId("ZM"); 
          await supabase.from('profiles').update({ afribas_id: newId }).eq('id', user.id);
          setInstitutionalId(newId);
          setVerifyStep(3);
        }
      } catch (err) {
        setInstitutionalId("UNVERIFIED-NODE");
      } finally {
        setLoading(false);
      }
    };
    fetchUserIdentity();
  }, [navigate]);

  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="afribas-page">
      <Topbar2 title="Bige-50 Digital Passport" />

      <div className="afribas-container">
        {/* 1. PROTOCOL CLEARANCE TRACKER */}
        <div className="verification-tracker">
          <div className="tracker-header">
            <span>PROTOCOL CLEARANCE</span>
            <span className="percent">{Math.round((verifyStep/4) * 100)}%</span>
          </div>
          <div className="progress-segments">
            {steps.map((step, index) => (
              <div key={index} className={`segment ${index < verifyStep ? "active" : ""}`}>
                <div className="segment-bar"></div>
                <span className="segment-label">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. BIGE-50 PASSPORT CARD */}
        <div className={`id-card user-theme ${isScanning ? "scanning" : ""}`} onClick={triggerScan}>
          {isScanning && <div className="scan-line"></div>}
          
          {loading ? (
            <div className="card-loader">
              <Loader2 className="animate-spin" size={32} color="#f59e0b" />
            </div>
          ) : (
            <>
              <div className="card-top">
                <div className="logo-area">
                  <div className="circle-logo" style={{ background: '#f59e0b', color: '#000' }}>B</div>
                  <span>BIGE-50</span>
                </div>
                <div className={`trust-level ${verifyStep === 4 ? "diamond" : ""}`}>
                   <CheckCircle2 color="#10b981" size={14} />
                   <span>VERIFIED OPERATIVE</span>
                </div>
              </div>
              
              <div className="card-middle">
                <label>{isScanning ? "SYNCHRONIZING WITH SENTINEL..." : "Bige-50 Global ID"}</label>
                <div className="id-number" style={{ letterSpacing: '2px' }}>{institutionalId}</div>
              </div>

              <div className="card-bottom">
                <div className="user-node-info">
                   <div className="node-tag">OPERATIVE NODE: ZAMBIA-ZM</div>
                   <div className="expiry">PROTOCOL STATUS: {isScanning ? "VALIDATING" : "ACTIVE"}</div>
                </div>
                <div className="qr-box">
                  {isScanning ? <Scan className="animate-pulse" size={44} color="#f59e0b" /> : <QrCode size={44} color="white" />}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. DYNAMIC SECURITY FEED */}
        <div className="security-feed-box">
           <div className="feed-header">
              <Activity size={14} color="#f59e0b" /> <h3>Sentinel Shield Analytics</h3>
           </div>
           <div className="feed-content">
              <div className="feed-item">
                 <Lock size={12} /> <span>Security Layer: <strong>ENCRYPTED</strong></span>
              </div>
              <div className="feed-item">
                 <Cpu size={12} /> <span>Bige-50 Node Integrity: <strong>VERIFIED</strong></span>
              </div>
           </div>
        </div>

        {/* 4. ACTION BUTTONS */}
        <div className="id-actions">
          <button className="id-btn primary" onClick={() => navigate("/security-report")}>
             <ShieldCheck size={18} /> <span>View Dossier</span>
          </button>
          
          <button className="id-btn secondary" onClick={() => {
            navigator.clipboard.writeText(institutionalId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}>
             {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
             <span>{copied ? "Copied" : "Copy ID"}</span>
          </button>
        </div>

        <div className="institutional-footer">
          <p>OFFICIAL BIGE-50 OPERATIVE PASSPORT</p>
          <p style={{ fontSize: '7px', marginTop: '4px', opacity: 0.5 }}>NON-TRANSFERABLE • ENCRYPTED DATA NODE</p>
        </div>
      </div>
    </div>
  );
}