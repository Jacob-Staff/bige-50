import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // 👈 Connect to Cloud
import "./AddMoney.css";
import { Smartphone, Landmark, UserCheck, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import Topbar2 from "../components/Topbar2";

export default function AddMoney() {
  const [balance, setBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Fetch real balance from Supabase Profiles
  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setBalance(data.wallet_balance);
    } catch (err) {
      console.error("Balance sync failed:", err.message);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [success]); // Refetch balance whenever a success happens

  const methods = [
    { id: 1, title: "Mobile Money", desc: "Instantly via MTN or Airtel", icon: <Smartphone className="method-icon-blue" />, color: "#e0f2fe" },
    { id: 2, title: "Bank Transfer", desc: "Deposit via EFT or DDAC", icon: <Landmark className="method-icon-orange" />, color: "#ffedd5" },
    { id: 3, title: "Cash at Agent", desc: "Find a BIGE-50 agent nearby", icon: <UserCheck className="method-icon-green" />, color: "#dcfce7" },
  ];

  // 2. Handle Cloud Deposit
  const handleDeposit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const depositAmount = parseFloat(amount);
      const newBalance = balance + depositAmount;

      // Update the profile balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Record the transaction as a "DEPOSIT"
      const { error: txError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: depositAmount,
          recipient_bank: "Wallet Top-up",
          recipient_account: selectedMethod.title,
          status: 'completed'
        }]);

      if (txError) throw txError;

      setSuccess(true);
    } catch (err) {
      console.error("Deposit Error:", err.message);
      alert("Deposit failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-money-page">
      <Topbar2 title={selectedMethod ? `Funding via ${selectedMethod.title}` : "Add Money"} />

      <div className="add-money-container">
        <div className="balance-preview">
          <span className="preview-label">Current Balance</span>
          <h2 className="preview-amount">K {parseFloat(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>

        {!selectedMethod && (
          <>
            <h3 className="section-title">Select Payment Method</h3>
            <div className="methods-list">
              {methods.map((method) => (
                <div key={method.id} className="method-card" onClick={() => setSelectedMethod(method)}>
                  <div className="icon-wrapper" style={{ backgroundColor: method.color }}>
                    {method.icon}
                  </div>
                  <div className="method-info">
                    <span className="method-title">{method.title}</span>
                    <span className="method-desc">{method.desc}</span>
                  </div>
                  <ChevronRight size={20} className="chevron-icon" />
                </div>
              ))}
            </div>
          </>
        )}

        {selectedMethod && !success && (
          <div className="method-card" style={{ flexDirection: 'column', cursor: 'default', gap: '20px', padding: '20px' }}>
            <div style={{ textAlign: 'left', width: '100%' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Enter Amount (ZMW)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="preview-amount"
                style={{ width: '100%', border: 'none', borderBottom: '2px solid #f1f5f9', outline: 'none', padding: '10px 0', fontSize: '24px', fontWeight: '700' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <button 
              className="pay-btn"
              onClick={handleDeposit} 
              disabled={loading || !amount}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1e293b', color: 'white', border: 'none', fontWeight: '700', display: 'flex', justifyContent: 'center' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirm Deposit"}
            </button>
            <button onClick={() => setSelectedMethod(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px' }}>
              Cancel
            </button>
          </div>
        )}

        {success && (
          <div className="method-card" style={{ flexDirection: 'column', padding: '30px', textAlign: 'center', width: '100%' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '15px', alignSelf: 'center' }} />
            <h3 className="method-title">Deposit Successful</h3>
            <p className="method-desc" style={{ marginBottom: '20px' }}>Your wallet has been credited.</p>
            <button 
              onClick={() => { setSuccess(false); setSelectedMethod(null); setAmount(""); }}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1e293b', color: 'white', border: 'none' }}
            >
              Done
            </button>
          </div>
        )}

        <div className="help-box">
          <p>Need help? <strong>Contact Support</strong></p>
        </div>
      </div>
    </div>
  );
}