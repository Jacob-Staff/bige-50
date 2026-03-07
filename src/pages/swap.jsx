import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ArrowDown, ShieldCheck, Info, ChevronDown, CheckCircle2, 
  Coins, Landmark, Loader2, Receipt, AlertTriangle, 
  Activity, Fingerprint, Zap
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./swap.css";

export default function Swap() {
  const navigate = useNavigate();
  const [fromAmount, setFromAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState(0); // 0: Idle, 1: Handshake, 2: Finalizing
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [priceImpact, setPriceImpact] = useState(0.02); // Simulated real-world impact

  // Approved Institutional Digital Assets
  const assets = [
    { name: "Atlantian Crown", symbol: "ATC", rate: 0.45, color: "#af641e", network: "WESWAC" },
    { name: "FactCoin", symbol: "FACT", rate: 1.25, color: "#1e40af", network: "AFRIBAS" },
    { name: "Digital Bitcoin", symbol: "BTC", rate: 0.0000012, color: "#f59e0b", network: "BIGE-CORE" }
  ];

  const [targetAsset, setTargetAsset] = useState(assets[0]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(data);
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    const amount = parseFloat(fromAmount);
    
    if (amount > userProfile?.wallet_balance) {
      return alert("Insufficient Settlement Balance");
    }
    
    setLoading(true);
    setAuthStep(1); // Begin Handshake

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Simulate Institutional Ledger Handshake
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAuthStep(2); // Finalizing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. Update Ledger Balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: userProfile.wallet_balance - amount })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Insert Transaction into Audit Log
      await supabase.from('bridge_transactions').insert({
        sender_id: user.id,
        amount: amount,
        recipient_bank: `ASSET_SWAP_${targetAsset.symbol}`,
        reference_number: `SWP-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
        status: 'settled'
      });

      // 3. System Notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: "Swap Executed",
        description: `Protocol successfully swapped K${amount} for ${targetAsset.symbol}.`,
        is_read: false
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Ledger Error:", err.message);
      setAuthStep(0);
      alert("AFRIBAS Node Reject: Liquidity Timeout");
    } finally {
      setLoading(false);
    }
  };

  const selectAsset = (asset) => {
    setTargetAsset(asset);
    setShowDropdown(false);
    setPriceImpact((Math.random() * 0.05).toFixed(3)); // Simulate dynamic price impact
  };

  if (isSuccess) {
    return (
      <div className="app-wrapper swap-page success-view">
        <div className="success-card animate-slide-up">
          <div className="status-header">
            <ShieldCheck size={18} className="text-amber-600" />
            <span>LEDGER VERIFIED</span>
          </div>
          
          <div className="check-ring">
             <CheckCircle2 size={64} color="#af641e" className="animate-pulse" />
          </div>

          <h2 className="success-title">Asset Settled</h2>
          <p className="success-subtitle">Conversion Recorded on Global Bridge</p>
          
          <div className="receipt-box">
            <div className="receipt-row">
              <span>Network Node</span>
              <span className="text-mono">AFR-ZAM-772</span>
            </div>
            <div className="receipt-row">
              <span>Settled Amount</span>
              <span className="font-bold text-white">K {parseFloat(fromAmount).toLocaleString()}</span>
            </div>
            <div className="receipt-row">
              <span>Asset Received</span>
              <span className="text-amber-500 font-bold">{(fromAmount * targetAsset.rate).toLocaleString()} {targetAsset.symbol}</span>
            </div>
            <div className="receipt-row">
              <span>Slippage Used</span>
              <span>0.1%</span>
            </div>
          </div>

          <button className="home-btn" onClick={() => navigate("/dashboard")}>
            Finalize & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper swap-bg">
      <Topbar2 title="Institutional Swap" onBack={() => navigate(-1)} />
      
      <div className="app-content swap-content">
        {/* Real-time Market Ticker */}
        <div className="market-ticker">
          <Activity size={12} className="text-emerald-500" />
          <span>LIVE MARKET: {targetAsset.symbol}/ZMW - STABLE</span>
          <div className="pulse-dot"></div>
        </div>

        <form className="swap-form-box" onSubmit={handleSwap}>
          {/* SOURCE FIELD */}
          <div className="swap-field main-field">
            <div className="field-top">
              <label>Source: BIGE Ledger</label>
              <div className="wallet-info">
                <Landmark size={12} />
                <span>K {userProfile?.wallet_balance?.toLocaleString()}</span>
              </div>
            </div>
            <div className="field-input-row">
              <input 
                type="number" 
                placeholder="0.00" 
                value={fromAmount} 
                onChange={(e) => setFromAmount(e.target.value)} 
                required 
              />
              <button type="button" className="max-btn" onClick={() => setFromAmount(userProfile?.wallet_balance)}>MAX</button>
            </div>
          </div>

          <div className="swap-divider">
            <div className="divider-glow"></div>
            <div className="swap-circle-btn">
              <ArrowDown size={20} />
            </div>
          </div>

          {/* TARGET FIELD */}
          <div className="swap-field target-field">
            <div className="field-top">
              <label>Target Asset: {targetAsset.network}</label>
              <span className="rate-badge">1: {targetAsset.rate}</span>
            </div>
            <div className="field-input-row">
              <input 
                type="text" 
                readOnly 
                value={fromAmount ? (fromAmount * targetAsset.rate).toLocaleString() : "0.00"} 
              />
              
              <div className="dropdown-container">
                <button type="button" className="asset-picker" onClick={() => setShowDropdown(!showDropdown)}>
                   <div className="picker-dot" style={{background: targetAsset.color}}></div>
                   {targetAsset.symbol} <ChevronDown size={14} />
                </button>

                {showDropdown && (
                  <div className="asset-menu">
                    {assets.map((asset) => (
                      <div key={asset.symbol} className="menu-item" onClick={() => selectAsset(asset)}>
                        <div className="item-meta">
                          <span className="symbol-bold">{asset.symbol}</span>
                          <span className="name-dim">{asset.name}</span>
                        </div>
                        <span className="rate-pill">x{asset.rate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC SWAP DETAILS */}
          <div className="swap-audit-box">
            <div className="audit-line">
              <span>Price Impact</span>
              <span className={priceImpact > 0.04 ? "text-red-500" : "text-emerald-500"}>{priceImpact}%</span>
            </div>
            <div className="audit-line">
              <span>Liquidity Provider</span>
              <span>AFRIBAS-VAULT-01</span>
            </div>
            <div className="audit-line">
              <span>Protocol Fee</span>
              <span>0.00 ZMW</span>
            </div>
          </div>

          <button 
            type="submit" 
            className={`swap-action-btn ${authStep > 0 ? 'processing' : ''}`} 
            disabled={loading || !fromAmount || fromAmount <= 0}
          >
            {authStep === 0 && <><Zap size={18} /> Initiate Asset Swap</>}
            {authStep === 1 && <><Fingerprint className="animate-pulse" /> Handshaking Ledger...</>}
            {authStep === 2 && <><Loader2 className="spin" /> Verifying Liquidity...</>}
          </button>
        </form>

        <div className="compliance-shield">
          <ShieldCheck size={18} className="text-slate-500" />
          <p>Locked via AES-256 Quantum Encryption. Bridge status: <strong>Online</strong></p>
        </div>
      </div>
    </div>
  );
}