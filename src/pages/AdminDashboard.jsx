import React, { useEffect, useState, useMemo } from "react";
import { 
  ShieldAlert, Activity, Users, Database, ChevronRight, Search, Terminal, Globe, 
  Bell, Settings, Lock, Cpu, Power, LogOut, ShieldCheck, EyeOff, Edit3, 
  CheckCircle, XCircle, AlertCircle, Fingerprint, TrendingUp, Map, ShieldX, History,
  BarChart3, PieChart, Info, Building2, RefreshCw, Key, Zap, Fuel, Landmark, FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { generateAfribasId } from "../utils/afribasUtils"; 
import "./admin-dashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState('intel');
  const [settingsTab, setSettingsTab] = useState('users'); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [operatives, setOperatives] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [auditLogs, setAuditLogs] = useState([]);
  const [treasury, setTreasury] = useState({ inflow: 0, outflow: 0, fees: 0, health: 100 });

  // VAULT & PROFIT STATES
  const [vaultBalance, setVaultBalance] = useState(0);
  const [adminId, setAdminId] = useState(null);
  const [totalProfits, setTotalProfits] = useState(0);
  const [fuelAmount, setFuelAmount] = useState(0);
  
  const [isLockdown, setIsLockdown] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false); 
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString([], { hour12: false }), msg: "SENTINEL PROTOCOL INITIALIZED", type: "system" }
  ]);
  const [stats, setStats] = useState({ liquidity: 0, activeNodes: 0, threats: "0 CRITICAL" });

  // --- INITIALIZATION & REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    fetchInitialData();
    
    // Listen for new transactions (Lenco hits the DB)
    const txSub = supabase.channel('tx-live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        addLog(`SIGNAL: Incoming Payment ${payload.new.reference_number}`, "warning");
        fetchPendingApprovals();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new.status === 'approved') {
            addLog(`SIGNAL: Payment ${payload.new.reference_number} SETTLED`, "success");
            fetchInitialData();
        }
      })
      .subscribe();

    const profileSub = supabase.channel('admin-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        fetchOperativeData(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(txSub);
    };
  }, []);

  // AUTO-APPROVAL ENGINE (Optional)
  useEffect(() => {
    if (autoApprove && pendingApprovals.length > 0) {
      const targetTx = pendingApprovals[0]; 
      handleProcessTransaction(targetTx.id, 'approved');
    }
  }, [pendingApprovals, autoApprove]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOperativeData(),
      fetchPendingApprovals(),
      fetchAuditLogs(),
      fetchSystemConfig(),
      calculateTotalRevenue()
    ]);
    setLoading(false);
  };

  const addLog = (msg, type) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [{ id: Date.now(), time, msg, type }, ...prev].slice(0, 50));
  };

  // --- CORE DATA OPERATIONS ---
  const fetchOperativeData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, wallets(balance)')
      .order('updated_at', { ascending: false });

    if (!error) {
      setOperatives(data);
      const userProfiles = data.filter(op => op.role !== 'admin');
      const adminProfile = data.find(op => op.role === 'admin');

      if (adminProfile) {
        setAdminId(adminProfile.id);
        setVaultBalance(Number(adminProfile.wallets?.balance) || 0);
      }

      const totalLiq = userProfiles.reduce((sum, op) => sum + (Number(op.wallets?.balance) || 0), 0);
      setStats({
        liquidity: totalLiq,
        activeNodes: userProfiles.length,
        threats: userProfiles.filter(op => (op.risk_index || 0) > 80 || op.is_quarantined).length + " CRITICAL"
      });
    }
  };

  const calculateTotalRevenue = async () => {
    const { data } = await supabase.from('transactions').select('amount').eq('status', 'approved').eq('type', 'deposit');
    if (data) {
      const total = data.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      setTotalProfits(total);
    }
  };

  const fetchPendingApprovals = async () => {
    const { data } = await supabase.from('transactions').select('*, profiles(full_name, afribas_id)').eq('status', 'pending');
    if (data) setPendingApprovals(data);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase.from('system_audit').select('*').order('created_at', { ascending: false }).limit(30);
    if (data) setAuditLogs(data);
  };

  const fetchSystemConfig = async () => {
    const { data } = await supabase.from('system_config').select('*').eq('id', 'global_status').maybeSingle();
    if (data) setIsLockdown(data.is_lockdown);
  };

  // --- UPDATED: TRANSACTION PROCESSING & PROFIT SWEEP ---
  const handleProcessTransaction = async (txId, decision) => {
    try {
      // 1. Get the transaction details
      const { data: txData } = await supabase.from('transactions').select('*, profiles(full_name, membership_tier)').eq('id', txId).single();

      // 2. If it's a membership deposit being approved
      if (decision === 'approved') {
        const amount = Number(txData.amount);

        // A: Update the Admin Vault (Profit Sweep)
        await supabase.rpc('increment_wallet_balance', { 
          user_id_input: adminId, 
          amount_input: amount 
        });

        // B: If it's for a tier upgrade, update the user profile
        if (amount >= 250) {
            await supabase.from('profiles').update({ membership_tier: 'PREMIUM' }).eq('id', txData.user_id);
            addLog(`UPGRADE: ${txData.profiles.full_name} promoted to PREMIUM`, "success");
        }
      }

      // 3. Update transaction status
      const { error } = await supabase.from('transactions').update({ status: decision.toLowerCase() }).eq('id', txId);

      if (error) throw error;

      addLog(`SETTLEMENT: ${decision.toUpperCase()} - K${txData.amount}`, decision === 'approved' ? "success" : "danger");
      fetchInitialData();

    } catch (err) { 
        console.error("Critical error:", err); 
        addLog("SETTLEMENT_ERROR: Check Database Logs", "danger");
    }
  };

  // --- LIQUIDITY INJECTION ---
  const handleFuelTransfer = async () => {
    if (!selectedUser || fuelAmount <= 0 || vaultBalance < fuelAmount) {
      addLog("VAULT ERROR: Insufficient Gas or No Node Selected", "danger");
      return;
    }
    try {
      await supabase.rpc('decrement_wallet_balance', { user_id_input: adminId, amount_input: Number(fuelAmount) });
      await supabase.rpc('increment_wallet_balance', { user_id_input: selectedUser.id, amount_input: Number(fuelAmount) });
      
      await logAction('VAULT_INJECTION', selectedUser.id, `Injected K${fuelAmount} into node.`);
      addLog(`FUEL INJECTED: K${fuelAmount} -> ${selectedUser.full_name}`, "success");
      setFuelAmount(0);
      fetchInitialData();
    } catch (err) { addLog("VAULT_FAILURE", "danger"); }
  };

  const sealIdentity = async (user) => {
    const newId = generateAfribasId("ZM");
    const { error } = await supabase.from('profiles').update({ afribas_id: newId }).eq('id', user.id);
    if (!error) {
      await logAction('IDENTITY_SEAL', user.id, `Generated ID: ${newId}`);
      addLog(`IDENTITY SEALED: ${user.full_name} -> ${newId}`, "success");
      fetchOperativeData();
    }
  };

  const logAction = async (type, target, desc) => {
    await supabase.from('system_audit').insert([{ action_type: type, target_user_id: target, description: desc }]);
    fetchAuditLogs();
  };

  const toggleQuarantine = async (user) => {
    const newState = !user.is_quarantined;
    const { error } = await supabase.from('profiles').update({ is_quarantined: newState }).eq('id', user.id);
    if (!error) {
      await logAction('SECURITY', user.id, `Node ${newState ? 'Quarantined' : 'Restored'}`);
      addLog(`PROTOCOL: ${user.full_name} is now ${newState ? 'RESTRICTED' : 'SECURE'}`, "warning");
      fetchOperativeData();
    }
  };

  const toggleLockdown = async () => {
    const newState = !isLockdown;
    const { error } = await supabase.from('system_config').update({ is_lockdown: newState }).eq('id', 'global_status');
    if (!error) {
      setIsLockdown(newState);
      addLog(`MASTER ALERT: GLOBAL LOCKDOWN ${newState ? 'ENGAGED' : 'LIFTED'}`, newState ? "danger" : "success");
    }
  };

  const generateRevenueReport = () => {
      addLog("REPORT: Monthly Revenue summary generated.", "success");
  };

  const filteredOperatives = useMemo(() => {
    return operatives.filter(op => op.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) && op.role !== 'admin');
  }, [searchQuery, operatives]);

  return (
    <div className={`admin-desktop-root ${isLockdown ? 'lockdown-active' : ''}`}>
      <aside className="command-rail">
        <div className="rail-logo"><Lock size={22} color={isLockdown ? "#ef4444" : "#f59e0b"} /></div>
        <nav className="rail-links">
          <div className={`rail-item ${activeView === 'intel' ? 'active' : ''}`} onClick={() => setActiveView('intel')}><Globe size={20} /></div>
          <div className={`rail-item ${activeView === 'vault' ? 'active' : ''}`} onClick={() => setActiveView('vault')} title="Company Vault"><Fuel size={20} /></div>
          <div className={`rail-item ${activeView === 'afribas' ? 'active' : ''}`} onClick={() => setActiveView('afribas')}><Building2 size={20} /></div>
          <div className={`rail-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}><Settings size={20} /></div>
          <div className={`rail-item ${activeView === 'logs' ? 'active' : ''}`} onClick={() => setActiveView('logs')}><Database size={20} /></div>
        </nav>
        <div className="rail-settings" onClick={() => navigate("/login")}><LogOut size={20} color="#ef4444" /></div>
      </aside>

      <section className="intel-hub">
        <header className="hub-header">
          <div className="header-left">
            <h1>INSTITUTIONAL {activeView.toUpperCase()}</h1>
            <p className="dim">AFRIBAS CENTRAL CORE // VAULT: K{vaultBalance.toLocaleString()}</p>
          </div>
          <div className="header-right">
             <button className="refresh-btn" onClick={fetchInitialData}><RefreshCw size={14} /> SYNC</button>
             <div className="cpu-stat"><Landmark size={14} /><span>RESERVE_STABLE</span></div>
          </div>
        </header>

        {activeView === 'intel' && (
          <div className="intel-grid">
            <div className="stats-row">
              <div className="intel-card stat-box highlight">
                <label>USER LIABILITIES</label>
                <div className="value">K {stats.liquidity.toLocaleString()}</div>
                <TrendingUp size={14} color="#22c55e" />
              </div>
              <div className="intel-card stat-box profit-box">
                <label>TOTAL REVENUE</label>
                <div className="value" style={{color: '#22c55e'}}>K {totalProfits.toLocaleString()}</div>
                <BarChart3 size={14} color="#22c55e" />
              </div>
              <div className={`intel-card stat-box ${autoApprove ? 'success-glow' : ''}`} onClick={() => setAutoApprove(!autoApprove)} style={{cursor: 'pointer'}}>
                <label>AUTO-SETTLEMENT</label>
                <div className="value" style={{color: autoApprove ? '#22c55e' : '#64748b'}}>{autoApprove ? "ACTIVE" : "OFF"}</div>
                <Zap size={14} color={autoApprove ? "#22c55e" : "#64748b"} />
              </div>
            </div>

            <div className="analytics-row">
              <div className="intel-card terminal-pane" style={{gridColumn: 'span 2'}}>
                <div className="terminal-header"><Activity size={14} /><span>REAL-TIME SYSTEM PULSE</span></div>
                <div className="terminal-body">
                  {logs.map(log => (
                    <div key={log.id} className={`log-entry ${log.type}`}><span className="log-time">[{log.time}]</span> {log.msg}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'vault' && (
          <div className="vault-interface">
            <div className="stats-row">
              <div className="intel-card stat-box vault-box">
                <label>COMPANY GAS TANK (RESERVE)</label>
                <div className="value" style={{color: '#f59e0b'}}>K {vaultBalance.toLocaleString()}</div>
                <Fuel size={24} color="#f59e0b" />
              </div>
              <div className="intel-card stat-box">
                <label>TOTAL REVENUE</label>
                <div className="value">K {totalProfits.toLocaleString()}</div>
                <button className="mini-report-btn" onClick={generateRevenueReport}><FileText size={12}/> REPORT</button>
              </div>
            </div>

            <div className="intel-card fuel-panel">
               <div className="terminal-header"><Zap size={14}/><span>MANUAL LIQUIDITY INJECTION</span></div>
               <div className="fuel-form">
                  <p className="dim">Target Node: {selectedUser ? selectedUser.full_name : "SELECT A NODE ON THE RIGHT"}</p>
                  <div className="input-group">
                    <label>Injection Amount (K)</label>
                    <input type="number" value={fuelAmount} onChange={(e) => setFuelAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <button className="btn-glow" onClick={handleFuelTransfer} disabled={!selectedUser} style={{width: '100%', marginTop: '1rem'}}>
                    INJECT FUNDS FROM VAULT
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeView === 'afribas' && (
          <div className="intel-card table-view full-height">
            <div className="terminal-header"><Fingerprint size={14} /><span>CONTINENTAL IDENTITY REGISTRY</span></div>
            <div className="terminal-body scrollable">
                <table className="admin-data-table">
                  <thead><tr><th>OPERATIVE</th><th>AFRIBAS ID</th><th>BALANCE</th><th>RISK</th><th>ACTION</th></tr></thead>
                  <tbody>
                    {operatives.filter(op => op.role !== 'admin').map(op => (
                      <tr key={op.id}>
                        <td>{op.full_name}</td>
                        <td className="mono">{op.afribas_id || 'PENDING_SEAL'}</td>
                        <td className="text-success">K {op.wallets?.balance?.toLocaleString()}</td>
                        <td><div className={`risk-bar rank-${Math.ceil((op.risk_index || 0)/20)}`}></div></td>
                        <td>
                          {!op.afribas_id ? (
                            <button className="seal-btn" onClick={() => sealIdentity(op)}><Key size={14}/> SEAL ID</button>
                          ) : ( <span className="badge success">VERIFIED</span> )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="settings-container">
            <nav className="settings-nav">
              <button className={settingsTab === 'approvals' ? 'active' : ''} onClick={() => setSettingsTab('approvals')}>Approvals ({pendingApprovals.length})</button>
              <button className={settingsTab === 'users' ? 'active' : ''} onClick={() => setSettingsTab('users')}>Management</button>
              <button className={settingsTab === 'security' ? 'active' : ''} onClick={() => setSettingsTab('security')}>Security</button>
            </nav>

            <div className="settings-content">
              {settingsTab === 'approvals' && (
                <div className="intel-card table-view">
                   <table className="admin-data-table">
                     <thead><tr><th>SOURCE NODE</th><th>AMOUNT</th><th>TIER</th><th>AUTH</th></tr></thead>
                     <tbody>
                       {pendingApprovals.map(tx => (
                         <tr key={tx.id}>
                           <td>{tx.profiles?.full_name}</td>
                           <td className="text-warning">K {tx.amount}</td>
                           <td className="mono">{tx.amount >= 250 ? 'PREMIUM' : 'STANDARD'}</td>
                           <td className="actions-cell">
                             <button className="approve-btn" onClick={() => handleProcessTransaction(tx.id, 'approved')}><CheckCircle size={18} /></button>
                             <button className="reject-btn" onClick={() => handleProcessTransaction(tx.id, 'rejected')}><XCircle size={18} /></button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              )}

              {settingsTab === 'users' && selectedUser && (
                <div className="intel-card edit-panel">
                   <h3>Node Override: {selectedUser.full_name}</h3>
                   <div className="form-grid">
                      <div className="input-group">
                        <label>Institutional Risk Score</label>
                        <input type="number" value={selectedUser.risk_index} onChange={(e) => setSelectedUser({...selectedUser, risk_index: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label>Liquidity Adjustment (K)</label>
                        <input type="number" value={selectedUser.wallets?.balance} onChange={(e) => setSelectedUser({...selectedUser, wallets: {balance: e.target.value}})} />
                      </div>
                   </div>
                   <div className="form-actions">
                      <button className="btn-quarantine" onClick={() => toggleQuarantine(selectedUser)}>
                        {selectedUser.is_quarantined ? "Restore Node" : "Quarantine Node"}
                      </button>
                      <button className="btn-glow" onClick={async () => {
                        await supabase.from('profiles').update({risk_index: selectedUser.risk_index}).eq('id', selectedUser.id);
                        await supabase.from('wallets').update({balance: selectedUser.wallets.balance}).eq('user_id', selectedUser.id);
                        addLog("COMMIT: Node data modified manually", "info");
                        fetchOperativeData();
                      }}>Update Database</button>
                   </div>
                </div>
              )}

              {settingsTab === 'security' && (
                <div className="security-panel">
                  <div className={`lockdown-card ${isLockdown ? 'active' : ''}`}>
                    <ShieldAlert size={40} />
                    <h2>Master Settlement Lockdown</h2>
                    <button onClick={toggleLockdown}>{isLockdown ? "RELEASE SYSTEM" : "ENGAGE LOCKDOWN"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'logs' && (
          <div className="intel-card terminal-pane full-height">
            <div className="terminal-header"><span>SECURE AUDIT ARCHIVE</span></div>
            <div className="terminal-body scrollable">
              {auditLogs.map(log => (
                <div key={log.id} className="log-entry system">
                  <span className="log-time">[{new Date(log.created_at).toLocaleString()}]</span>
                  <strong>{log.action_type}</strong>: {log.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="surveillance-list">
        <div className="search-bar">
          <Search size={14} />
          <input type="text" placeholder="Trace Node..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="operative-scroll">
          {filteredOperatives.map(op => (
            <div key={op.id} className={`op-item ${op.is_quarantined ? 'quarantined' : ''} ${selectedUser?.id === op.id ? 'active' : ''}`} onClick={() => setSelectedUser(op)}>
              <div className="op-avatar">{op.full_name?.charAt(0)}</div>
              <div className="op-info">
                <div className="op-name">{op.full_name}</div>
                <div className="op-status">K {op.wallets?.balance?.toLocaleString()}</div>
              </div>
              <ChevronRight size={14} />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}