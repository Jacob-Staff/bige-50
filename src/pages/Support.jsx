import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, Phone, Mail, HelpCircle, 
  FileText, ChevronRight, Globe, Loader2, ChevronDown
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./upport.css";

export default function Support() {
  const navigate = useNavigate();
  const [view, setView] = useState("main"); // "main" or "faq"
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "How do I reset my transaction PIN?",
      a: "Go to Manage > Security & PIN. You will need to enter your new 6-digit code and confirm it. For security, never share this PIN with anyone."
    },
    {
      q: "What are the daily transfer limits?",
      a: "Standard accounts have a daily limit of K10,000. You can increase this by verifying your ID in the Profile section."
    },
    {
      q: "Is my money safe in the Bridge Cloud?",
      a: "Yes. All funds are held in regulated trust accounts and every transaction is protected by AES-256 bank-grade encryption."
    },
    {
      q: "How long do withdrawals take?",
      a: "Mobile money withdrawals are usually instant. Bank transfers may take up to 24 hours depending on the clearing cycle."
    }
  ];

  const handleLiveChat = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      alert("Bridge Support: Connecting you to the next available agent...");
    }, 2000);
  };

  const fastActions = [
    { title: "Call Us", icon: <Phone size={22} />, color: "#ecfdf5", iconColor: "#10b981", action: () => window.open("tel:+26097000000") },
    { title: "Email", icon: <Mail size={22} />, color: "#eff6ff", iconColor: "#3b82f6", action: () => window.open("mailto:help@bige50.com") },
    { title: "FAQs", icon: <HelpCircle size={22} />, color: "#fff7ed", iconColor: "#f59e0b", action: () => setView("faq") },
    { title: "Guides", icon: <FileText size={22} />, color: "#f5f3ff", iconColor: "#8b5cf6", action: () => navigate("/privacy") },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      <Topbar2 
        title={view === "main" ? "Help & Support" : "Frequently Asked"} 
        onBack={() => view === "faq" ? setView("main") : navigate("/manage")} 
      />

      <div className="max-w-md mx-auto support-container">
        {view === "main" ? (
          <div className="animate-in fade-in duration-500">
            {/* HERO SECTION */}
            <div className="support-hero">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <MessageCircle className="text-blue-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">How can we help?</h2>
              <p className="text-sm text-slate-500 mt-2">Our agents are online to assist you.</p>
            </div>

            {/* GRID ACTIONS */}
            <div className="support-grid">
              {fastActions.map((item, i) => (
                <div key={i} className="support-card cursor-pointer" onClick={item.action}>
                  <div className="support-icon-circle" style={{ backgroundColor: item.color, color: item.iconColor }}>
                    {item.icon}
                  </div>
                  <h4>{item.title}</h4>
                </div>
              ))}
            </div>

            {/* CHAT BUTTON */}
            <button onClick={handleLiveChat} disabled={isConnecting} className="chat-float-btn mt-6">
              {isConnecting ? <Loader2 className="animate-spin" /> : <MessageCircle size={20} />}
              {isConnecting ? "Connecting..." : "Start Live Chat"}
            </button>
          </div>
        ) : (
          /* FAQ ACCORDION VIEW */
          <div className="animate-in slide-in-from-right duration-300">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-1">Common Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button 
                    className="w-full p-5 flex justify-between items-center text-left"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <span className="text-sm font-bold text-slate-700 pr-4">{faq.q}</span>
                    <ChevronDown className={`text-slate-400 transition-transform ${activeFaq === index ? "rotate-180" : ""}`} size={18} />
                  </button>
                  {activeFaq === index && (
                    <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            <Globe size={12} />
            Bridge Cloud Protocol 2.4
          </div>
        </div>
      </div>
    </div>
  );
}