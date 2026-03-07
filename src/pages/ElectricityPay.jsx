import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // 👈 Cloud connection
import { Zap, Info, Loader2 } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./ElectricityPay.css";

export default function ElectricityPay() {
  const navigate = useNavigate();
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // 1. Fetch live balance
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  // 2. Handle Purchase Logic
  const handlePurchase = async () => {
    const payAmount = parseFloat(amount);

    if (payAmount > balance) {
      alert("Insufficient funds in your Main Wallet.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate a simulated 20-digit ZESCO token
      const generatedToken = Array.from({ length: 5 }, () => 
        Math.floor(1000 + Math.random() * 9000)
      ).join("-");

      const newBalance = balance - payAmount;

      // Update Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Record Transaction
      const { error: txError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: payAmount,
          recipient_bank: "ZESCO",
          recipient_account: meterNumber,
          status: 'completed'
        }]);

      if (txError) throw txError;

      // Navigate to Receipt with the Token
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: payAmount,
            category: "ZESCO Electricity",
            reference: generatedToken, // This shows as the token number
            createdAt: new Date().toISOString()
          } 
        } 
      });

    } catch (err) {
      console.error(err);
      alert("System connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="electricity-page">
      <Topbar2 title="ZESCO Electricity" />

      <div className="electricity-container">
        <p className="wallet-status">Wallet Balance: <strong>K{balance.toLocaleString()}</strong></p>

        <div className="pay-card">
          <div className="input-group">
            <label>Meter Number</label>
            <div className="input-wrapper">
              <Zap size={18} className="input-icon" />
              <input 
                type="number" 
                placeholder="Enter 11-digit meter number" 
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="meter-info-box">
            <Info size={14} />
            <span>Ensure the meter number is correct. ZESCO tokens are non-refundable.</span>
          </div>

          <div className="input-group">
            <label>Amount (ZMW)</label>
            <div className="input-wrapper">
              <span className="currency-prefix">K</span>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            className="confirm-btn" 
            onClick={handlePurchase}
            disabled={!meterNumber || !amount || loading}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Purchase Token"}
          </button>
        </div>

        <div className="recent-section">
          <h4>Saved Meters</h4>
          <div className="recent-item" onClick={() => setMeterNumber("12245567890")}>
            <div className="recent-avatar" style={{ background: '#ffedd5', color: '#ea580c' }}>Z</div>
            <div className="recent-info">
              <span className="recent-name">Home Meter</span>
              <span className="recent-sub">12245567890</span>
            </div>
            <button className="use-btn">Use</button>
          </div>
        </div>
      </div>
    </div>
  );
}