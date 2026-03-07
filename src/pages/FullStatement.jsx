import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Topbar2 from "../components/Topbar2";
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import "./statement.css"; // Reusing your statement styles

export default function FullStatement() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFullHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate("/login");

        const { data, error } = await supabase
          .from('bridge_transactions')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
        setFilteredTransactions(data || []);
      } catch (err) {
        console.error("Error fetching full history:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFullHistory();
  }, [navigate]);

  // Handle Search Filtering
  useEffect(() => {
    const results = transactions.filter(tx =>
      tx.recipient_bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm)
    );
    setFilteredTransactions(results);
  }, [searchTerm, transactions]);

  const handleExport = () => {
    alert("Generating PDF Statement... This will be saved to your downloads.");
  };

  const isDeposit = (bank) => bank === "Wallet Top-up";

  return (
    <div className="statement-page">
      <Topbar2 title="Full Statement" />

      <div className="statement-container">
        {/* ACTION BAR */}
        <div className="statement-actions">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by bank or amount..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="export-icon-btn" onClick={handleExport} title="Download PDF">
            <Download size={20} />
          </button>
        </div>

        {loading ? (
          <div className="loading-box"><p>Loading records...</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-box"><p>No transactions found matching your search.</p></div>
        ) : (
          <div className="tx-list">
             <div className="statement-header-info">
                <span>Showing {filteredTransactions.length} records</span>
                <button onClick={handleExport} className="text-btn">Export PDF</button>
             </div>

            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="tx-row full-view">
                <div className="tx-left">
                  <div className={`tx-icon-bg ${isDeposit(tx.recipient_bank) ? 'bg-pos' : 'bg-neg'}`}>
                    {isDeposit(tx.recipient_bank) ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <strong>{isDeposit(tx.recipient_bank) ? "Deposit" : tx.recipient_bank}</strong>
                    <p className="tx-ref">Ref: {tx.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="tx-right">
                  <span className={isDeposit(tx.recipient_bank) ? "positive" : "negative"}>
                    {isDeposit(tx.recipient_bank) ? "+" : "-"} K{parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                  <small>{new Date(tx.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}