import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Store, Loader2, Info } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./pay.css";

export default function Pay() {
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ZMW");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // Mock exchange rates (1 USD = 25 ZMW)
  const rates = { ZMW: 1, USD: 25, EUR: 27 };

  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  const totalInZMW = parseFloat(amount || 0) * rates[currency];
  const fee = totalInZMW * 0.01; // 1% platform fee

  const handlePayNow = async () => {
    const finalDebit = totalInZMW + fee;

    if (finalDebit > balance) {
      alert("Insufficient funds in your ZMW wallet to cover this transaction.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Deduct from Cloud Wallet
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: balance - finalDebit })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Log Transaction
      const { data: txData } = await supabase.from('bridge_transactions').insert([{
        sender_id: user.id,
        amount: finalDebit,
        recipient_bank: "Merchant Payment",
        recipient_account: merchantId,
        status: 'completed'
      }]).select().single();

      // 3. Receipt
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: finalDebit,
            category: "Merchant P2P",
            reference: `PAY-${txData.id.slice(0, 8).toUpperCase()}`,
            createdAt: txData.created_at
          } 
        } 
      });

    } catch (err) {
      alert("Transaction failed. Please check the merchant ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <Topbar2 title="Pay Merchant" />

      <div className="pay-card">
        <div className="merchant-row">
          <div className="merchant-icon">
            <Store size={18} />
          </div>
          <div>
            <div className="merchant-label">Merchant ID</div>
            <div className="merchant-hint">
              Enter Bridge ID, phone or @handle
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="merchant@bridge"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
        />

        <label>Pay From</label>
        <div className="balance-info">Available: K{balance.toLocaleString()}</div>
        <select disabled>
          <option>Main Wallet (ZMW)</option>
        </select>

        <label>Amount</label>
        <div className="amount-row">
          <input 
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ZMW">ZMW</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <button 
          className="pay-btn" 
          onClick={handlePayNow}
          disabled={loading || !amount || !merchantId}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Pay Now"}
        </button>
      </div>

      <div className="pay-summary">
        <div className="summary-row">
          <span>Fee (1%)</span>
          <span>K {fee.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total Deduction</span>
          <span>K {finalDebit.toFixed(2)}</span>
        </div>
        <div className="exchange-note">
           <Info size={12} /> 
           {currency !== 'ZMW' && ` Rate: 1 ${currency} = K${rates[currency]}`}
        </div>
      </div>
    </div>
  );
}