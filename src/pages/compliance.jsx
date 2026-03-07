import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Fingerprint, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import "./compliance.css";

export default function ComplianceScreen({ transactionId, onVerified }) {
  const [verifying, setVerifying] = useState(false);
  const [protocolStep, setProtocolStep] = useState(0); // 0: Init, 1: Scanning, 2: Approved
  const [error, setError] = useState(null);

  const runProtocolCheck = async () => {
    setVerifying(true);
    setError(null);
    
    // Step 1: Initialize Scan
    setProtocolStep(1);
    
    try {
      // Simulate Deep Ledger Verification
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Step 2: Finalize Status in Database
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'settlement' })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      setProtocolStep(2);
      
      // Delay to show success before moving to next screen
      setTimeout(() => {
        onVerified();
      }, 1500);

    } catch (err) {
      setError("Compliance Node Timeout. Please retry authorization.");
      setVerifying(false);
      setProtocolStep(0);
    }
  };

  return (
    <div className="compliance-overlay">
      <div className="compliance-modal animate-scale-up">
        {/* HEADER */}
        <div className="compliance-header">
          <div className="security-tag">
            <ShieldAlert size={12} /> SECURE PROTOCOL v4.0
          </div>
          <h2 className="compliance-title">Identity Clearance</h2>
          <p className="compliance-subtitle">
            Transaction <strong>#{transactionId.slice(-6).toUpperCase()}</strong> requires administrative authorization.
          </p>
        </div>

        {/* SCANNING VISUAL */}
        <div className="protocol-visual-area">
          <div className={`scanner-ring ${protocolStep === 1 ? 'active-scan' : ''}`}>
            {protocolStep === 2 ? (
              <ShieldCheck size={48} className="text-emerald-500 animate-bounce" />
            ) : (
              <Fingerprint size={48} className={protocolStep === 1 ? 'text-amber-500' : 'text-slate-600'} />
            )}
            {protocolStep === 1 && <div className="laser-line"></div>}
          </div>
          
          <div className="protocol-status-text">
            {protocolStep === 0 && "Biometric Node Standby"}
            {protocolStep === 1 && "Analyzing Identity Vectors..."}
            {protocolStep === 2 && "Clearance Granted"}
          </div>
        </div>

        {/* DETAILS TABLE */}
        <div className="compliance-audit-box">
          <div className="audit-row">
            <span>Network Node</span>
            <span className="font-mono">BIGE-AFRIBAS-ZAM-01</span>
          </div>
          <div className="audit-row">
            <span>Encryption</span>
            <span>AES-256-GCM</span>
          </div>
        </div>

        {error && (
          <div className="compliance-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ACTION BUTTON */}
        <button 
          className={`protocol-btn ${protocolStep === 2 ? 'btn-success' : ''}`}
          onClick={runProtocolCheck}
          disabled={verifying}
        >
          {verifying ? (
            <><Loader2 className="animate-spin" size={18} /> Validating...</>
          ) : protocolStep === 2 ? (
            "Access Authorized"
          ) : (
            <>Authorize Settlement <ChevronRight size={18} /></>
          )}
        </button>

        <p className="compliance-footer">
          By authorizing, you confirm the legality of funds under AML Regulation 102.
        </p>
      </div>
    </div>
  );
}