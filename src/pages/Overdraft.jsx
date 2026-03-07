import { useState, useEffect } from "react";
import { Info, AlertCircle, CheckCircle2, Zap, Loader2 } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // 👈 Your Cloud Connection
import "./overdraft.css";

export default function Overdraft() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();
  const limit = 500.00; 

  // 1. Get current balance from cloud
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  const handleApply = async () => {
    const borrowAmount = parseFloat(amount);
    if (borrowAmount > limit) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate new balance (Current + Borrowed)
      const newBalance = balance + borrowAmount;

      // A. Update Wallet Balance in Cloud
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // B. Create Transaction Record
      const { data: txData, error: txError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: borrowAmount,
          recipient_bank: "Bridge Overdraft",
          recipient_account: "Wallet Credit",
          status: 'completed'
        }])
        .select()
        .single();

      if (txError) throw txError;

      // C. Success Message and Redirect
      alert(`K${borrowAmount.toFixed(2)} has been added to your wallet successfully!`);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Failed to process overdraft. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overdraft-page">
      <Topbar2 title="Overdraft" />

      <div className="overdraft-container">
        {/* CREDIT LIMIT CARD */}
        <div className="limit-card">
          <div className="limit-header">
            <Zap size={16} fill="#fbbf24" color="#fbbf24" />
            <span>Available Limit</span>
          </div>
          <h2 className="limit-amount">K {limit.toFixed(2)}</h2>
          <div className="limit-progress-bar">
            <div className="limit-progress-fill" style={{ width: '100%' }}></div>
          </div>
          <p className="limit-hint">Current Wallet: K{balance.toLocaleString()}</p>
        </div>

        {/* INPUT SECTION */}
        <div className="borrow-section">
          <label className="input-label">How much do you need?</label>
          <div className="borrow-input-wrapper">
            <span className="k-prefix">K</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {amount > 0 && (
            <div className="terms-preview">
              <div className="term-row">
                <span>Interest (5%)</span>
                <span>K {(amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="term-row total">
                <span>Repayment Total</span>
                <span>K {(amount * 1.05).toFixed(2)}</span>
              </div>
              <div className="term-row date">
                <span>Due Date</span>
                <span>In 30 Days</span>
              </div>
            </div>
          )}

          <button 
            className="apply-btn" 
            onClick={handleApply}
            disabled={!amount || amount > limit || loading || amount <= 0}
            style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
            {amount > limit ? "Exceeds Limit" : loading ? "Processing..." : "Get Funds Instantly"}
          </button>
        </div>

        <div className="overdraft-features">
          <div className="feature">
            <CheckCircle2 size={18} className="text-green" style={{ color: '#22c55e' }} />
            <div className="feature-text">
              <strong>Instant Approval</strong>
              <p>Money is dropped into your wallet immediately.</p>
            </div>
          </div>
          <div className="feature">
            <AlertCircle size={18} className="text-blue" style={{ color: '#3b82f6' }} />
            <div className="feature-text">
              <strong>Flexible Repayment</strong>
              <p>Pay back anytime within 30 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}