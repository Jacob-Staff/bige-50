import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Topbar2 from "../components/Topbar2";
import { ArrowUpRight, ArrowDownLeft, Search, FileText, Calendar } from "lucide-react";
import "./Statement.css";

export default function Statement() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('bridge_transactions')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("System Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const isDeposit = (bank) => bank === "Wallet Top-up";

  const filteredTx = transactions.filter(tx => 
    tx.recipient_bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.recipient_account?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="statement-page">
      <Topbar2 title="Bridge Ledger" />
      
      <div className="statement-container">
        {/* Search Bar for Professional Look */}
        <div className="search-wrapper">
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Syncing Ledger Records...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="empty-box">
            <FileText size={48} color="#e2e8f0" />
            <p>No activity recorded in ledger.</p>
          </div>
        ) : (
          <div className="tx-list">
            <div className="list-header">
               <Calendar size={14} />
               <span>Historical Settlement Data</span>
            </div>
            
            {filteredTx.map((tx) => (
              <div key={tx.id} className="tx-row">
                <div className="tx-left">
                  <div className={`tx-icon-bg ${isDeposit(tx.recipient_bank) ? 'bg-pos' : 'bg-neg'}`}>
                    {isDeposit(tx.recipient_bank) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="tx-info">
                    <strong>{isDeposit(tx.recipient_bank) ? "Deposit" : tx.recipient_bank}</strong>
                    <p className="tx-ref">Ref: {tx.recipient_account}</p> 
                  </div>
                </div>

                <div className="tx-right">
                  <span className={`tx-amount ${isDeposit(tx.recipient_bank) ? "positive" : "negative"}`}>
                    {isDeposit(tx.recipient_bank) ? "+" : "-"} K{parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                  <small>{new Date(tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="done-btn" onClick={() => navigate("/dashboard")}>
          Return to Terminal
        </button>
      </div>
    </div>
  );
}