import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  Store, 
  Search, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Star 
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./PayBills.css"; // Reusing the clean form styles

export default function Goods() {
  const navigate = useNavigate();
  const [merchantCode, setMerchantCode] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // Load Cloud Balance
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  const featuredMerchants = [
    { id: 1, name: "Shoprite Manda Hill", code: "SHP101", category: "Supermarket" },
    { id: 2, name: "Hungry Lion", code: "HLN005", category: "Fast Food" },
    { id: 3, name: "TotalEnergies", code: "TOT442", category: "Fuel & Gas" },
  ];

  const handlePayment = async () => {
    const payAmount = parseFloat(amount);
    if (payAmount > balance) {
      alert("Insufficient funds for this purchase.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newBalance = balance - payAmount;

      // 1. Update Profile Wallet
      await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user.id);

      // 2. Log Transaction
      const { data: txData } = await supabase.from('bridge_transactions').insert([{
        sender_id: user.id,
        amount: payAmount,
        recipient_bank: `Merchant: ${merchantCode.toUpperCase()}`,
        recipient_account: "Till Payment",
        status: 'completed'
      }]).select().single();

      // 3. Receipt
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: payAmount,
            category: "Merchant Payment",
            reference: `TILL-${txData.id.slice(0, 6).toUpperCase()}`,
            createdAt: txData.created_at
          } 
        } 
      });
    } catch (err) {
      alert("Payment failed. Please check the Merchant Code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-bills-page">
      <Topbar2 title="Goods & Services" />

      <div className="bills-container">
        {/* MERCHANT SEARCH */}
        <div className="bill-form-card">
          <div className="input-group">
            <label>Merchant / Till Number</label>
            <div className="input-wrapper">
              <Search size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={merchantCode}
                onChange={(e) => setMerchantCode(e.target.value.toUpperCase())}
              />
            </div>
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
              />
            </div>
          </div>

          <button 
            className="pay-btn" 
            onClick={handlePayment}
            disabled={!merchantCode || !amount || loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Pay Merchant"}
          </button>
        </div>

        {/* MERCHANT DIRECTORY */}
        <div className="recent-section">
          <h4 className="section-subtitle">Nearby Merchants</h4>
          {featuredMerchants.map((m) => (
            <div key={m.id} className="biller-card" onClick={() => setMerchantCode(m.code)}>
              <div className="biller-icon-wrapper" style={{ backgroundColor: '#f1f5f9' }}>
                <Store size={20} color="#334155" />
              </div>
              <div className="biller-info">
                <span className="biller-title">{m.name}</span>
                <span className="biller-desc">{m.category} • Code: {m.code}</span>
              </div>
              <ChevronRight size={18} className="biller-chevron" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}