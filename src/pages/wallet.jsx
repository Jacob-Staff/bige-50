import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  ArrowDownToLine,
  CreditCard,
  Phone,
  ShoppingCart,
  FileText,
  Loader2,
  Copy
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Topbar2 from "../components/Topbar2";
import "./wallet.css";

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('wallet_balance, id, full_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setBalance(data.wallet_balance);
        setProfile(data);
      } catch (err) {
        console.error("Wallet Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [navigate]);

  const copyWalletId = () => {
    const walletId = `BG-${profile?.id.slice(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(walletId);
    alert("Wallet ID copied to clipboard!");
  };

  return (
    <div className="wallet-page">
      <Topbar2 title="Bridge Wallet" />

      {/* BALANCE CARD */}
      <div className="wallet-card balance-card">
        <div className="balance-label">Available Balance</div>
        {loading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <div className="balance-amount">K {balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        )}
        <div className="wallet-id-row" onClick={copyWalletId}>
          <span>Wallet ID: BG-{profile?.id.slice(0, 8).toUpperCase() || "XXXX"}</span>
          <Copy size={12} />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="wallet-section">
        <div className="section-title">Money Movement</div>
        <div className="action-grid">
          <ActionItem
            icon={<Send size={18} />}
            label="Transfer"
            onClick={() => navigate("/transfer")}
          />
          <ActionItem
            icon={<ArrowDownToLine size={18} />}
            label="Withdraw"
            onClick={() => navigate("/withdraw")}
          />
          <ActionItem
            icon={<CreditCard size={18} />}
            label="Merchant Pay"
            onClick={() => navigate("/pay")}
          />
        </div>
      </div>

      {/* SERVICES */}
      <div className="wallet-section">
        <div className="section-title">Lifestyle Services</div>
        <div className="action-grid">
          <ActionItem
            icon={<Phone size={18} />}
            label="Airtime"
            onClick={() => navigate("/airtime")}
          />
          <ActionItem
            icon={<ShoppingCart size={18} />}
            label="Utility Bills"
            onClick={() => navigate("/bills")}
          />
          <ActionItem
            icon={<FileText size={18} />}
            label="Overdraft"
            onClick={() => navigate("/overdraft")}
          />
        </div>
      </div>

      {/* STATEMENTS */}
      <div className="wallet-section">
        <div className="section-title">Activity & Reports</div>
        <div className="wallet-card statement-card">
          <div
            className="statement-row"
            onClick={() => navigate("/mini-statement")}
          >
            <div className="row-left">
               <FileText size={18} />
               <span>Mini Statement</span>
            </div>
            <small>Last 5 transactions</small>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("/full-statement")}
          >
            Generate Full Statement
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ icon, label, onClick }) {
  return (
    <div className="action-item" onClick={onClick}>
      <div className="action-icon">{icon}</div>
      <div className="action-label">{label}</div>
    </div>
  );
}