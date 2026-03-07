import { useNavigate } from "react-router-dom";
import { Lock, Fingerprint, Globe, Shield, ShieldCheck } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./privacy.css"; // 👈 Import your new CSS

export default function Privacy() {
  const navigate = useNavigate();

  const pillars = [
    {
      title: "Bank-Grade Encryption",
      desc: "AES-256 military-grade encryption for all wallet data.",
      icon: <Lock className="text-blue-600" size={20} />,
      tag: "Secure"
    },
    {
      title: "Data Sovereignty",
      desc: "Your data is stored locally and never shared with 3rd parties.",
      icon: <Globe className="text-cyan-600" size={20} />,
      tag: "Compliant"
    },
    {
      title: "Biometric Sign-off",
      desc: "Multi-factor authentication required for all large transfers.",
      icon: <Fingerprint className="text-purple-600" size={20} />,
      tag: "Enabled"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      <Topbar2 title="Security Center" onBack={() => navigate("/manage")} />
      
      <div className="max-w-md mx-auto privacy-container">
        
        {/* Blue Hero Card */}
        <div className="privacy-hero">
          <div className="hero-icon-box">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold">Privacy First</h2>
          <p className="opacity-80 text-sm mt-1">Your assets are protected by BIGE-50 Shield</p>
        </div>

        {/* Protection List */}
        <div className="mt-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">
            How we protect you
          </h3>
          
          {pillars.map((item, index) => (
            <div key={index} className="pillar-card">
              <div className="pillar-icon-wrapper">
                {item.icon}
              </div>
              <div className="pillar-info flex-1">
                <h4>
                  {item.title}
                  <span className="pillar-tag">{item.tag}</span>
                </h4>
                <p className="pillar-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legal Compliance */}
        <div className="compliance-box">
          <ShieldCheck className="text-blue-600 shrink-0" size={20} />
          <p className="compliance-text">
            <strong>Legal Notice:</strong> This application operates under the Data Protection Act of 2021. 
            By using BIGE-50, you agree to our encrypted data processing terms.
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-8 font-bold uppercase tracking-[0.2em]">
          End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}