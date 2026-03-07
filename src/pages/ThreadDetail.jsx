import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { 
  ArrowLeft, MessageSquare, Share2, Award, Clock, 
  Loader2, Globe, Send, ThumbsUp, Heart, MoreVertical
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./forum.css";

export default function ThreadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchThreadData();
    incrementViewCount();

    // REAL-TIME SUBSCRIPTION: Listen for new comments from other users
    const commentChannel = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'forum_comments',
        filter: `post_id=eq.${id}` 
      }, (payload) => {
        setComments(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(commentChannel);
  }, [id]);

  const incrementViewCount = async () => {
    // Uses a Postgres function to safely increment
    await supabase.rpc('increment_forum_views', { post_id: id });
  };

  const fetchThreadData = async () => {
    setLoading(true);
    try {
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      setPost(postData);

      const { data: commData, error: commError } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      
      if (!commError) setComments(commData || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    // Toggle UI immediately for responsiveness
    const newLikedState = !liked;
    setLiked(newLikedState);
    
    const increment = newLikedState ? 1 : -1;
    setPost(prev => ({ ...prev, likes: (prev.likes || 0) + increment }));

    await supabase.rpc('handle_forum_like', { 
      post_id: id, 
      inc_val: increment 
    });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('forum_comments').insert([{
        post_id: id,
        user_id: user?.id,
        author_name: user?.user_metadata?.full_name || "Institutional User",
        content: newComment
      }]);

      if (error) throw error;
      setNewComment("");
      // Scroll to bottom after post
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard");
    }
  };

  if (loading) return (
    <div className="app-wrapper forum-bg flex items-center justify-center">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="app-wrapper forum-bg">
      <Topbar2 title="Intelligence Brief" />
      
      <div className="app-content forum-scroll-area">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="back-btn-simple">
              <ArrowLeft size={18} /> BACK TO FEED
            </button>
            <MoreVertical size={18} className="text-slate-500" />
          </div>

          <div className="thread-header-section">
            <div className="flex justify-between items-start">
              <span className="card-tag">{post.category?.toUpperCase()}</span>
              <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                <Globe size={10} />
                <span>{post.views || 0} VIEWS</span>
              </div>
            </div>
            
            <h1 className="thread-full-title mt-3">{post.title}</h1>
            
            <div className="card-author my-4">
              <div className="author-avatar">{post.author_name ? post.author_name[0] : 'A'}</div>
              <div className="author-info">
                <span className="author-name">{post.author_name}</span>
                <div className="verified-badge"><Award size={10} /><span>Verified Source</span></div>
              </div>
            </div>
          </div>

          <div className="thread-content-body">
            {post.content}
          </div>

          <div className="interaction-bar py-4 border-b border-white/5 flex gap-6">
            <button 
              className={`flex items-center gap-2 text-xs font-bold ${liked ? 'text-amber-500' : 'text-slate-400'}`}
              onClick={handleLike}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              {post.likes || 0}
            </button>
            <button className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <MessageSquare size={18} />
              {comments.length}
            </button>
            <button onClick={handleShare} className="ml-auto text-slate-400">
              <Share2 size={18} />
            </button>
          </div>

          <div className="comment-section mt-8">
            <h4 className="section-label">INTEL EXCHANGE</h4>
            <div className="comment-list mt-4">
              {comments.length === 0 ? (
                <p className="text-slate-600 text-xs italic">No contributions yet. Be the first to reply.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment-bubble">
                    <div className="flex justify-between items-center mb-1">
                      <span className="comment-author">{c.author_name}</span>
                      <span className="comment-date">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="comment-input-tray">
        <form onSubmit={handleAddComment} className="comment-form-inner">
          <input 
            placeholder="Type your reply..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}