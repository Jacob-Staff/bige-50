import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import "./AddMoney.css";
import { Smartphone, Landmark, UserCheck, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import Topbar2 from "../components/Topbar2";

export default function AddMoney() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Fetch real balance from the dedicated 'wallets' table
  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBalance(data?.balance || 0);
    } catch (err) {
      console.error("Balance sync failed:", err.message);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [success]);

  const methods = [
    { id: 1, title: "Mobile Money", desc: "Instantly via MTN or Airtel", icon: <Smartphone className="method-icon-blue" />, color: "#e0f2fe" },
    { id: 2, title: "Bank Transfer", desc: "Deposit via EFT or DDAC", icon: <Landmark className="method-icon-orange" />, color: "#ffedd5" },
    { id: 3, title: "Cash at Agent", desc: "Find a BIGE-50 agent nearby", icon: <UserCheck className="method-icon-green" />, color: "#dcfce7" },
  ];
//handle deposit
  const handleDeposit = async () => {
  if (!amount || !phone) return alert("Please enter amount and phone number");
  
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const ref = `BIGE-${user.id.slice(0,5)}-${Date.now()}`; // Unique Reference

    // STEP 1: Pre-log the transaction in your DB
    const { error: logError } = await supabase
      .from('bridge_transactions')
      .insert([{
        sender_id: user.id,
        amount: parseFloat(amount),
        recipient_bank: "Lenco Deposit",
        recipient_account: phone,
        status: 'pending',
        reference_number: ref // THIS MATCHES THE WEBHOOK EQ
      }]);

    if (logError) throw logError;

    // STEP 2: Trigger the STK Push
    const { data, error } = await supabase.functions.invoke('lenco-pay', {
      body: { 
        amount, 
        userEmail: user.email, 
        userId: user.id, 
        phone,
        reference: ref // Pass the same ref to Lenco
      }
    });

    if (error) throw error;
    alert("Check your phone for the PIN prompt!");

  } catch (err) {
    alert("Error: " + err.message);
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
          <h2 className="preview-amount">K {Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
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
            <button onClick={() => setSelectedMethod(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', marginTop: '10px' }}>
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
              onClick={() => navigate("/dashboard")}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1e293b', color: 'white', border: 'none', fontWeight: '700' }}
            >
              Return to Dashboard
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