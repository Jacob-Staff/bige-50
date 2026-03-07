import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  Cpu, Lock, ArrowUpRight, ArrowDownLeft, 
  Eye, EyeOff, ShieldCheck, Info,
  ExternalLink, Fingerprint, Loader2, X, Copy, CheckCircle
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./Vault.css";

export default function Vault() {
  const navigate = useNavigate();
  const [showAssets, setShowAssets] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    fetchVaultData();
  }, []);

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error) {
        setProfile(data);
        setWalletAddress(`AFRB-${user.id.substring(0,4)}-${user.id.substring(user.id.length-4).toUpperCase()}-WESWAC`);
      }
    } catch (err) {
      console.error("Sync Error:", err.message);
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  const holdings = [
    { 
      name: "Atlantian Crown", 
      symbol: "ATC", 
      balance: profile?.balance?.toLocaleString() || "0.00", 
      valueUsd: (profile?.balance || 0) * 0.45,
      color: "#f59e0b" 
    },
    { name: "FactCoin", symbol: "FACT", balance: "0.00", valueUsd: 0, color: "#3b82f6" },
    { name: "Bitcoin", symbol: "BTC", balance: "0.00", valueUsd: 0, color: "#f97316" }
  ];

  const totalPortfolio = holdings.reduce((acc, curr) => acc + curr.valueUsd, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="vault-loading-fullscreen">
      <div className="vault-loading-content">
        <div className="spinner-relative">
          <Loader2 className="vault-spinner-icon" size={48} />
          <div className="sonar-ring"></div>
        </div>
        <p className="vault-loading-text">Synchronizing Vault</p>
        <span className="vault-loading-subtext">AFRIBAS ENCRYPTED LINK</span>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper vault-bg">
      <Topbar2 title="Institutional Vault" />

      <div className="app-content vault-scroll-fix">
        <div className="vault-inner">
          
          {/* HEADER STATUS */}
          <div className="protocol-banner">
            <div className="protocol-info">
              <Fingerprint size={14} className="text-amber-500" />
              <span>AFRIBAS COLD STORAGE v.2.0</span>
            </div>
            <button className="visibility-toggle" onClick={() => setShowAssets(!showAssets)}>
              {showAssets ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* MAIN VALUE DISPLAY */}
          <div className="vault-total-card animate-slide-up">
            <div className="vault-icon-ring">
              <Lock size={28} className="text-amber-500" />
            </div>
            <label className="card-label">Consolidated Portfolio Value</label>
            <div className="total-val">
              <span className="unit">$</span> 
              {showAssets ? totalPortfolio.toLocaleString(undefined, {minimumFractionDigits: 2}) : "••••••"}
            </div>
            <div className="vault-status-badge">
              <ShieldCheck size={12} /> Weswac Multi-Sig Active
            </div>
          </div>

          {/* ASSET LIST */}
          <div className="holdings-header">
            <h2 className="section-title text-white">Institutional Holdings</h2>
            <button className="market-link"><ExternalLink size={12} /> MARKET</button>
          </div>
          
          <div className="holdings-list">
            {holdings.map((asset) => (
              <div key={asset.symbol} className="asset-row">
                <div className="asset-left">
                  <div className="asset-icon-box" style={{ borderColor: `${asset.color}44` }}>
                    <Cpu size={18} style={{ color: asset.color }} />
                  </div>
                  <div className="asset-meta">
                    <span className="asset-name text-white">{asset.name}</span>
                    <span className="asset-symbol">{asset.symbol}</span>
                  </div>
                </div>
                <div className="asset-right">
                  <div className="asset-balance text-white">
                    {showAssets ? asset.balance : "••••"}
                  </div>
                  <div className="asset-usd">
                    $ {showAssets ? asset.valueUsd.toLocaleString() : "•••"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="vault-action-grid">
            <button className="v-btn secondary-v" onClick={() => setShowReceive(true)}>
              <ArrowDownLeft size={18} /> Receive
            </button>
            <button className="v-btn primary-v" onClick={() => navigate("/swap")}>
              <ArrowUpRight size={18} /> Swap Assets
            </button>
          </div>

          <div className="security-advisory mt-8">
            <Info size={16} className="text-slate-400" />
            <p>Vault assets are dispersed via B.I.G.E-50 security frameworks.</p>
          </div>
        </div>
      </div>

      {/* RECEIVE OVERLAY */}
      {showReceive && (
        <div className="receive-overlay animate-fade-in" onClick={() => setShowReceive(false)}>
          <div className="receive-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-white">Deposit Assets</h3>
              <button onClick={() => setShowReceive(false)} className="text-white opacity-50"><X size={24} /></button>
            </div>

            <div className="qr-container">
              <div className="qr-frame">
                <div className="qr-placeholder">
                   <Fingerprint size={80} className="text-slate-100" />
                   <div className="qr-corner tl"></div>
                   <div className="qr-corner tr"></div>
                   <div className="qr-corner bl"></div>
                   <div className="qr-corner br"></div>
                </div>
              </div>
              <p className="qr-hint uppercase text-white font-bold tracking-widest text-[10px]">AFRIBAS-200 Transfer Link</p>
            </div>

            <div className="address-box">
              <label className="text-white opacity-60">Vault Address</label>
              <div className="address-field" onClick={handleCopy}>
                <span className="address-text">{walletAddress}</span>
                {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} className="text-white opacity-30" />}
              </div>
            </div>

            <div className="warning-banner mt-6 bg-amber-500/10 border-amber-500/20">
              <ShieldCheck size={16} className="text-amber-500" />
              <p className="text-amber-500">Transfers are final. Ledger errors result in permanent loss.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}