import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // 👈 Connect to Cloud
import "./sendMoney.css";
import Topbar2 from "../components/Topbar2";

export default function SendMoney() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ZMW");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Fee Calculation logic (keeping your 1% fee)
  const fee = amount ? (parseFloat(amount) * 0.01).toFixed(2) : "0.00"; 
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : "0.00";

  const handleSend = async () => {
    setLoading(true);

    try {
      // 1. Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      // 2. Fetch current balance from Cloud
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Validation: Check if user has enough money
      const totalCost = parseFloat(total);
      if (totalCost > profile.wallet_balance) {
        alert("Insufficient funds. Your balance is K" + profile.wallet_balance);
        setLoading(false);
        return;
      }

      // 4. PERFORM THE TRANSACTION
      // Subtract money from balance
      const newBalance = profile.wallet_balance - totalCost;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 5. Record in History (Ledger)
      const { data: txData, error: txError } = await supabase
        .from('bridge_transactions')
        .insert([{
          sender_id: user.id,
          amount: parseFloat(amount),
          recipient_bank: "Bridge Mobile", // Since it's a phone number
          recipient_account: recipient,
          status: 'completed'
        }])
        .select()
        .single();

      if (txError) throw txError;

      // SUCCESS: Redirect to Receipt with real data
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: amount,
            category: `Transfer to ${recipient}`,
            reference: `TXN-${txData.id.slice(0, 8).toUpperCase()}`,
            createdAt: txData.created_at
          } 
        } 
      });

    } catch (err) {
      console.error("Transfer Error:", err.message);
      alert("Transfer failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-page">
      <Topbar2 title="Pay" />

      <div className="send-container">
        <div className="send-card">
          <div className="input-group">
            <label>Recipient Mobile Number</label>
            <input
              type="tel"
              placeholder="e.g. 097XXXXXXXX"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Amount</label>
            <div className="amount-row">
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={loading}>
                <option value="ZMW">ZMW</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="What is this payment for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            className="send-btn" 
            onClick={handleSend} 
            disabled={!amount || !recipient || loading}
            style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Processing..." : "Confirm Transfer"}
          </button>
        </div>

        <div className="send-summary">
          <h3 className="summary-title">Transaction Summary</h3>
          <div className="summary-row">
            <span>Transfer Fee (1%)</span>
            <span>{currency} {fee}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total to Pay</span>
            <span>{currency} {total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}