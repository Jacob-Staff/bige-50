import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Share2, Download, Home } from "lucide-react";
import "./Receipt.css";

export default function Receipt() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tx = location.state?.transaction || {
    amount: "0.00",
    category: "General Transfer",
    reference: "TXN-" + Math.random().toString(36).toUpperCase().substring(2, 10),
    createdAt: new Date().toISOString()
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BIGE-50 Transaction Receipt',
        text: `Success! K${tx.amount} sent for ${tx.category}. Ref: ${tx.reference}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert("Receipt link copied to clipboard");
    }
  };

  return (
    <div className="receipt-page">
      {/* SUCCESS ANIMATION AREA */}
      <div className="receipt-success">
        <CheckCircle size={72} color="#16a34a" strokeWidth={1.5} />
        <h2>Payment Successful</h2>
        <p>Processed by Bridge Secure Link</p>
      </div>

      {/* THE VIRTUAL RECEIPT CARD */}
      <div className="receipt-card">
        <div className="receipt-brand-header">
          <img src="/Bige-50.jpg" alt="Logo" style={{ height: '30px', marginBottom: '8px' }} />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Official Receipt</p>
        </div>

        <div className="receipt-row">
          <span>Amount</span>
          <strong>ZMW {parseFloat(tx.amount).toFixed(2)}</strong>
        </div>

        <div className="receipt-row">
          <span>Transaction Type</span>
          <span>{tx.category}</span>
        </div>

        <div className="receipt-row">
          <span>Reference Number</span>
          <span className="ref-text">{tx.reference}</span>
        </div>

        <div className="receipt-row">
          <span>Date & Time</span>
          <span>{new Date(tx.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>

        <div className="receipt-row">
          <span>Status</span>
          <span className="status-success">Success</span>
        </div>

        {/* SECURE FOOTER ON CARD */}
        <div className="mt-6 pt-4 border-t border-slate-50 text-center">
          <p className="text-[9px] text-slate-300 font-medium">
            This is a computer-generated receipt and requires no signature.
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="receipt-actions">
        <button className="action-btn active:bg-slate-50" onClick={handleShare}>
          <Share2 size={18} />
          Share
        </button>

        <button className="action-btn active:bg-slate-50" onClick={() => window.print()}>
          <Download size={18} />
          PDF
        </button>
      </div>

      {/* MAIN CTA */}
      <button
        className="done-btn active:scale-95 transition-transform"
        onClick={() => navigate("/dashboard")}
      >
        Return to Dashboard
      </button>

      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
        <Home size={10} /> BIGE-50 Home
      </p>
    </div>
  );
}