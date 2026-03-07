import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, Globe, Users, TrendingUp, 
  Search, Share2, Award, Plus, Loader2, Filter
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Topbar2 from "../components/Topbar2";
import "./Forum.css";

export default function Forum() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Global");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ members: "4.2k", proposals: 0 });

  // 1. Fetch Posts & Setup Real-time Listener
  useEffect(() => {
    fetchPosts();
    fetchStats();

    // Real-time listener: Auto-update feed when a new post is created
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'forum_posts' }, 
        (payload) => {
          if (activeCategory === "Global" || payload.new.category === activeCategory) {
            setPosts((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeCategory !== "Global") {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Forum Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Dynamic Proposals count (Postings tagged as Governance/Strategy)
    const { count } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .in('category', ['Governance', 'Strategy']);
    
    setStats(prev => ({ ...prev, proposals: count || 0 }));
  };

  // 2. Share Functionality
  const handleShare = async (e, post) => {
    e.stopPropagation();
    const shareData = {
      title: post.title,
      text: `Check out this insight on the Institutional Forum: ${post.title}`,
      url: `${window.location.origin}/forum/${post.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Sharing failed", err);
    }
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="app-wrapper forum-bg">
      <Topbar2 title="Institutional Forum" />
      
      <div className="app-content forum-scroll-area">
        
        {/* Search Bar */}
        <div className="forum-search-container">
          <div className="search-bar-inner">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search market insights..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Filter size={14} className="text-slate-500 ml-2" />
          </div>
        </div>

        {/* Categories */}
        <div className="cat-filter-wrapper">
          {["Global", "Strategy", "Investment", "Governance"].map(cat => (
            <button 
              key={cat} 
              className={`cat-chip ${activeCategory === cat ? 'chip-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Network Stats */}
        <div className="network-stats-grid">
          <div className="net-stat">
            <div className="stat-icon-bg blue">
               <Users size={12} />
            </div>
            <span>{stats.members} Members</span>
          </div>
          <div className="net-stat">
            <div className="stat-icon-bg emerald">
               <TrendingUp size={12} />
            </div>
            <span>{stats.proposals} Live Proposals</span>
          </div>
        </div>

        <div className="forum-feed">
          <div className="feed-header">
            <h3>ACTIVE DISCUSSIONS</h3>
            <div className="live-pulse">
               <div className="live-dot"></div>
               <span>LIVE</span>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state-forum">
               <Loader2 className="animate-spin text-amber-500" size={32} />
               <p>Syncing encrypted feeds...</p>
            </div>
          ) : (
            posts
              .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(post => (
                <div key={post.id} className="forum-card" onClick={() => navigate(`/forum/${post.id}`)}>
                  <div className="card-top">
                    <span className="card-tag">{post.category?.toUpperCase() || "MARKET"}</span>
                    <span className="card-time">{getRelativeTime(post.created_at)}</span>
                  </div>
                  
                  <h3 className="card-title">{post.title}</h3>
                  
                  <div className="card-author">
                    <div className="author-avatar">
                      {post.author_name ? post.author_name[0] : 'A'}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{post.author_name || "Institutional User"}</span>
                      <div className="verified-badge">
                        <Award size={10} />
                        <span>Verified Post</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="foot-item">
                      <MessageSquare size={14} /> 
                      <span>{post.comment_count || 0}</span>
                    </div>
                    <div className="foot-item">
                      <Globe size={14} /> 
                      <span>{post.views || 0}</span>
                    </div>
                    <button className="foot-share-btn ml-auto" onClick={(e) => handleShare(e, post)}>
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <button className="forum-fab" onClick={() => navigate("/forum/new")}>
        <Plus size={20} />
        <span>New Thread</span>
      </button>
    </div>
  );
}