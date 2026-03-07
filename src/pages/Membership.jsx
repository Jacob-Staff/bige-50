import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import Topbar from "../components/Topbar";
import Drawer from "../components/Drawer";
import {
  CheckCircle,
  Star,
  Shield,
  CreditCard,
  Crown,
  Loader2,
  ChevronRight,
  Zap
} from "lucide-react";
import "./Membership.css";

export default function Membership() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false); 
  const [membership, setMembership] = useState({ type: "STANDARD" });

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setMembership({ type: data.membership_tier || "STANDARD" });
        }
      } catch (err) {
        console.error("Membership fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [navigate]);

  /** * UPDATED: The Lenco Handshake
   * We are now treating this as a "Collection" request.
   */
  const handleUpgrade = async (tierName, price) => {
    if (upgrading) return;
    
    // Safety Check: Confirm with the user first
    const confirmPay = window.confirm(`Initiate Protocol Upgrade to ${tierName} for K${price}?`);
    if (!confirmPay) return;

    try {
      setUpgrading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Fetch user profile for the phone number
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('phone_number, full_name')
        .eq('id', user.id)
        .single();

      if (profError || !profile?.phone_number) {
        alert("PROFILE ERROR: Please ensure your phone number is saved in settings before upgrading.");
        setUpgrading(false);
        return;
      }

      // 2. Invoke the Supabase Edge Function (The Bridge)
const { data, error } = await supabase.functions.invoke('lenco-pay', {
  body: { 
    amount: 250, 
    userEmail: user.email, 
    userId: user.id,
    phone: profile.phone_number // Ensure this is 09... or 260...
  } 
});

      if (error) throw error;

      // 3. Handle the response from Lenco
      if (data.status === true) {
        alert(`SIGNAL SENT: Please check your phone for the PIN prompt to authorize K${price}.`);
      } else {
        throw new Error(data.message || "Gateway rejected the request.");
      }
      
    } catch (err) {
      console.error("Upgrade trigger error:", err);
      alert(`PROTOCOL ERROR: ${err.message || "Could not connect to gateway."}`);
    } finally {
      setUpgrading(false);
    }
  };

  // ... (Rest of your JSX remains the same)
  if (loading) return (
    <div className="profile-loader">
      <Loader2 className="animate-spin" size={40} color="#f59e0b" />
      <p className="loader-text">SYNCING TIERS...</p>
    </div>
  );

  return (
    <>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="app-wrapper navy-bg">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />

        <main className="vault-container">
          <div className="membership-hero-vault">
            <div className="crown-glow">
              <Crown size={32} color="#f59e0b" />
            </div>
            <h2 className="page-title">Institutional Tier</h2>
            <p className="vault-status-text">
              PROTOCOL ACCESS: <span className="amber-glow">{membership.type}</span>
            </p>
          </div>

          <div className="membership-list">
            {/* LEVEL 1: STANDARD */}
            <div className={`membership-card ${membership.type === 'STANDARD' ? 'active' : ''}`}>
              <div className="membership-header">
                <div className="header-left">
                  <Star size={18} className="tier-icon" />
                  <h3>Level 01: Standard</h3>
                </div>
                {membership.type === 'STANDARD' && <span className="current-badge">ACTIVE</span>}
              </div>
              <ul className="membership-benefits">
                <li><Zap size={14} /> Settlement Limit: K10,000</li>
                <li><Zap size={14} /> Standard Node Access</li>
              </ul>
            </div>

            {/* LEVEL 2: PREMIUM */}
            <div className={`membership-card premium-glow ${membership.type === 'PREMIUM' ? 'active' : ''}`}>
              <div className="membership-header">
                <div className="header-left">
                  <Shield size={18} className="tier-icon amber" />
                  <h3 className="amber">Level 02: Premium</h3>
                </div>
                {membership.type === 'PREMIUM' && <span className="current-badge">ACTIVE</span>}
              </div>
              <ul className="membership-benefits">
                <li><CheckCircle size={14} /> Settlement Limit: K100,000</li>
                <li><CheckCircle size={14} /> Priority Block Validation</li>
                <li><CheckCircle size={14} /> 1% Protocol Rebate</li>
              </ul>
              {membership.type !== 'PREMIUM' && (
                <button 
                  className="upgrade-btn" 
                  disabled={upgrading}
                  onClick={() => handleUpgrade("PREMIUM", 250)}
                >
                  {upgrading ? (
                    <><Loader2 className="animate-spin" size={16} /> Connecting...</>
                  ) : (
                    <>Upgrade Clearance (K250) <ChevronRight size={16} /></>
                  )}
                </button>
              )}
            </div>

            {/* LEVEL 3: BUSINESS */}
            <div className={`membership-card ${membership.type === 'BUSINESS' ? 'active' : ''}`}>
              <div className="membership-header">
                <div className="header-left">
                  <CreditCard size={18} className="tier-icon" />
                  <h3>Level 03: Business</h3>
                </div>
                {membership.type === 'BUSINESS' && <span className="current-badge">ACTIVE</span>}
              </div>
              <ul className="membership-benefits">
                <li><CheckCircle size={14} /> Unlimited Settlement</li>
                <li><CheckCircle size={14} /> Full API Ledger Access</li>
              </ul>
              <button className="contact-btn">Contact Protocol Admin</button>
            </div>
          </div>
          
          <div className="system-footer">
            <p>BIGE-50 PROTOCOL v4.0.2</p>
          </div>
        </main>
      </div>
    </>
  );
}