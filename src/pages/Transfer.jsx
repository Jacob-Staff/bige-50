import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Globe, Send, Loader2, Info, ArrowDown, 
  Wallet, Landmark, CheckCircle2, X, Share2, Home, List 
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import { supabase } from "../lib/supabaseClient";
import "./Transfer.css";

export default function Transfer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sourceType, setSourceType] = useState("internal"); 
  const [transferType, setTransferType] = useState("local");
  const [showReview, setShowReview] = useState(false);
  const [balance, setBalance] = useState(0);
  const [txRef, setTxRef] = useState("");

  const [formData, setFormData] = useState({
    recipientBank: "",
    recipientAccount: "",
    amount: "",
    sourceBank: "BIGE Wallet"
  });

  useEffect(() => {
    const getBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', user.id)
          .single();
        if (data) setBalance(data.wallet_balance || 0);
      }
    };
    getBalance();
  }, []);

  const fee = transferType === "local" ? 15 : 250;
  const totalDebit = parseFloat(formData.amount || 0) + fee;

  const handleOpenReview = (e) => {
    e.preventDefault();
    // Logic: Only check balance if money is leaving the BIGE Wallet
    if (sourceType === "internal" && totalDebit > balance) {
      alert(`Insufficient balance. You need K${totalDebit.toFixed(2)} but only have K${balance.toFixed(2)}`);
      return;
    }
    setShowReview(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowReview(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to authorize transfer.");

      const generatedRef = `BG-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Log the transaction regardless of source (Inter-Bank or Wallet)
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount: parseFloat(formData.amount),
          bank_name: formData.recipientBank,
          source_bank: sourceType === "internal" ? "BIGE Wallet" : formData.sourceBank,
          country: transferType === "local" ? "Zambia" : "International",
          status: 'processing',
          reference_number: generatedRef,
          transfer_type: sourceType // Tracks if it was Internal vs External
        }]);

      if (error) throw error;

      // 2. Only Deduct from BIGE Balance if source is Internal
      if (sourceType === "internal") {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ wallet_balance: balance - totalDebit })
          .eq('id', user.id);
        
        if (balanceError) throw balanceError;
      }

      setTxRef(generatedRef);
      setIsSuccess(true);
    } catch (error) {
      console.error("Transfer Error:", error.message);
      alert("Bridge Security: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="transfer-page">
        <div className="success-container animate-fade-in">
          <div className="success-icon-wrapper">
            <div className="success-glow"></div>
            <CheckCircle2 size={80} className="success-check-icon" />
          </div>
          <h2 className="success-title">Settlement Authorized</h2>
          <p className="success-subtitle">Bridge link established. Funds are in transit.</p>
          
          <div className="success-card">
            <div className="receipt-row">
              <span>Source</span>
              <strong>{sourceType === "internal" ? "BIGE Wallet" : formData.sourceBank}</strong>
            </div>
            <div className="receipt-row">
              <span>Recipient Bank</span>
              <strong>{formData.recipientBank}</strong>
            </div>
            <div className="receipt-row amount-highlight">
              <span>Total Amount</span>
              <strong>K{parseFloat(formData.amount).toFixed(2)}</strong>
            </div>
            <div className="receipt-divider"></div>
            <div className="receipt-row ref-row">
              <span>Ref Number</span>
              <code className="ref-code">{txRef}</code>
            </div>
          </div>

          <div className="success-actions">
            <button className="primary-action-btn" onClick={() => navigate("/transactions")}>
              <List size={18} /> View Ledger Activity
            </button>
            <div className="dual-actions">
                <button className="secondary-btn" onClick={() => window.print()}>
                  <Share2 size={18} /> Receipt
                </button>
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
                  <Home size={18} /> Dashboard
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-page">
      <Topbar2 title="Institutional Bridge" />
      <div className="transfer-container">
        {/* NETWORK SELECTOR */}
        <div className="transfer-type-tabs">
          <button type="button" className={transferType === "local" ? "active" : ""} onClick={() => setTransferType("local")}>
            <Building2 size={18} /> Local Node
          </button>
          <button type="button" className={transferType === "international" ? "active" : ""} onClick={() => setTransferType("international")}>
            <Globe size={18} /> Global Bridge
          </button>
        </div>

        <form className="transfer-form" onSubmit={handleOpenReview}>
          <h3 className="form-section-title">Settlement Source</h3>
          <div className="segmented-control">
            <button type="button" className={sourceType === "internal" ? "active" : ""} onClick={() => setSourceType("internal")}>
              <Wallet size={16} /> BIGE Wallet
            </button>
            <button type="button" className={sourceType === "external" ? "active" : ""} onClick={() => setSourceType("external")}>
              <Landmark size={16} /> Inter-Bank
            </button>
          </div>

          {sourceType === "internal" ? (
            <div className="balance-info-card">
              <span className="label">Available Funds</span>
              <span className="value">K{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          ) : (
            <div className="external-details-card animate-slide-down">
              <div className="input-group">
                <label>Originating Institution</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zanaco / FNB" 
                  required 
                  onChange={(e) => setFormData({...formData, sourceBank: e.target.value})} 
                />
              </div>
            </div>
          )}

          <div className="bridge-visual">
            <div className="node-point"></div>
            <div className="bridge-line-active">
              <ArrowDown className="bridge-arrow" size={20} />
            </div>
            <div className="node-point"></div>
          </div>

          <h3 className="form-section-title">Target Credentials</h3>
          <div className="input-group">
            <label>Receiving Bank</label>
            <input type="text" placeholder="Select target bank" required onChange={(e) => setFormData({...formData, recipientBank: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Target Account/Node ID</label>
            <input type="text" placeholder="Enter recipient ID" required onChange={(e) => setFormData({...formData, recipientAccount: e.target.value})} />
          </div>

          <h3 className="form-section-title">Quantum Amount</h3>
          <div className="amount-input-wrapper">
            <span className="currency-symbol">K</span>
            <input type="number" step="0.01" placeholder="0.00" required onChange={(e) => setFormData({...formData, amount: e.target.value})} />
          </div>

          <button type="submit" className="transfer-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <>Initialize Transfer <Send size={18} /></>}
          </button>
        </form>
      </div>

      {showReview && (
        <div className="modal-overlay">
          <div className="review-modal animate-slide-up">
            <div className="modal-header">
              <h3>Settlement Review</h3>
              <button className="close-modal" onClick={() => setShowReview(false)}><X size={20} /></button>
            </div>
            <div className="review-content">
              <div className="review-item"><p>Source Node</p><span>{sourceType === "internal" ? "BIGE Vault" : formData.sourceBank}</span></div>
              <div className="review-item"><p>Target Node</p><span>{formData.recipientBank}</span></div>
              <div className="review-item"><p>Asset Value</p><span>K{parseFloat(formData.amount).toFixed(2)}</span></div>
              <div className="review-item"><p>Bridge Fee</p><span>K{fee.toFixed(2)}</span></div>
              <div className="review-divider"></div>
              <div className="review-item total-debit">
                <p>Total Settlement</p>
                <span>K{totalDebit.toFixed(2)}</span>
              </div>
            </div>
            <button className="confirm-final-btn" onClick={handleFinalSubmit}>
              Authorize & Broadcast
            </button>
          </div>
        </div>
      )}
    </div>
  );
}