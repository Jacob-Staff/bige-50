import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { 
  ChevronLeft, ShieldCheck, Landmark, 
  Info, AlertCircle, CheckCircle2, Loader2 
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./loanapp.css";

export default function LoanApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ensure limit is treated as a number
  const numericLimit = Number(location.state?.limit) || 0;
  const tier = location.state?.tier || "Standard";
  
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); 
  const [statusMsg, setStatusMsg] = useState("Initializing Secure Handshake...");

  // Prevent direct access without state
  useEffect(() => {
    if (!location.state) {
      navigate("/economy");
    }
  }, [location, navigate]);

  const handleApply = async () => {
    const loanAmount = parseFloat(amount);
    
    // Logic validation with clear alerts if the button is clicked with wrong data
    if (!loanAmount || loanAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    if (loanAmount > numericLimit) {
      alert(`Request exceeds institutional limit of K${numericLimit.toLocaleString()}`);
      return;
    }
    
    setIsSubmitting(true);
    setStatusMsg("Connecting to Credit Engine...");

    try {
      // 1. Get Session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Security session expired. Please re-authenticate.");

      // 2. Verified Data Fetch
      setStatusMsg("Verifying Collateral Equity...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw new Error("Verification failed. Ledger unreachable.");

      const newBalance = (Number(profile?.wallet_balance) || 0) + loanAmount;

      // 3. Phase: Immutable Ledger Entry
      setStatusMsg("Generating Institutional Bond...");
      const { error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: loanAmount,
            type: 'loan', 
            description: `WESWAC Liquidity Injection - [${tier}]`,
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ]);

      if (txError) throw new Error("Ledger rejection. Transaction aborted.");

      // 4. Phase: Liquidity Payout
      setStatusMsg("Authorizing Payout...");
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) {
        console.error("CRITICAL ERROR: Balance sync failed.");
        throw new Error("Payout sync failed. Contact institutional support.");
      }

      // 5. Finalize
      setStatusMsg("Funding Authorized.");
      setTimeout(() => setStep(2), 800);

    } catch (error) {
      console.error("WESWAC Error:", error.message);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS INTERFACE
  if (step === 2) {
    return (
      <div className="app-wrapper econo-bg">
        <div className="loan-success-overlay animate-scale-up">
          <div className="success-icon-wrap">
            <CheckCircle2 size={72} className="text-emerald-500 mb-2" />
          </div>
          <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Funding Authorized</h2>
          <div className="success-amount-pills">
             <span className="pill-label">Settled Amount:</span>
             <span className="pill-value">K {parseFloat(amount).toLocaleString()}</span>
          </div>
          <p className="text-slate-400 max-w-[280px] mx-auto text-sm mt-4">
            Liquidity has been successfully injected into your managed settlement capital.
          </p>
          <button className="apply-loan-btn-gold mt-10" onClick={() => navigate("/economy")}>
            Return to Vault
          </button>
        </div>
      </div>
    );
  }

  // APPLICATION INTERFACE
  return (
    <div className="app-wrapper econo-bg">
      <div className="loan-app-header">
        <button onClick={() => navigate(-1)} className="back-btn" disabled={isSubmitting}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="tracking-tight">Institutional Credit</h1>
      </div>

      <div className="app-content p-5">
        <div className="tier-badge-status">
          <ShieldCheck size={14} className="animate-pulse" /> {tier} Priority Access
        </div>

        <div className="limit-card">
          <label className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Max Borrowing Capacity</label>
          <div className="limit-amount">K {numericLimit.toLocaleString()}</div>
          <p className="text-white text-[11px] opacity-80">Secured against 65% of net asset equity.</p>
        </div>

        <div className="input-group-terminal">
          <label className="text-white font-bold text-xs mb-3">Funding Request (ZMW)</label>
          <div className="input-wrapper-glow">
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              className="loan-input"
            />
          </div>
          {parseFloat(amount) > numericLimit && (
            <div className="error-msg text-red-400 flex items-center gap-1 mt-2 font-bold text-[11px]">
              <AlertCircle size={12} /> Institutional Limit Exceeded
            </div>
          )}
        </div>

        <div className="loan-terms-box bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
          <h3 className="text-white text-xs font-black mb-4 flex items-center gap-2">
            <Info size={14} className="text-amber-500" /> TERMS OF FINANCING
          </h3>
          <div className="term-row flex justify-between text-sm py-1">
            <span className="text-slate-400">Institutional Rate</span>
            <span className="text-emerald-400 font-bold">1.2% / Month</span>
          </div>
          <div className="term-row flex justify-between text-sm py-1">
            <span className="text-slate-400">Repayment Period</span>
            <span className="text-white">Flexible / Open</span>
          </div>
          <div className="term-row flex justify-between text-sm py-1 border-t border-white/5 mt-2 pt-2">
            <span className="text-slate-400">Total Settlement</span>
            <span className="text-white font-bold">K {amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
          </div>
        </div>

        <button 
          className={`apply-loan-btn-gold mt-6 ${isSubmitting ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02] active:scale-95'}`}
          disabled={isSubmitting}
          onClick={handleApply}
        >
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <Loader2 size={20} className="spin" />
              <span className="text-[9px] uppercase tracking-widest">{statusMsg}</span>
            </div>
          ) : "Confirm & Execute Agreement"}
        </button>

        <p className="compliance-note text-white/40 text-[10px] text-center mt-6 leading-relaxed uppercase tracking-tighter">
          By executing this request, you authorize WESWAC to place a temporary lien on your managed 
          equity. Funds are disbursed instantly upon digital signature.
        </p>
      </div>
    </div>
  );
}