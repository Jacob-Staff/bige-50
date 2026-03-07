import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ArrowUpCircle, Lock, History, ShieldCheck, Zap, 
  Loader2, ChevronRight, TrendingUp, Landmark, 
  PieChart, Activity, RefreshCw, AlertCircle
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./econoplus.css";

export default function EconoPlus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLoanInfo, setShowLoanInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loanStatus, setLoanStatus] = useState("idle"); // idle, checking, ready, authorizing
  
  const [wealth, setWealth] = useState({
    investedAmount: 0,
    interestEarned: 0,
    annualYield: 0,
    nextPayout: "...",
    yieldProgress: 0,
    tier: "Standard",
    dailyRate: 0,
    activeDebt: 0 // Track institutional liability
  });

  const fetchWealthData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile for Balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance, created_at, id')
        .eq('id', user.id)
        .single();

      // 2. Fetch Total Loans (Debt) from Transactions
      const { data: loans } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'loan');

      const totalDebt = loans?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // Tier Logic based on balance
      let yieldRate = 0.05; 
      let tierName = "Standard Member";
      
      if (profile?.wallet_balance > 500000) {
        yieldRate = 0.085; 
        tierName = "Platinum Institutional";
      } else if (profile?.wallet_balance > 100000) {
        yieldRate = 0.065; 
        tierName = "Gold Tier";
      }

      // Calculation: Managed Capital is 85% of Net Equity (Balance - Debt)
      const currentBalance = profile?.wallet_balance || 0;
      const netEquity = Math.max(0, currentBalance - totalDebt); 
      const staked = netEquity * 0.85;
      
      const dailyRate = (staked * yieldRate) / 365;
      const daysSinceJoining = Math.max(1, Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)));
      const totalEarned = dailyRate * daysSinceJoining;

      setWealth({
        investedAmount: staked,
        interestEarned: totalEarned,
        annualYield: (yieldRate * 100).toFixed(2) + "%",
        nextPayout: getNextPayoutDate(),
        yieldProgress: calculateCycleProgress(),
        tier: tierName,
        dailyRate: dailyRate,
        activeDebt: totalDebt
      });
    } catch (err) {
      console.error("Wealth Sync Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWealthData();
    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        fetchWealthData(true);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const getNextPayoutDate = () => {
    const d = new Date();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-ZM', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateCycleProgress = () => {
    return Math.floor((new Date().getDate() / 30) * 100);
  };

  const handleLoanTrigger = () => {
    setLoanStatus("checking");
    setTimeout(() => {
      setShowLoanInfo(true);
      setLoanStatus("ready");
    }, 1200);
  };

  const initiateFundingRequest = () => {
    setLoanStatus("authorizing");
    setTimeout(() => {
      navigate("/loan-application", { 
        state: { 
          limit: wealth.investedAmount * 0.65,
          tier: wealth.tier 
        } 
      });
    }, 1500);
  };

  if (loading) return (
    <div className="vault-loading-fullscreen">
      <div className="loader-content">
        <Loader2 className="spin text-amber-500" size={48} />
        <h3>WESWAC LEDGER</h3>
        <p>Synchronizing Asset Portfolio...</p>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper econo-bg">
      <Topbar2 title="Institutional Vault" />
      
      <div className="econo-status-bar">
        <div className="status-left">
          <Activity size={12} className="text-emerald-500 animate-pulse" />
          <span>PORTFOLIO STATUS: <strong className="text-emerald-400">ACTIVE</strong></span>
        </div>
        <div className="status-right">
          <span>{wealth.tier}</span>
          {isRefreshing && <RefreshCw size={10} className="spin ml-2 text-amber-500" />}
        </div>
      </div>

      <div className="app-content econo-scroll-fix">
        <div className="econo-inner-container">
          
          <div className="investment-card-premium animate-slide-up">
            <div className="premium-glare"></div>
            <div className="card-top">
              <div className="badge-gold-filled">
                <ShieldCheck size={12} /> B.I.G.E-50 PROTECTED
              </div>
              <div className="yield-pill">{wealth.annualYield} APY</div>
            </div>
            
            <div className="total-value-section">
              <label className="staked-label">Managed Settlement Capital</label>
              <div className="value-row">
                <span className="currency-symbol">K</span>
                <span className="main-amount">
                  {wealth.investedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              <div className="growth-indicator">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>+K {wealth.dailyRate.toFixed(2)} / Daily Accrual</span>
              </div>
            </div>

            <div className="cycle-progress-box">
              <div className="progress-text">
                <span>Monthly Yield Cycle</span>
                <span>{wealth.yieldProgress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-fill-animated" style={{width: `${wealth.yieldProgress}%`}}></div>
              </div>
            </div>
          </div>

          <div className="wealth-stats-grid">
            <div className="w-stat-box-glass">
              <div className="w-stat-header">
                <PieChart size={14} className="text-emerald-500" />
                <label>Total Growth</label>
              </div>
              <div className="w-stat-value text-emerald-400">
                K {wealth.interestEarned.toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
            </div>
            
            {/* NEW STAT BOX: ACTIVE DEBT */}
            <div className="w-stat-box-glass">
              <div className="w-stat-header">
                <AlertCircle size={14} className="text-red-500" />
                <label>Institutional Debt</label>
              </div>
              <div className="w-stat-value text-red-400">
                K {wealth.activeDebt.toLocaleString()}
              </div>
            </div>
          </div>

          <h2 className="econo-section-label">Institutional Services</h2>
          
          <div className="econo-action-list">
            <div className="econo-action-item highlight-action" onClick={() => navigate("/transfer")}>
              <div className="action-circle-gradient">
                <ArrowUpCircle size={22} color="#fff" />
              </div>
              <div className="action-text">
                <h3>Increase Stake</h3>
                <p>Transfer reserves to managed growth pool.</p>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </div>

            <div 
              className={`econo-action-item ${showLoanInfo ? 'active-loan' : ''}`} 
              onClick={loanStatus === "idle" ? handleLoanTrigger : () => setShowLoanInfo(!showLoanInfo)}
            >
              <div className="action-circle-dark">
                {(loanStatus === "checking" || loanStatus === "authorizing") ? 
                  <Loader2 size={22} className="spin text-amber-500" /> : 
                  <Zap size={22} color="#f59e0b" />
                }
              </div>
              <div className="action-text">
                <h3>Liquidity Loan Terminal</h3>
                <p>Access instant credit against portfolio equity.</p>
              </div>
              <ChevronRight size={16} className={`text-slate-600 transition-transform ${showLoanInfo ? 'rotate-90' : ''}`} />
            </div>

            {showLoanInfo && (
              <div className="loan-terminal-panel animate-scale-up">
                <div className="terminal-header">
                  <Landmark size={14} /> WESWAC CREDIT ENGINE v2.0
                </div>
                <div className="terminal-grid">
                   <div className="t-stat">
                      <label>Borrow Capacity</label>
                      <span className="text-white">K {(wealth.investedAmount * 0.65).toLocaleString()}</span>
                   </div>
                   <div className="t-stat">
                      <label>Monthly Rate</label>
                      <span className="text-amber-500">1.2%</span>
                   </div>
                </div>
                
                <button 
                  className={`apply-loan-btn-gold ${loanStatus === "authorizing" ? "opacity-70" : ""}`} 
                  onClick={initiateFundingRequest}
                  disabled={loanStatus === "authorizing"}
                >
                  {loanStatus === "authorizing" ? (
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 size={14} className="spin" /> 
                      INITIALIZING...
                    </div>
                  ) : "Initiate Funding Request"}
                </button>
              </div>
            )}
          </div>

          <div className="wealth-audit-preview">
             <div className="audit-header">
                <span>PORTFOLIO AUDIT LOG</span>
                <span className="live-tag">REAL-TIME</span>
             </div>
             <div className="audit-row">
                <div className="audit-dot"></div>
                <div className="audit-info">Automated Yield Compounding</div>
                <div className="audit-time">Live</div>
                <div className="audit-plus">+ K{(wealth.dailyRate / 1440).toFixed(4)}</div>
             </div>
          </div>

          <div className="econo-compliance-footer">
            <div className="comp-header">
              <Lock size={12} /> 
              <span>SECURED BY AFRIBAS PROTOCOL</span>
            </div>
            <p>
              Managed funds are legally isolated and protected by the Institutional Guarantee. 
              Returns are calculated based on the BIGE-50 global performance benchmark.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}