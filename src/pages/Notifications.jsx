import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ArrowDownLeft, ShieldAlert, Tag, Bell, CheckCheck, Trash2, Loader2 
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./notifications.css"; 

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial notifications from Supabase
    const fetchNotifs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setNotifs(data || []);
      setLoading(false);
    };

    fetchNotifs();

    // 2. Set up Realtime Subscription
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          // Add the new notification to the top of the list instantly
          setNotifs(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id) => {
    // Update local state
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    // Update Supabase
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'money': return <ArrowDownLeft color="#16a34a" size={20} />;
      case 'security': return <ShieldAlert color="#dc2626" size={20} />;
      default: return <Tag color="#2563eb" size={20} />;
    }
  };

  return (
    <div className="notif-page">
      <Topbar2 title="Notifications" />
      
      <div className="notif-container">
        <div className="notif-header-row">
          <div className="notif-tab">
            <h3>ACTIVITY</h3>
            {notifs.some(n => !n.is_read) && (
               <span className="notif-count-badge">
                 {notifs.filter(n => !n.is_read).length} NEW
               </span>
            )}
          </div>
        </div>

        <div className="notif-list">
          {loading ? (
            <div className="empty-state"><Loader2 className="animate-spin" /></div>
          ) : notifs.length > 0 ? (
            notifs.map((item) => (
              <div 
                key={item.id} 
                className={`notif-card ${item.is_read ? 'read-mode' : ''}`}
                onClick={() => markAsRead(item.id)}
              >
                <div className="notif-icon-box">
                  {getIcon(item.type)}
                </div>
                <div className="notif-info">
                  <div className="notif-top">
                    <span className="notif-title">{item.title}</span>
                    {!item.is_read && <div className="notif-dot" />}
                  </div>
                  <p className="notif-body">{item.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <CheckCheck size={40} color="#2563eb" />
              <h4>No notifications</h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}