import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ShieldCheck, QrCode, Globe, Copy, Award, Zap, 
  Check, Loader2, Search, ShieldAlert, Fingerprint, 
  Activity, Server, Lock, Wifi, AlertTriangle
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import { generateAfribasId } from "../utils/afribasUtils"; 
import "./Afribas.css";

export default function Afribas() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [networkLoad, setNetworkLoad] = useState(64);

  useEffect(() => {
    fetchUserIdentity();

    // Visual effect: Mock network oscillation for terminal feel
    const interval = setInterval(() => {
      setNetworkLoad(Math.floor(Math.random() * (85 - 60 + 1) + 60));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserIdentity = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      let { data, error } = await supabase
        .from('profiles')
        .select('afribas_id, full_name, risk_index, is_quarantined')
        .eq('id', user.id)
        .single();

      if (data?.afribas_id) {
        setProfile(data);
      } else {
        // Generate new ID if user doesn't have one yet
        const newId = generateAfribasId("ZM"); 
        await supabase.from('profiles').update({ afribas_id: newId }).eq('id', user.id);
        setProfile({ ...data, afribas_id: newId });
      }
    } catch (err) {
      console.error("Identity Sync Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!profile?.afribas_id) return;
    navigator.clipboard.writeText(profile.afribas_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="afribas-page">
      <Topbar2 title="AFRIBAS Terminal" />

      <div className="afribas-container">
        {/* ENCRYPTED HEADER */}
        <div className="settlement-protocol-bar investigative">
          <div className="live-dot"></div>
          <span>AFRIBAS-200.000 CYBER-SECURITY PROTOCOL ACTIVE</span>
        </div>

        {/* SYSTEM METRICS */}
        <div className="network-status-panel">
          <div className="stat-item">
            <div className="stat-label"><Wifi size={12} /> NODE</div>
            <div className="stat-value text-green">ZM-PRIMARY</div>
          </div>
          <div className="stat-item">
            <div className="stat-label"><Activity size={12} /> SYSTEM LOAD</div>
            <div className="stat-value">{networkLoad}%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label"><Lock size={12} /> ENCRYPTION</div>
            <div className="stat-value">SHA-512</div>
          </div>
        </div>

        {/* THE AFRIBAS DIGITAL PASSPORT */}
        <div className={`id-card investigative-theme ${profile?.is_quarantined ? 'restricted-node' : ''}`}>
          {loading ? (
            <div className="card-loader">
              <Loader2 className="animate-spin" size={32} color="#f59e0b" />
              <p>Authenticating Node...</p>
            </div>
          ) : (
            <>
              <div className="card-top">
                <div className="logo-area">
                  <div className="circle-logo">A</div>
                  <span>AFRIBAS ID</span>
                </div>
                <div className="compliance-tag verified">
                   <Fingerprint color="#10b981" size={16} />
                   <span>{profile?.is_quarantined ? "RESTRICTED" : "VERIFIED"}</span>
                </div>
              </div>
              
              <div className="card-middle">
                <label>Institutional Language ID</label>
                <div className="id-number">{profile?.afribas_id}</div>
                <div className="owner-name">{profile?.full_name}</div>
              </div>

              <div className="card-bottom">
                <div className={`status-badge ${profile?.is_quarantined ? 'risk-high' : 'risk-low'}`}>
                   <div className={`dot ${profile?.is_quarantined ? 'red' : 'green'} pulse`}></div>
                   {profile?.is_quarantined ? "CRITICAL RISK" : "SECURE ENTITY"}
                </div>
                <div className="qr-box">
                  <QrCode size={44} color="white" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* USER UTILITIES */}
        <div className="protocol-info">
          <div className="section-title-row">
             <Search size={16} color="#f59e0b" />
             <h2>Identity Protocols</h2>
          </div>
          <p className="protocol-desc">
            Your AFRIBAS ID acts as your continental clearing key. Keep this ID private. 
            BIGE-50 monitors this node for risk signatures.
          </p>

          <div className="feature-grid">
            <div className="feature-item highlight">
              <div className="f-icon alert"><ShieldAlert size={18} /></div>
              <div className="f-text">
                <strong>Anti-Fraud Shield</strong>
                <span>Protects your settlements from illicit interception.</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="f-icon"><Server size={18} /></div>
              <div className="f-text">
                <strong>Global Gateway</strong>
                <span>Instant validation across 54 African institutional nodes.</span>
              </div>
            </div>
          </div>
        </div>

        {/* USER ACTIONS */}
        <div className="id-actions">
          <button className={`id-btn ${copied ? "copied" : ""}`} onClick={handleCopy} disabled={loading}>
            {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
            <span>{copied ? "ID Copied" : "Copy Secure ID"}</span>
          </button>
          
          <button className="id-btn secondary" onClick={() => navigate("/security-report")}>
             <Search size={18} /> <span>Risk Assessment</span>
          </button>
        </div>

        <div className="institutional-footer">
          <p>AUTHORIZED BY BIGE-50 CONTINENTAL INVESTIGATIVE BOARD</p>
        </div>
      </div>
    </div>
  );
}