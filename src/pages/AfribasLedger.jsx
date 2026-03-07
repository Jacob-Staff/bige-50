import React from "react";
import { 
  ShieldCheck, Cpu, Globe, ArrowRightLeft, 
  ExternalLink, Fingerprint, Activity 
} from "lucide-react";
import "./Afribas.css";

export default function AfribasLedger({ afribasId = "AF-992-001-BIGE", digitalBalances = [] }) {
  // Default values for Objective 2 Digital Assets if props aren't passed
  const assets = digitalBalances.length > 0 ? digitalBalances : [
    { name: "Atlantian Crown", symbol: "ATC", balance: "12,500.00", usdValue: "5,625" },
    { name: "FactCoin", symbol: "FACT", balance: "850.00", usdValue: "1,062" }
  ];

  return (
    <div className="afribas-ledger-container">
      {/* INSTITUTIONAL IDENTITY CARD */}
      <div className="afribas-card">
        <div className="afribas-header">
          <div className="afribas-badge">
            <ShieldCheck size={12} /> 
            <span>WESWAC CERTIFIED</span>
          </div>
          <Activity size={18} className="pulse-icon" />
        </div>
        
        <div className="afribas-id-section">
          <label>Institutional Ledger Identity</label>
          <h2 className="afribas-id">{afribasId}</h2>
          <div className="ledger-status">
            <div className="status-dot"></div>
            <span>Node Connection: Active (Sector 4)</span>
          </div>
        </div>

        <div className="card-footer">
          <Fingerprint size={24} color="rgba(255,255,255,0.2)" />
          <div className="protocol-text">AFRIBAS 200.000 Protocol Enabled</div>
        </div>
      </div>

      <h3 className="section-label">Global Settlement Assets</h3>

      <div className="digital-assets-grid">
        {assets.map((asset) => (
          <div key={asset.symbol} className="asset-card">
            <div className="asset-top">
              <div className="asset-info">
                <span className="asset-name">{asset.name}</span>
                <span className="asset-symbol">{asset.symbol}</span>
              </div>
              <Globe size={14} color="#94a3b8" />
            </div>
            
            <div className="asset-value">
              <div className="amount">{asset.balance}</div>
              <div className="fiat-equiv">USD Eq. ${asset.usdValue}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="afribas-actions">
        <button className="ledger-btn primary-action">
          <ArrowRightLeft size={16} /> 
          <span>Instant Settlement</span>
        </button>
        <button className="ledger-btn secondary-action">
          <Cpu size={16} /> 
          <span>Node Metadata</span>
        </button>
      </div>

      <div className="compliance-footer">
        <ExternalLink size={12} />
        <span>View Cross-Border Transaction Manifest</span>
      </div>
    </div>
  );
}