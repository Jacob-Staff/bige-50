import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { 
  Copy, Check, Share2, Plus, ShieldCheck, 
  Link as LinkIcon, X, AlertCircle, Loader2,
  ExternalLink, Trash2
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./paylinks.css";

export default function PayLinks() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLinks, setActiveLinks] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  // Form States
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("KWACHA");

  // 1. Fetch Real Links from Ledger on Mount
  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoadingRecords(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('paylinks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveLinks(data || []);
    } catch (err) {
      console.error("Ledger Fetch Error:", err.message);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleCopy = (id) => {
    // Real URL structure for the payer's view
    const link = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (linkData) => {
    const url = `${window.location.origin}/pay/${linkData.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Settlement: ${linkData.purpose}`,
          text: `Payment requested for ${linkData.purpose}`,
          url: url,
        });
      } catch (err) { console.log("Share failed"); }
    } else {
      handleCopy(linkData.id);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!purpose || !amount) return;

    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth Required");

      const linkId = `LNK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const newLinkData = {
        id: linkId,
        user_id: user.id,
        purpose: purpose,
        amount: parseFloat(amount),
        currency: currency === "KWACHA" ? "K" : currency,
        status: "Active",
        created_at: new Date().toISOString()
      };

      // 2. Insert into Supabase
      const { error } = await supabase
        .from('paylinks')
        .insert([newLinkData]);

      if (error) throw error;

      setActiveLinks([newLinkData, ...activeLinks]);
      setShowCreate(false);
      setPurpose("");
      setAmount("");
    } catch (err) {
      alert("Protocol Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalOutstanding = activeLinks
    .filter(l => l.status === "Active" && (l.currency === "K" || l.currency === "KWACHA"))
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="app-wrapper links-bg">
      <Topbar2 title="Settlement Links" />

      <div className="app-content links-scroll-fix">
        <div className="links-inner">
          
          <div className="protocol-badge-container">
            <div className="protocol-badge">
              <ShieldCheck size={14} color="#af641e" />
              <span>AFRIBAS SECURED GATEWAY</span>
            </div>
            <button className="add-link-btn-circle" onClick={() => setShowCreate(true)}>
              <Plus size={24} />
            </button>
          </div>

          <div className="links-summary-grid">
            <div className="summary-card">
              <label>K-Outstanding</label>
              <div className="summary-val">K {totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div className="summary-card">
              <label>Active links</label>
              <div className="summary-val">
                {activeLinks.filter(l => l.status === "Active").length}
              </div>
            </div>
          </div>

          <h2 className="links-section-label">Institutional Records</h2>
          
          <div className="links-list">
            {loadingRecords ? (
              <div className="flex flex-col items-center py-10 opacity-40">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-xs">Synchronizing Ledger...</span>
              </div>
            ) : activeLinks.length === 0 ? (
              <div className="empty-state-links">
                <LinkIcon size={40} className="mb-2 opacity-20" />
                <p>No active settlement links found.</p>
              </div>
            ) : (
              activeLinks.map((link) => (
                <div key={link.id} className={`link-item-card ${link.status.toLowerCase()}`}>
                  <div className="link-item-top">
                    <div className="link-meta">
                      <span className="link-id-tag">{link.id}</span>
                      <span className="link-date">
                        {new Date(link.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className={`status-pill ${link.status.toLowerCase()}`}>
                      {link.status}
                    </div>
                  </div>

                  <div className="link-item-body">
                    <h3>{link.purpose}</h3>
                    <div className="link-item-amount">
                      <span className="cur-sym">{link.currency}</span> {Number(link.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  
                  <div className="link-item-actions">
                    <button className="action-btn-link" onClick={() => handleCopy(link.id)}>
                      {copiedId === link.id ? (
                        <><Check size={14} /> Copied</>
                      ) : (
                        <><Copy size={14} /> Copy</>
                      )}
                    </button>
                    <button className="action-btn-link" onClick={() => handleShare(link)}>
                      <Share2 size={14} /> Share
                    </button>
                    <button className="action-btn-link" onClick={() => navigate(`/pay/${link.id}`)}>
                      <ExternalLink size={14} /> View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {showCreate && (
            <div className="modal-overlay-links animate-fade-in">
              <div className="modal-drawer-links animate-slide-up">
                <div className="drawer-header">
                  <div className="drawer-handle"></div>
                  <div className="header-flex">
                    <h3>New Settlement Link</h3>
                    <button className="close-drawer" onClick={() => setShowCreate(false)}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleCreateLink} className="drawer-body">
                  <div className="input-block">
                    <label>Purpose of Settlement</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Service Fee, Product Sale..." 
                      className="drawer-input"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="input-block">
                    <label>Settlement Amount</label>
                    <div className="amount-input-row">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        className="drawer-input amount-main"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                      <select 
                        className="drawer-select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="KWACHA">KWACHA</option>
                        <option value="ATC">ATC</option>
                        <option value="FACT">FACT</option>
                      </select>
                    </div>
                  </div>

                  <div className="expiry-notice">
                    <LinkIcon size={14} className="text-slate-400" />
                    <span>Real-time blockchain verification enabled.</span>
                  </div>

                  <button 
                    type="submit" 
                    className="generate-submit-btn"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="animate-spin" size={18} /> Validating...</>
                    ) : "Generate Secure Link"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}