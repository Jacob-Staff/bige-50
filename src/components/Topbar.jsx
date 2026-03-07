import { useEffect, useState } from "react";
import { Menu, User, Activity } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import './topbar.css';

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ fullName: null, displayAccount: null });
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsSyncing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, id')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setUserData({
              fullName: data.full_name,
              displayAccount: `********${data.id.slice(-4).toUpperCase()}`
            });
          }
        }
      } catch (err) { 
        console.error("Error fetching topbar data:", err); 
      } finally {
        setIsSyncing(false);
      }
    };
    fetchUserData();
  }, []);

  return (
    <header className="bige-topbar">
      {/* SYSTEM STATUS BAR */}
      <div className="bige-status-bar">
        <div className={`status-dot ${isSyncing ? 'syncing' : ''}`}></div>
        <span className="status-text">
          {isSyncing ? 'Synchronizing Node...' : 'Node Active'}
        </span>
      </div>

      {/* USER IDENTITY GROUP */}
      <div className="bige-header-group">
        <button className="bige-topbar__logo" onClick={() => navigate("/dashboard")}>
          <img src="/Bige-50.jpg" alt="Logo" className="logo-image" />
        </button>

        <div className="bige-topbar__user-details">
          <div className={`user-name ${isSyncing ? 'text-pulse' : ''}`}>
            {!userData.fullName ? "Identifying..." : userData.fullName}
          </div>
          <span className="user-account-label">Vault ID</span>
          <div className={`user-account ${isSyncing ? 'text-pulse' : ''}`}>
            {!userData.displayAccount ? "********XXXX" : userData.displayAccount}
          </div>
        </div>
      </div>

      {/* NAVIGATION CONTROLS */}
      <button className="bige-topbar__left" onClick={onMenuClick} aria-label="Open Menu">
        <Menu size={24} strokeWidth={1.5} />
      </button>

      <div className="bige-topbar__center">
        <span className="brand-text">BIGE-50</span>
      </div>

      <button className="bige-topbar__right" onClick={() => navigate("/profile")} aria-label="View Profile">
        <User size={24} strokeWidth={1.5} />
      </button>
    </header>
  );
}