import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Home, User, Eye, EyeOff, TrendingDown, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, RefreshCw, Globe, ArrowRightLeft, Link, Cpu, ChevronRight, Download, Activity, Landmark
} from "lucide-react";

import Topbar from "../components/Topbar";
import Drawer from "../components/Drawer";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 }); 
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // 1. Unified Institutional Data Fetcher
  const getDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, afribas_id, risk_index, is_quarantined') 
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch Wallet Balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (walletData) {
        setWallet(walletData);
      } else if (walletError && walletError.code === 'PGRST116') {
        setWallet({ balance: 0 });
      }

      // Fetch Recent Activity
      const { data: txData } = await supabase
        .from('bridge_transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`) 
        .order('created_at', { ascending: false })
        .limit(4);

      setTransactions(txData || []);

      // Fetch Unread Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(2);
      setNotifications(notifData || []);

    } catch (err) {
      console.error("Institutional Sync Failure:", err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // 2. Real-time Node Monitoring
  useEffect(() => {
    getDashboardData();
    
    const walletSubscription = supabase
      .channel('wallet_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'wallets' 
        }, 
        (payload) => {
          if (profile && payload.new.user_id === profile.id) {
            setWallet({ balance: payload.new.balance });
          } else {
            getDashboardData();
          }
        }
      )
      .subscribe();

    const txSubscription = supabase
      .channel('tx_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bridge_transactions' }, 
        () => getDashboardData()
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(walletSubscription); 
      supabase.removeChannel(txSubscription); 
    };
  }, [getDashboardData, profile?.id]);

  // UPDATED ACTIONS: Removed Vote, Added Deposit
  const actions = [
    { icon: <ShieldCheck size={22} />, label: "Afribas", path: "/afribas", active: true },
    { icon: <Landmark size={22} />, label: "Deposit", path: "/deposit" }, // New Deposit Action
    { icon: <RefreshCw size={22} />, label: "Transfer", path: "/transfer" },
    { icon: <ArrowRightLeft size={22} />, label: "Asset Swap", path: "/swap" },
    { icon: <TrendingDown size={22} />, label: "Econo-Plus", path: "/invest", special: true }, 
    { icon: <Link size={22} />, label: "Pay Links", path: "/links" }, 
    { icon: <Download size={22} />, label: "Withdraw", path: "/withdraw" },
    { icon: <Cpu size={22} />, label: "Vault", path: "/vault" }
  ];

  return (
    <>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <div className={`app-wrapper dashboard-container ${profile?.is_quarantined ? 'quarantine-ui' : ''}`}> 
        <Topbar 
          onMenuClick={() => setDrawerOpen(true)} 
          profile={profile} 
          loading={loading} 
        />
        
        <div className="app-content">
          
          <div className="status-strip">
             <div className="status-item">
                <Activity size={12} className="pulse-icon" />
                <span>Node: {profile?.afribas_id || 'Generating...'}</span>
             </div>
             <div className="status-item">
                <span>Risk Index: {profile?.risk_index || 0}%</span>
             </div>
          </div>

          <div className="wallet-card">
            <div className="wallet-top">
              <div className="wallet-title">
                <ShieldCheck size={14} className="gold-text" /> 
                Wallet Balance
              </div>
              <button className="balance-toggle" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="wallet-bottom">
              <span className="wallet-currency">K</span>
              <span className="wallet-balance">
                {loading ? "---" : (showBalance ? (Number(wallet?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})) : "••••••")}
              </span>
            </div>
          </div>

          <div className="quick-actions">
            {actions.map((action, i) => (
              <div 
                key={i} 
                className={`quick-action ${action.special ? 'action-gold' : ''}`} 
                onClick={() => navigate(action.path)} 
              >
                <div className="quick-action-icon">{action.icon}</div>
                <span className="action-label">{action.label}</span>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="dash-notifications">
              <div className="mini-header">
                <h3><Cpu size={14} /> System Directives</h3>
                <span className="notif-count-pill">{notifications.length} NEW</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="dash-notif-card" onClick={() => navigate("/notifications")}>
                  <div className="notif-card-left">
                    <div className="notif-pulse"></div>
                    <div className="notif-text-content">
                      <strong>{n.title}</strong>
                      <p>{n.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} />
                </div>
              ))}
            </div>
          )}

          <div className="mini-statement">
            <div className="mini-header">
              <h3>Bige-50 Activity</h3>
              <button className="see-all-btn" onClick={() => navigate("/statement")}>Log Archive</button>
            </div>
            <div className="tx-list">
              {loading ? (
                <div className="loading-skeleton-tx"></div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">No recorded node activity.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="tx-row">
                    <div className="tx-left">
                      <div className={`tx-icon-circle ${tx.sender_id === profile?.id ? 'out' : 'in'}`}>
                        {tx.sender_id === profile?.id ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div className="tx-info">
                        <strong>{tx.sender_id === profile?.id ? 'Liquidity Out' : 'Liquidity In'}</strong>
                        <p>{tx.recipient_bank || "AFRIBAS Node"}</p>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className={`amount ${tx.sender_id === profile?.id ? 'negative' : 'positive'}`}>
                        {tx.sender_id === profile?.id ? '-' : '+'} K{Number(tx.amount || 0).toFixed(2)}
                      </span>
                      <span className="date">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="offers-section">
            <div className="offers-header">Market Intel</div>
            <div className="offers-scroll">
              <div className="offer-card gold-gradient" onClick={() => navigate("/invest")}>
                <div className="offer-title">Econo-Plus Active</div>
                <div className="offer-text">Yield: 5.2% p.a.</div>
              </div>
              <div className="offer-card blue-gradient" onClick={() => navigate("/forum")}>
                <div className="offer-title">Global Forum</div>
                <div className="offer-text">Join the 2026 Summit.</div>
              </div>
            </div>
          </div>

          <div className="bottom-nav">
            <div className="bottom-nav-item active" onClick={() => navigate("/dashboard")}><Home size={22} /></div>
            <div className="bottom-nav-item" onClick={() => navigate("/transfer")}><RefreshCw size={22} /></div>
            <div className="bottom-nav-item" onClick={() => navigate("/afribas")}><ShieldCheck size={22} /></div>
            <div className="bottom-nav-item" onClick={() => navigate("/profile")}><User size={22} /></div>
          </div>
        </div>
      </div>
    </>
  );
}