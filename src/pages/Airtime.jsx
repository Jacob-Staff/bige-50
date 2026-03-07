import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // 👈 Cloud Connection
import { Phone, ChevronRight, Loader2 } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./payBills.css"; 

export default function Airtime() {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // 1. Fetch live balance to prevent overdrafts
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  const networks = [
    { id: "mtn", title: "MTN Zambia", color: "#fde047", desc: "Everywhere you go" },
    { id: "airtel", title: "Airtel Zambia", color: "#fecaca", desc: "The smartphone network" },
    { id: "zamtel", title: "Zamtel", color: "#bbf7d0", desc: "Be better today" }
  ];

  const handleBackAction = () => {
    if (selectedNetwork) {
      setSelectedNetwork(null);
      setPhone("");
      setAmount("");
    } else {
      navigate("/dashboard");
    }
  };

  // 2. Cloud-based Purchase Logic
  const handlePurchase = async () => {
    const purchaseAmount = parseFloat(amount);

    if (purchaseAmount > balance) {
      alert(`Insufficient funds. Your balance is K${balance.toLocaleString()}`);
      return;
    }

    if (purchaseAmount < 2) {
      alert("Minimum recharge is K2.00");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newBalance = balance - purchaseAmount;

      // A. Deduct from Profile Balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // B. Create Transaction Entry
      const { data: txData, error: txError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: purchaseAmount,
          recipient_bank: selectedNetwork.title, // Using this for the network name
          recipient_account: phone,
          status: 'completed'
        }])
        .select()
        .single();

      if (txError) throw txError;

      // C. Navigate to Receipt
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: purchaseAmount,
            category: `${selectedNetwork.title} Airtime`,
            reference: `AIR-${txData.id.slice(0, 8).toUpperCase()}`,
            createdAt: txData.created_at
          } 
        } 
      });
    } catch (err) {
      console.error(err);
      alert("Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-bills-page">
      <Topbar2 
        title={selectedNetwork ? `Recharge ${selectedNetwork.title}` : "Airtime"} 
        onBack={handleBackAction}
      />

      <div className="bills-container">
        {/* Balance Preview */}
        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '15px' }}>
          Available Balance: <strong>K{balance.toLocaleString()}</strong>
        </p>

        {!selectedNetwork ? (
          <>
            <h3 className="section-subtitle">Select Network</h3>
            <div className="billers-list">
              {networks.map((net) => (
                <div key={net.id} className="biller-card" onClick={() => setSelectedNetwork(net)}>
                  <div className="biller-icon-wrapper" style={{ backgroundColor: net.color }}>
                    <Phone size={20} color="#1e293b" />
                  </div>
                  <div className="biller-info">
                    <span className="biller-title">{net.title}</span>
                    <span className="biller-desc">{net.desc}</span>
                  </div>
                  <ChevronRight size={18} className="biller-chevron" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bill-form-card">
            <div className="form-header">
              <div className="biller-icon-wrapper" style={{ backgroundColor: selectedNetwork.color, margin: '0 auto' }}>
                 <Phone size={24} color="#1e293b" />
              </div>
              <h4>{selectedNetwork.title}</h4>
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                placeholder="09XXXXXXXX" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Amount (ZMW)</label>
              <input 
                type="number" 
                placeholder="Min K2.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                disabled={loading}
              />
            </div>

            <button 
              className="pay-btn" 
              onClick={handlePurchase} 
              disabled={loading || !phone || !amount}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirm Recharge"}
            </button>
            
            <button 
              className="cancel-btn" 
              onClick={handleBackAction} 
              disabled={loading}
            >
              Change Network
            </button>
          </div>
        )}
      </div>
    </div>
  );
}