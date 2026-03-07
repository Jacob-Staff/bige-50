import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { 
  User, Lock, Bell, ShieldCheck, LogOut, 
  ChevronRight, Smartphone, Eye, EyeOff, 
  Loader2, ArrowLeft, CheckCircle2, MessageCircle, Globe
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./payBills.css"; 

export default function Manage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("menu"); 
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });

  // 1. Fetch User Profile with precise selection
// Replace your fetch block with this logic
useEffect(() => {
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    // 1. First, try to fetch everything
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, country, bank_name')
      .eq('id', user.id)
      .single();

    // 2. If 'country' is the specific error, fall back immediately
    if (error && error.message.includes("country")) {
      const { data: fallback } = await supabase
        .from('profiles')
        .select('full_name, phone') // Old stable columns
        .eq('id', user.id)
        .single();
      
      setProfile({ ...fallback, country: "Syncing...", email: user.email });
    } else if (data) {
      setProfile({ ...data, email: user.email });
    }
  };
  fetchProfile();
}, [navigate]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatus({ type: "error", msg: "PIN must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", msg: "" });

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Security PIN updated successfully!" });
      setNewPassword("");
      setTimeout(() => { setStatus({ type: "", msg: "" }); setView("menu"); }, 2000);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { 
      id: 1, 
      title: "Account Details", 
      desc: profile?.full_name || "Bridge User", 
      icon: <User size={20} className="biller-icon-blue" />, 
      color: "#e0f2fe", 
      action: () => navigate("/profile") 
    },
    { 
      id: 2, 
      title: "Mobile Number", 
      desc: profile?.phone || "Not set", 
      icon: <Smartphone size={20} className="biller-icon-cyan" />, 
      color: "#ecfeff", 
      action: null 
    },
    { 
      id: 7, 
      title: "Country / Region", 
      desc: profile?.country || "Zambia", 
      icon: <Globe size={20} style={{color: '#2563eb'}} />, 
      color: "#dbeafe", 
      action: null 
    },
    { 
      id: 3, 
      title: "Security & PIN", 
      desc: "Change your secret PIN", 
      icon: <Lock size={20} className="biller-icon-orange" />, 
      color: "#ffedd5", 
      action: () => setView("password") 
    },
    { 
      id: 4, 
      title: "Notifications", 
      desc: "Alerts & Transaction SMS", 
      icon: <Bell size={20} className="biller-icon-purple" />, 
      color: "#f3e8ff", 
      action: () => navigate("/dashboard") 
    },
    { 
      id: 5, 
      title: "Privacy Policy", 
      desc: "User data protection", 
      icon: <ShieldCheck size={20} className="biller-icon-yellow" />, 
      color: "#fef9c3", 
      action: () => navigate("/dashboard") 
    },
    { 
      id: 6, 
      title: "Help & Support", 
      desc: "24/7 Customer Care", 
      icon: <MessageCircle size={20} style={{color: '#059669'}} />, 
      color: "#d1fae5", 
      action: () => navigate("/support") 
    },
  ];

  return (
    <div className="pay-bills-page">
      <Topbar2 
        title={view === "menu" ? "Manage" : "Security"} 
        onBack={() => view !== "menu" ? setView("menu") : navigate("/dashboard")} 
      />

      <div className="bills-container">
        {view === "menu" ? (
          <div className="animate-in fade-in duration-300">
            <h3 className="section-subtitle">Account Management</h3>
            <div className="billers-list">
              {menuItems.map((item) => (
                <div key={item.id} className="biller-card" onClick={item.action}>
                  <div className="biller-icon-wrapper" style={{ backgroundColor: item.color }}>
                    {item.icon}
                  </div>
                  <div className="biller-info">
                    <span className="biller-title">{item.title}</span>
                    <span className="biller-desc">{item.desc}</span>
                  </div>
                  <ChevronRight size={18} className="biller-chevron" />
                </div>
              ))}

              <div className="biller-card logout-trigger" onClick={handleLogout} style={{ border: '1px solid #fee2e2', marginTop: '24px' }}>
                <div className="biller-icon-wrapper" style={{ backgroundColor: '#fef2f2' }}>
                  <LogOut size={20} color="#ef4444" />
                </div>
                <div className="biller-info">
                  <span className="biller-title" style={{ color: '#ef4444' }}>Logout</span>
                  <span className="biller-desc">Sign out of this device</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="password-form-container animate-in slide-in-from-right duration-300">
            <button className="back-btn-simple mb-4" onClick={() => setView("menu")}>
              <ArrowLeft size={16} /> Back to Settings
            </button>
            <h3 className="section-subtitle">Update Security PIN</h3>
            
            {status.msg && (
              <div className={`status-msg-bubble ${status.type} flex items-center gap-2 mb-4 p-3 rounded-lg text-sm border`}>
                {status.type === "success" && <CheckCircle2 size={16} className="text-green-500" />}
                <span className={status.type === "success" ? "text-green-700" : "text-red-700"}>{status.msg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="manage-inner-form">
              <div className="form-group-bige">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">New Security PIN</label>
                <div className="input-with-icon relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="bige-input"
                    placeholder="Enter new secret code"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                  />
                  <div className="icon-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>
              <button type="submit" className="bige-primary-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Update PIN Now"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}