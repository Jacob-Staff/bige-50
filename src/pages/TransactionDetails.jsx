import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  Landmark, CheckCircle2, Clock, Share2, ShieldCheck, 
  Loader2, Download, Fingerprint, Globe, ShieldAlert,
  ChevronRight, Wifi
} from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Topbar2 from "../components/Topbar2";
import "./transactionDetails.css";
import "./compliance.css"; 

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [protocolStep, setProtocolStep] = useState(0); 
  const [isSyncing, setIsSyncing] = useState(false);

  // --- 1. CORE FETCH ENGINE (With Silent Refresh Support) ---
  const fetchTx = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setIsSyncing(true);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        // Only update if data has changed to prevent UI flicker
        setTx(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (err) {
      console.error("Ledger Sync Error:", err);
    } finally {
      setLoading(false);
      // Small delay for the sync indicator to look natural
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // --- 2. AUTO-POLLING & CLEANUP ---
  useEffect(() => {
    fetchTx(true);

    // Heartbeat: Check ledger every 10 seconds if not settled
    const interval = setInterval(() => {
      if (tx?.status !== 'settled') {
        fetchTx(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id, tx?.status]);

  // --- 3. PROTOCOL AUTHORIZATION ---
  const handleAuthorizeProtocol = async () => {
    setVerifying(true);
    setProtocolStep(1); 
    
    try {
      // High-security simulation delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'settlement' })
        .eq('id', id);

      if (error) throw error;

      setProtocolStep(2);
      setTimeout(() => {
        setVerifying(false);
        fetchTx(false); 
      }, 1200);
    } catch (err) {
      alert("Verification Failed: Secure Node Unreachable.");
      setVerifying(false);
      setProtocolStep(0);
    }
  };

  // --- 4. EXPORT & SHARE ---
  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: "#0f172a", useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [490, canvas.height * (490 / canvas.width)] });
    pdf.addImage(imgData, 'PNG', 0, 0, 490, canvas.height * (490 / canvas.width));
    pdf.save(`BIGE50-RECEIPT-${tx?.reference_number}.pdf`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BIGE-50 Settlement Receipt',
          text: `Ref: ${tx?.reference_number} - Amount: K${tx?.amount}`,
          url: window.location.href,
        });
      } catch (err) { console.log("Share cancelled"); }
    }
  };

  if (loading) return (
    <div className="vault-loading-fullscreen">
      <div className="vault-loading-content">
        <Loader2 className="vault-spinner-icon animate-spin" size={32} />
        <p className="vault-loading-text">DECRYPTING LEDGER</p>
        <p className="vault-loading-subtext">ACCESSING NODE {id.slice(0,8).toUpperCase()}</p>
      </div>
    </div>
  );

  const stages = ["processing", "compliance", "settlement", "settled"];
  const currentStageIdx = stages.indexOf(tx?.status || "processing");

  return (
    <div className="tx-vault-bg">
      <Topbar2 title="Bridge Receipt" onBack={() => navigate(-1)} />
      
      {/* LEDGER SYNC INDICATOR */}
      <div className={`sync-indicator ${isSyncing ? 'syncing' : ''}`}>
        <Wifi size={10} /> {isSyncing ? 'SYNCING LEDGER...' : 'NODE CONNECTED'}
      </div>

      {/* 1. COMPLIANCE MODAL */}
      {tx?.status === 'compliance' && (
        <div className="compliance-overlay">
          <div className="compliance-modal animate-scale-up">
            <div className="security-tag"><ShieldAlert size={12} /> SECURE PROTOCOL v4.0</div>
            <h2 className="compliance-title">Identity Clearance</h2>
            <p className="compliance-subtitle">Transaction <strong>#{tx.reference_number}</strong> requires authorization.</p>
            
            <div className="protocol-visual-area">
              <div className={`scanner-ring ${protocolStep === 1 ? 'active-scan' : ''}`}>
                {protocolStep === 2 ? 
                  <ShieldCheck size={48} className="text-emerald-500" /> : 
                  <Fingerprint size={48} className={protocolStep === 1 ? 'text-amber-500' : 'text-slate-600'} />
                }
                {protocolStep === 1 && <div className="laser-line"></div>}
              </div>
              <div className="protocol-status-text">
                {protocolStep === 0 && "Biometric Node Standby"}
                {protocolStep === 1 && "Analyzing Identity..."}
                {protocolStep === 2 && "Clearance Granted"}
              </div>
            </div>

            <button className={`protocol-btn ${protocolStep === 2 ? 'btn-success' : ''}`} onClick={handleAuthorizeProtocol} disabled={verifying}>
              {verifying ? <Loader2 className="animate-spin" size={18} /> : protocolStep === 2 ? "Access Authorized" : <>Authorize Settlement <ChevronRight size={18} /></>}
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN RECEIPT */}
      <div className={`tx-vault-inner ${tx?.status === 'compliance' ? 'content-lock' : 'animate-fade-in'}`} ref={receiptRef}>
        <div className="receipt-watermark">BIGE-50 SECURED</div>

        <div className="protocol-banner">
          <div className="protocol-info">
            <Fingerprint size={14} className="text-amber-500" /> B.I.G.E-50 SECURE SETTLEMENT PROTOCOL
          </div>
          <div className="protocol-version">NODE v2.04.8</div>
        </div>

        <div className="tx-header-card">
          <div className="tx-vault-icon-ring"><Landmark className="text-amber-500" size={30} /></div>
          <span className="card-label">Settlement Amount</span>
          <h1 className="tx-amount-big"><span className="tx-unit-amber">K</span>{tx?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
          
          <div className={`vault-status-badge mt-4 ${tx?.status === 'settled' ? 'status-verified' : 'status-processing'}`}>
             {tx?.status === 'settled' ? <><CheckCircle2 size={12} /> LEDGER VERIFIED</> : <><Clock size={12} className="animate-pulse" /> {tx?.status?.toUpperCase()} IN PROGRESS</>}
          </div>
        </div>

        <div className="tx-status-container">
            <div className="holdings-header">
                <span className="section-title">Transfer Journey</span>
                <span className="tx-id-small">NODE-ID: {tx?.id.slice(0,8)}</span>
            </div>
            <div className="tx-tracker-line">
                {stages.map((stage, i) => (
                    <div key={stage} className="flex flex-col items-center z-10">
                        <div className={`tx-dot ${i <= currentStageIdx ? 'active' : ''}`}>
                             {i === currentStageIdx && stage !== 'settled' && <div className="sonar-ring-small"></div>}
                        </div>
                        <span className={`tracker-label ${i <= currentStageIdx ? 'text-active' : 'text-dim'}`}>{stage}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="holdings-header">
            <span className="section-title">Audit Log</span>
            <Globe size={14} className="text-slate-600" />
        </div>
        <div className="tx-details-grid">
          <div className="tx-detail-item">
            <span className="tx-label">Global Reference</span>
            <span className="tx-value text-amber-500 font-mono">{tx?.reference_number}</span>
          </div>
          <div className="tx-detail-item">
            <span className="tx-label">Source Node</span>
            <span className="tx-value">{tx?.source_bank || "BIGE VAULT"}</span>
          </div>
          <div className="tx-detail-item">
            <span className="tx-label">Target Institution</span>
            <span className="tx-value">{tx?.bank_name}</span>
          </div>
          <div className="tx-detail-item">
            <span className="tx-label">Jurisdiction</span>
            <span className="tx-value">{tx?.country || "Zambia"}</span>
          </div>
          <div className="tx-detail-item">
            <span className="tx-label">Broadcast Time</span>
            <span className="tx-value">{new Date(tx?.created_at).toLocaleString()}</span>
          </div>
          <div className="tx-detail-item">
            <span className="tx-label">Network Type</span>
            <span className="tx-value uppercase text-[10px] bg-slate-800 px-2 py-1 rounded">Swift Bridge</span>
          </div>
        </div>

        <div className="security-advisory mt-6">
          <ShieldCheck size={28} className="text-amber-500/50" />
          <p>Official settlement confirmation. Hard-coded into the <strong>BIGE-50 Decentralized Ledger</strong>.</p>
        </div>

        <div className="receipt-actions">
            <button className="tx-action-btn primary" onClick={handleDownloadPDF}><Download size={18} /> Export Receipt</button>
            <button className="tx-action-btn secondary" onClick={handleShare}><Share2 size={18} /> Broadcast Link</button>
        </div>
      </div>
    </div>
  );
}