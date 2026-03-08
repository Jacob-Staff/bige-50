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
  const [phone, setPhone] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleDeposit = async () => {
    setLoading(true); // Fixed: changed from setIsLoading
    
    try {
      // 1. Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 2. Generate a unique reference
      const ref = `BIGE-${user.id.substring(0, 5)}-${Date.now()}`;
      
      // 3. Log the transaction in the database
      const { error: dbError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: parseFloat(amount),
          recipient_bank: 'Lenco Deposit',
          recipient_account: phone,
          status: 'pending',
          reference_number: ref,
          source_type: 'internal',
          fee: 0
        }]);

      if (dbError) throw dbError;

      // 4. Call the Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('lenco-pay', {
        body: { 
          amount: parseFloat(amount), 
          phone: phone, 
          reference: ref 
        }
      });

      if (funcError) throw funcError;

      // 5. Handle response
      if (data?.status === true || data?.status === 'success') {
        alert("Please check your phone for the PIN prompt!");
        setSuccess(true);
      } else {
        alert(`Error: ${data?.message || "Payment initiation failed"}`);
      }

    } catch (err) {
      console.error("Deposit Process Error:", err.message);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false); // Fixed: changed from setIsLoading
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
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Amount (ZMW)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                style={{ width: '100%', border: 'none', borderBottom: '2px solid #f1f5f9', outline: 'none', padding: '10px 0', fontSize: '24px', fontWeight: '700' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div style={{ textAlign: 'left', width: '100%' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Mobile Number</label>
              <input 
                type="text" 
                placeholder="097XXXXXXX" 
                style={{ width: '100%', border: 'none', borderBottom: '2px solid #f1f5f9', outline: 'none', padding: '10px 0', fontSize: '18px' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button 
              className="pay-btn"
              onClick={handleDeposit} 
              disabled={loading || !amount || !phone}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '12px', 
                background: loading ? '#94a3b8' : '#1e293b', 
                color: 'white', 
                border: 'none', 
                fontWeight: '700', 
                display: 'flex', 
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirm Deposit"}
            </button>
            
            <button onClick={() => setSelectedMethod(null)} disabled={loading} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px' }}>
              Cancel
            </button>
          </div>
        )}

        {success && (
          <div className="method-card" style={{ flexDirection: 'column', padding: '30px', textAlign: 'center', width: '100%' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '15px', alignSelf: 'center' }} />
            <h3 className="method-title">Processing Request</h3>
            <p className="method-desc" style={{ marginBottom: '20px' }}>Once you enter your PIN, your balance will update automatically.</p>
            <button 
              onClick={() => navigate("/dashboard")}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1e293b', color: 'white', border: 'none', fontWeight: '700' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}