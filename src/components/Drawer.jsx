import React from "react";
import { 
  LogOut, 
  Home, 
  Lock, 
  History, 
  ShieldCheck, 
  UserPlus, 
  Users, 
  User 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Drawer({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!open) return null;

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      onClose();
      navigate("/login", { replace: true }); 
    } catch (err) {
      console.error("Logout error:", err.message);
      alert("Error signing out. Please try again.");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />

      <aside 
        className={`drawer-panel ${open ? "open" : ""}`}
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          height: "100vh" // Force the panel to full screen height
        }}
      >
        {/* FIXED HEADER */}
        <div className="drawer-header" style={{ flexShrink: 0 }}>
          <span className="drawer-title">BIGE-50</span>
          <span className="drawer-subtitle">Secure Terminal</span>
        </div>

        {/* SCROLLABLE CONTENT */}
        <nav 
          className="drawer-nav" 
          style={{ 
            flex: 1, 
            overflowY: "auto",
            scrollbarWidth: "none", // Hide scrollbar for cleaner look
            msOverflowStyle: "none"
          }}
        >
          <div
            className={`drawer-item ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => goTo("/dashboard")}
          >
            <Home size={18} /> Home
          </div>

          <div 
            className={`drawer-item ${isActive("/vault") ? "active" : ""}`}
            onClick={() => goTo("/vault")}
          >
            <Lock size={18} /> Vault
          </div>

          <div 
            className={`drawer-item ${isActive("/transactions") ? "active" : ""}`}
            onClick={() => goTo("/transactions")}
          >
            <History size={18} /> Transactions
          </div>

          <div 
             className={`drawer-item ${isActive("/manage") ? "active" : ""}`}
             onClick={() => goTo("/manage")}
          >
            <ShieldCheck size={18} /> Security
          </div>

          <div
            className={`drawer-item ${isActive("/register") ? "active" : ""}`}
            onClick={() => goTo("/register")}
          >
            <UserPlus size={18} /> Register
          </div>

          <div
            className={`drawer-item ${isActive("/membership") ? "active" : ""}`}
            onClick={() => goTo("/membership")}
          >
            <Users size={18} /> Membership
          </div>

          <div
            className={`drawer-item ${isActive("/profile") ? "active" : ""}`}
            onClick={() => goTo("/profile")}
          >
            <User size={18} /> Profile
          </div>
        </nav>

        {/* FIXED BOTTOM LOGOUT SECTION */}
        <div style={{ 
          padding: "20px 12px", 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
          background: "inherit" // Ensures it matches the panel background
        }}>
          <div
            className="drawer-item logout-btn"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444", 
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Centered for better UI
              gap: "10px",
              borderRadius: "12px",
              fontWeight: "700",
              padding: "14px 15px",
              cursor: "pointer",
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Terminate Session
          </div>
        </div>
      </aside>
    </>
  );
}