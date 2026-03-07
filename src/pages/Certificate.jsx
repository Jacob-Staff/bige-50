import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ShieldCheck, Award, ChevronLeft, Download, Printer } from "lucide-react";
import "./certificate.css";

export default function Certificate() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [date] = useState(new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  }));

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, afribas_id')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handlePrint = () => window.print();

  return (
    <div className="cert-page">
      <div className="cert-actions no-print">
        <button onClick={() => navigate(-1)} className="back-link">
          <ChevronLeft size={20} /> Back
        </button>
        <div className="right-actions">
          <button onClick={handlePrint} className="action-btn">
            <Printer size={18} />
          </button>
          <button onClick={handlePrint} className="action-btn">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="cert-wrapper" id="certificate">
        <div className="cert-border">
          <div className="cert-content">
            <div className="cert-header">
              <ShieldCheck size={60} color="#af641e" strokeWidth={1} />
              <h1>CERTIFICATE OF INSTITUTIONAL CLEARANCE</h1>
              <p className="protocol-ref">AFRIBAS-200.000 / WESWAC-STANDARD</p>
            </div>

            <div className="cert-body">
              <p className="cert-intro">This is to certify that the entity identified as</p>
              <h2 className="user-name">{profile?.full_name || "VALUED MEMBER"}</h2>
              <p className="cert-text">
                Has successfully integrated into the <strong>B.I.G.E-50 Continental Bridge</strong> 
                and is hereby authorized to conduct high-speed algorithmic settlements under 
                the AFRIBAS Action Language protocol.
              </p>
            </div>

            <div className="cert-details">
              <div className="detail-item">
                <label>Institutional ID</label>
                <span>{profile?.afribas_id || "PENDING-VERIFICATION"}</span>
              </div>
              <div className="detail-item">
                <label>Issue Date</label>
                <span>{date}</span>
              </div>
            </div>

            <div className="cert-footer">
              <div className="signature-box">
                <div className="sig-line"></div>
                <span>Protocol Director</span>
              </div>
              <div className="gold-seal">
                <Award size={80} color="#e2b443" strokeWidth={1} />
              </div>
              <div className="signature-box">
                <div className="sig-line"></div>
                <span>Weswac Board</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="legal-disclaimer no-print">
        This document is an electronic representation of institutional standing. 
        Verification can be performed via the B.I.G.E-50 Blockchain Explorer.
      </p>
    </div>
  );
}