import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { 
  ShieldAlert, Activity, Bell, Power, 
  ShieldX, Bot, Users, Landmark, Search,
  CheckCircle, RefreshCw, ArrowUpRight, 
  ArrowDownLeft, FileSpreadsheet, XCircle,
  ShieldCheck, Lock, Unlock
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./admin-management.css";

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchInitialData();

    const settingsChannel = supabase.channel('global-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings' }, (p) => {
        if (p.new.key === 'network_kill_switch') setIsKillSwitchActive(p.new.value);
      }).subscribe();

    const txChannel = supabase.channel('sentinel-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (p) => {
        handleSentinel(p.new);
        setTransactions(prev => [p.new, ...prev].slice(0, 15));
      }).subscribe();

    const userChannel = supabase.channel('user-registry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(txChannel);
      supabase.removeChannel(userChannel);
    };
  }, []);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchInitialData = async () => {
    setLoading(false);
    await Promise.all([fetchUsers(), fetchTransactions(), fetchKillSwitch()]);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) { setUsers(data); setFilteredUsers(data); }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(15);
    if (data) setTransactions(data);
  };

  const fetchKillSwitch = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'network_kill_switch').single();
    if (data) setIsKillSwitchActive(data.value);
  };

  const handleSentinel = (tx) => {
    if (parseFloat(tx.amount) >= 10000) {
      pushAlert(`CRITICAL: HIGH-VALUE TX ($${tx.amount})`, "critical");
    } else {
      pushAlert(`FLOW: ${tx.type.toUpperCase()} confirmed`, "auto");
    }
  };

  const pushAlert = (msg, mode) => {
    setAlerts(prev => [{ id: Date.now(), message: msg, mode }, ...prev].slice(0, 3));
  };

  const toggleKillSwitch = async () => {
    const newState = !isKillSwitchActive;
    await supabase.from('system_settings').update({ value: newState }).eq('key', 'network_kill_switch');
  };

  const updateUserStatus = async (userId, newStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: newStatus })
      .eq('id', userId);

    if (!error) {
      pushAlert(`SYSTEM: Node ${newStatus.toUpperCase()}`, "auto");
      setSelectedUser(null);
      fetchUsers();
    }
  };

  return (
    /* WRAPPER ADDED TO FIX DESKTOP LAYOUT */
    <div className="admin-desktop-view">
      <div className="admin-page">
        <Topbar2 title="AFRIBAS CENTRAL COMMAND" />

        <div className="admin-container">
          
          {/* EMERGENCY KILL SWITCH - FULL WIDTH */}
          <div className={`kill-switch-panel ${isKillSwitchActive ? 'active' : ''}`}>
             <div className="ks-info">
                <Power size={20} className={isKillSwitchActive ? "animate-pulse" : ""} />
                <div>
                    <h4>NETWORK BRIDGE</h4>
                    <p>{isKillSwitchActive ? "SETTLEMENTS FROZEN" : "SYSTEMS OPERATIONAL"}</p>
                </div>
             </div>
             <button className="ks-toggle" onClick={toggleKillSwitch}>
                {isKillSwitchActive ? "RESTORE BRIDGE" : "ACTIVATE KILL SWITCH"}
             </button>
          </div>

          {/* SENTINEL ALERT HUD - FULL WIDTH */}
          <div className="security-dash">
             {alerts.map(a => (
               <div key={a.id} className={`mini-alert ${a.mode}`}>
                  {a.mode === 'critical' ? <ShieldX size={10} /> : <Bot size={10} />}
                  <span>{a.message}</span>
               </div>
             ))}
          </div>

          {/* GRID WRAPPER FOR SIDE-BY-SIDE ON DESKTOP */}
          <div className="admin-main-grid">
            
            {/* NODE REGISTRY */}
            <div className="terminal-section">
              <div className="section-header">
                <h3><Users size={14}/> IDENTITY REGISTRY</h3>
                <div className="search-box">
                  <Search size={12} />
                  <input 
                    placeholder="Filter nodes..." 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                </div>
              </div>
              <div className="registry-list">
                {filteredUsers.map(user => (
                  <div key={user.id} className="reg-row" onClick={() => setSelectedUser(user)}>
                    <div className="reg-info">
                      <div className={`avatar ${user.account_status === 'locked' ? 'locked' : ''}`}>
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="email">{user.email}</p>
                        <p className="sub">{user.full_name || 'NO_NAME_PROVIDED'}</p>
                      </div>
                    </div>
                    <div className={`status-tag ${user.account_status || 'active'}`}>
                       {user.account_status || 'active'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE TRANSACTION MONITOR */}
            <div className="terminal-section">
               <div className="section-header">
                  <h3><Landmark size={14}/> LIVE FLOW MONITOR</h3>
                  <div className="ai-status"><div className="dot"></div> SENTINEL ACTIVE</div>
               </div>
               <div className="tx-monitor">
                  {transactions.length === 0 && <p className="no-tx">Scanning for network activity...</p>}
                  {transactions.map(tx => (
                    <div key={tx.id} className={`tx-stream-row ${parseFloat(tx.amount) >= 10000 ? 'high-risk' : ''}`}>
                       <div className="tx-icon">
                          {tx.type === 'withdraw' ? <ArrowUpRight size={14} color="#ef4444"/> : <ArrowDownLeft size={14} color="#10b981"/>}
                       </div>
                       <div className="tx-details">
                          <p className="tx-main">{tx.type?.toUpperCase()}</p>
                          <p className="tx-sub">{tx.sender_email || "SYSTEM_BRIDGE"}</p>
                       </div>
                       <div className="tx-amount">
                          <p className={parseFloat(tx.amount) >= 10000 ? 'risk-text' : 'pos'}>${tx.amount}</p>
                          <p className="tx-sub">{new Date(tx.created_at).toLocaleTimeString()}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* NODE CONTROL OVERLAY */}
          {selectedUser && (
            <div className="node-overlay">
               <div className="overlay-content">
                  <div className="overlay-icon">
                     {selectedUser.account_status === 'locked' ? <Lock size={24} color="#ef4444" /> : <Unlock size={24} color="#10b981" />}
                  </div>
                  <p className="label">COMMAND OVERRIDE</p>
                  <h4>{selectedUser.email}</h4>
                  <div className="overlay-btns">
                     <button className="btn-approve" onClick={() => updateUserStatus(selectedUser.id, 'active')}>
                        <ShieldCheck size={14} /> RESTORE ACCESS
                     </button>
                     <button className="btn-flag" onClick={() => updateUserStatus(selectedUser.id, 'locked')}>
                        <Lock size={14} /> QUARANTINE NODE
                     </button>
                     <button className="btn-close" onClick={() => setSelectedUser(null)}>CANCEL</button>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}