import { useEffect, useState } from "react";
import { ArrowLeft, Home, ShieldCheck } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../pages/Dashboard.css"; 
import './Topbar2.css';
export default function Topbar2({ title = "Page", onBack }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. NOTIFICATION BADGE LOGIC
  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('topbar_notifs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        () => fetchUnread()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bige-topbar2">
      <div className="bige-status-bar2">
        <ShieldCheck size={10} className="status-icon" />
        <div className="status-dot2"></div>
        <span className="status-text2">Encrypted Session</span>
      </div>

      <div className="topbar2-content">
        {/* LEFT SECTION */}
        <div className="topbar2-left">
          <button 
            className="topbar2-back" 
            onClick={handleBackClick}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <img 
            src="/Bige-50.jpg" 
            alt="Logo" 
            className="topbar2-mini-logo" 
            onClick={() => navigate("/dashboard")} 
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* CENTER SECTION */}
        <div className="topbar2-center">
          <h1 className="topbar2-page-title">{title}</h1>
          <span className="topbar2-brand-name">BIGE-50</span>
        </div>

        {/* RIGHT SECTION: Home Button + Integrated Badge */}
        <div className="topbar2-right">
          <button 
            className="topbar2-options relative active:scale-90 transition-transform" 
            onClick={() => navigate("/dashboard")}
            aria-label="Go to Home"
          >
            <Home size={20} className="text-slate-600" />
            
            {/* The Badge is now attached directly to Home */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}