import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { Loader2, ShieldCheck, Landmark, ArrowDownToLine, Info } from "lucide-react";
import "./Withdraw.css";
import Topbar2 from "../components/Topbar2";

export default function Withdraw() {
  const navigate = useNavigate();
  const [method, setMethod] = useState("Bank Transfer");
  const [provider, setProvider] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Updated to fetch from 'wallets' table
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
      
    if (data) setBalance(data.balance || 0);
  };

  const withdrawalFee = amount ? (parseFloat(amount) * 0.02).toFixed(2) : "0.00";
  const totalDeduction = amount ? (parseFloat(amount) + parseFloat(withdrawalFee)).toFixed(2) : "0.00";

  const handleWithdrawAction = async () => {
    const withdrawalAmount = parseFloat(amount);
    const totalToSubtract = parseFloat(totalDeduction);

    // VALIDATIONS
    if (withdrawalAmount < 50) {
      alert("Minimum settlement amount is K50.00");
      return;
    }

    if (totalToSubtract > balance) {
      alert(`Insufficient funds. Your balance is K${balance.toLocaleString()}. Total required: K${totalToSubtract.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const generatedRef = `WD-${Math.floor(100000 + Math.random() * 900000)}`;

      // INSERT TRANSACTION 
      // Note: We set status to 'pending' or 'processing'. 
      // Your DB trigger handle_withdrawal() will manage the wallet balance subtraction.
const { error: txError } = await supabase
  .from('transactions')
  .insert([{
    user_id: user.id,
    amount: withdrawalAmount,
    fee: parseFloat(withdrawalFee),
    bank_name: provider,      // Must match DB column name
    account_number: account,  // Must match DB column name
    type: 'withdrawal',
    method: method,
    status: 'pending',
    reference_number: generatedRef
  }]);
      if (txError) throw new Error("Ledger insertion failed: " + txError.message);

      alert("Bridge Settlement Initiated. Reference: " + generatedRef);
      navigate("/dashboard"); // Redirect back to dashboard to see updated status
    } catch (err) {
      console.error(err);
      alert("Settlement Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-page">
      <Topbar2 title="Bridge Settlement" />

      <div className="withdraw-container">
        <div className="settlement-header">
          <ShieldCheck size={18} color="#af641e" />
          <span>AFRIBAS-200.000 Settlement Protocol</span>
        </div>

        <div className="withdraw-card">
          <div className="available-balance-box">
             <label>Current Balance</label>
             <div className="balance-val">K {Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>

          <label className="input-label">Settlement Channel</label>
          <div className="custom-select-wrapper">
            <select value={method} onChange={(e) => {
              setMethod(e.target.value);
              setProvider(""); 
            }}>
              <option value="Bank Transfer">Commercial Bank</option>
              <option value="Mobile Money">Mobile Liquidity Provider</option>
            </select>
          </div>

          <label className="input-label">{method === "Bank Transfer" ? "Destination Institution" : "Network Provider"}</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="settlement-select">
            <option value="">Select Institution</option>
            {method === "Bank Transfer" ? (
              <>
                <option value="Zanaco">Zanaco</option>
                <option value="Stanbic">Stanbic</option>
                <option value="Absa">Absa Bank</option>
                <option value="FNB">FNB</option>
                <option value="Indo-Zambia">Indo-Zambia</option>
                <option value="Eco Bank">Eco Bank</option>
                <option value="Access Bank">Access Bank</option>
                <option value="ZICB">ZICB</option>
              </>
            ) : (
              <>
                <option value="MTN">MTN MoMo</option>
                <option value="Airtel">Airtel Money</option>
                <option value="Zamtel">Zamtel Kwacha</option>
              </>
            )}
          </select>

          <label className="input-label">{method === "Bank Transfer" ? "Account Number" : "Mobile Number"}</label>
          <input 
            type="text" 
            className="settlement-input"
            placeholder={method === "Bank Transfer" ? "Enter account digits" : "e.g. 097..."}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />

          <label className="input-label">Settlement Amount (ZMW)</label>
          <div className="amount-input-wrapper">
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="currency-tag">KWACHA</span>
          </div>

          <button 
            className="withdraw-btn" 
            onClick={handleWithdrawAction}
            disabled={loading || !amount || !provider || !account}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <ArrowDownToLine size={18} /> Confirm Settlement
              </>
            )}
          </button>
        </div>

        <div className="withdraw-summary">
          <div className="summary-row">
            <span>Weswac Bridge Fee (2%)</span>
            <span>{withdrawalFee} K</span>
          </div>
          <div className="summary-row total">
            <span>Total Ledger Deduction</span>
            <span className="deduction-val">-{totalDeduction} K</span>
          </div>
        </div>

        <div className="settlement-info">
          <Info size={14} />
          <p>Settlements are processed via the ABONEF Bridge. Funds typically reflect in 5-30 minutes.</p>
        </div>
      </div>
    </div>
  );
}