import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import "./Statement.css";

export default function MiniStatement({ onViewAll }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMiniHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch only the 5 most recent transactions
        const { data, error } = await supabase
          .from('bridge_transactions')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching mini-statement:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMiniHistory();
  }, []);

  const isDeposit = (bank) => bank === "Wallet Top-up";

  return (
    <div className="mini-statement">
      <div className="mini-header">
        <h3>Recent Transactions</h3>
        <button onClick={onViewAll} className="view-all-btn">View all</button>
      </div>

      {loading ? (
        <div className="mini-loading">
          <Clock size={16} className="animate-spin" />
          <p>Updating...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-mini">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="mini-tx-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-row">
              <div className="tx-left">
                <div className={`mini-icon-bg ${isDeposit(tx.recipient_bank) ? 'bg-pos' : 'bg-neg'}`}>
                  {isDeposit(tx.recipient_bank) ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div>
                  <strong>{isDeposit(tx.recipient_bank) ? "Deposit" : tx.recipient_bank}</strong>
                  <p>{tx.recipient_account || "Processing"}</p>
                </div>
              </div>

              <div className="tx-right">
                <span className={isDeposit(tx.recipient_bank) ? "positive" : "negative"}>
                  {isDeposit(tx.recipient_bank) ? "+" : "-"} K{parseFloat(tx.amount).toFixed(2)}
                </span>
                <small>
                  {new Date(tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}