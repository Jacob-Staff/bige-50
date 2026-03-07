import { useState, useEffect } from "react";
import "./payBills.css";
import { 
  GraduationCap, Zap, Tv, Droplets, Sun, 
  ChevronRight, Loader2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // 👈 Cloud Connection
import Topbar2 from "../components/Topbar2";

export default function PayBills() {
  const navigate = useNavigate();
  const [selectedBiller, setSelectedBiller] = useState(null); 
  const [accountNumber, setAccountNumber] = useState(""); 
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // 1. Load balance to ensure user can afford the bill
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      if (data) setBalance(data.wallet_balance);
    };
    fetchBalance();
  }, []);

  const billers = [
    { id: 1, title: "School Fees", desc: "Pay directly to schools & unis", icon: <GraduationCap className="biller-icon-blue" />, color: "#e0f2fe", label: "Student ID / Reference" },
    { id: 2, title: "Electricity", desc: "ZESCO Prepaid & Postpaid", icon: <Zap className="biller-icon-orange" />, color: "#ffedd5", label: "Meter Number" },
    { id: 3, title: "Solar", desc: "Fenix, d.light & more", icon: <Sun className="biller-icon-yellow" />, color: "#fef9c3", label: "System ID / Account" },
    { id: 4, title: "Pay TV", desc: "DStv, GOtv & TopStar", icon: <Tv className="biller-icon-purple" />, color: "#f3e8ff", label: "Smartcard / IUC Number" },
    { id: 5, title: "Water", desc: "Local water utility bills", icon: <Droplets className="biller-icon-cyan" />, color: "#ecfeff", label: "Customer Account No" },
  ];

  const handleBackAction = () => {
    if (selectedBiller) {
      setSelectedBiller(null);
      setAccountNumber("");
      setAmount("");
    } else {
      navigate("/dashboard");
    }
  };

  // 2. Cloud Payment Handler
  const handlePayment = async () => {
    const payAmount = parseFloat(amount);
    
    if (payAmount > balance) {
      alert("Insufficient funds to pay this bill.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newBalance = balance - payAmount;

      // A. Update Wallet Balance
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
          amount: payAmount,
          recipient_bank: selectedBiller.title,
          recipient_account: accountNumber,
          status: 'completed'
        }])
        .select()
        .single();

      if (txError) throw txError;

      // C. Navigate to Receipt
      navigate("/receipt", { 
        state: { 
          transaction: {
            amount: payAmount,
            category: `Bill: ${selectedBiller.title}`,
            reference: `REF-${Math.random().toString(36).toUpperCase().slice(2, 10)}`,
            createdAt: txData.created_at
          } 
        } 
      });

    } catch (err) {
      console.error(err);
      alert("Bill payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-bills-page">
      <Topbar2 
        title={selectedBiller ? `Pay ${selectedBiller.title}` : "Pay Bills"} 
        onBack={handleBackAction}
      />

      <div className="bills-container">
        <p className="balance-info">Available: <strong>K{balance.toLocaleString()}</strong></p>
        
        {!selectedBiller ? (
          <>
            <h3 className="section-subtitle">Choose Category</h3>
            <div className="billers-list">
              {billers.map((biller) => (
                <div key={biller.id} className="biller-card" onClick={() => setSelectedBiller(biller)}>
                  <div className="biller-icon-wrapper" style={{ backgroundColor: biller.color }}>
                    {biller.icon}
                  </div>
                  <div className="biller-info">
                    <span className="biller-title">{biller.title}</span>
                    <span className="biller-desc">{biller.desc}</span>
                  </div>
                  <ChevronRight size={18} className="biller-chevron" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bill-form-card">
            <div className="form-header">
              <div className="biller-icon-wrapper" style={{ backgroundColor: selectedBiller.color, margin: "0 auto 10px" }}>
                {selectedBiller.icon}
              </div>
              <h4>{selectedBiller.title}</h4>
            </div>
            
            <div className="input-group">
              <label>{selectedBiller.label}</label>
              <input 
                type="text" 
                placeholder={`Enter ${selectedBiller.label}`}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Amount (ZMW)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button 
              className="pay-btn" 
              onClick={handlePayment} 
              disabled={loading || !accountNumber || !amount}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : `Pay ${selectedBiller.title}`}
            </button>
            
            <button className="cancel-btn" onClick={handleBackAction} disabled={loading}>
              Back to Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}