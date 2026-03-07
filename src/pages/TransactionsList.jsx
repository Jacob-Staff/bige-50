import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  Search, 
  Filter, 
  Loader2, 
  ChevronRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./TransactionsList.css";

export default function TransactionsList() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.source_bank?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="vault-loading-fullscreen">
        <div className="vault-loading-content">
          <div className="spinner-relative">
            <div className="sonar-ring"></div>
            <Loader2 className="vault-spinner-icon" size={32} />
          </div>
          <p className="vault-loading-text">SYNCHRONIZING GLOBAL LEDGER</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-vault-bg">
      <div className="list-vault-inner animate-fade-in">
        <Topbar2 title="Bridge Ledger" onBack={() => navigate("/dashboard")} />
        
        <div className="ledger-content-wrapper">
            {/* SEARCH HUB */}
            <div className="ledger-search-box">
              <Search size={16} className="search-icon" />
              <input 
                  type="text" 
                  placeholder="Search Reference, Bank or Source..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Filter size={16} className="filter-icon" />
            </div>

            <div className="holdings-header">
              <div className="header-label-group">
                <span className="section-title">Settlement Logs</span>
                <span className="node-count">ENCRYPTED PROTOCOL</span>
              </div>
              <span className="protocol-info">{filteredTransactions.length} ENTRIES</span>
            </div>

            {/* TRANSACTION GRID */}
            <div className="ledger-list">
            {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                <div 
                    key={tx.id} 
                    className={`ledger-item ${tx.transfer_type === 'external' ? 'external-bridge' : ''}`}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                >
                    <div className="ledger-left">
                      {/* ICON LOGIC based on status and type */}
                      <div className={`status-icon-box ${tx.status === 'settled' ? 'success' : 'pending'}`}>
                          {tx.status === 'settled' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      
                      <div className="ledger-meta">
                          <div className="bank-row">
                            <span className="ledger-bank">{tx.bank_name}</span>
                            {/* NEW: Badge showing Source Node */}
                            <span className={`node-badge ${tx.transfer_type === 'external' ? 'ext' : 'int'}`}>
                              {tx.transfer_type === 'external' ? <Landmark size={8}/> : <ShieldCheck size={8}/>}
                              {tx.transfer_type === 'external' ? 'Inter-Bank' : 'Vault'}
                            </span>
                          </div>
                          <span className="ledger-ref">{tx.reference_number}</span>
                      </div>
                    </div>

                    <div className="ledger-right">
                      <span className={`ledger-amount ${tx.status === 'settled' ? 'settled-val' : ''}`}>
                        K{tx.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                      <span className="ledger-date">
                          {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <ChevronRight size={14} className="chevron-dim" />
                </div>
                ))
            ) : (
                <div className="empty-ledger">
                  <ShieldCheck size={48} className="empty-icon" />
                  <h3>No Ledger Data</h3>
                  <p>No transactions detected on this node's frequency.</p>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}