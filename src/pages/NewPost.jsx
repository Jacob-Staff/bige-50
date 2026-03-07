import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./Forum.css";

export default function NewPost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Strategy"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert("Please fill all fields");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("forum_posts").insert([
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          author_id: user?.id,
          author_name: user?.user_metadata?.full_name || "Institutional User",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      navigate("/forum");
    } catch (err) {
      alert("Error publishing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper forum-bg">
      <Topbar2 title="Initialize Thread" />
      
      <div className="app-content p-4">
        <button onClick={() => navigate(-1)} className="back-btn-simple">
          <ArrowLeft size={18} /> Back to Feed
        </button>

        <form onSubmit={handleSubmit} className="new-post-form">
          <label className="input-label">Insight Category</label>
          <select 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="Strategy">Strategy</option>
            <option value="Investment">Investment</option>
            <option value="Governance">Governance</option>
            <option value="Global">Global</option>
          </select>

          <label className="input-label">Thread Title</label>
          <input 
            type="text" 
            placeholder="e.g. Market Liquidity Analysis Q1"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />

          <label className="input-label">Detailed Intelligence</label>
          <textarea 
            placeholder="Provide detailed market analysis..."
            rows={8}
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            required
          />

          <button type="submit" className="forum-fab w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Publish Insight</>}
          </button>
        </form>
      </div>
    </div>
  );
}