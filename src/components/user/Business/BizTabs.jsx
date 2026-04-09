import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../auctionData";
import { Toggle } from "./BizUI";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import Swal from "sweetalert2";

// ── Theme-aware style tokens (call makeC(isLight) inside each component) ──────
function makeC() {
  return {
    card:    { background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
    title:   { color:"var(--text-primary)", fontWeight:700, fontSize:"16px" },
    label:   { color:"var(--text-muted)", fontSize:"11px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" },
    muted:   { color:"var(--text-muted)", fontSize:"12px" },
    editBtn: { padding:"5px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", fontSize:"13px", fontWeight:600, cursor:"pointer" },
    divider: { borderBottom:"1px solid var(--border)" },
    text:    { color:"var(--text-primary)", fontSize:"13px", fontWeight:500 },
  };
}

function CardHeader({ title, onEdit }) {
  const C = makeC();
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
      <div style={C.title}>{title}</div>
      {onEdit && <button onClick={onEdit} style={C.editBtn}>✏️ Edit</button>}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  const C = makeC();
  return (
    <div style={{ display:"flex", gap:"10px", alignItems:"center", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ fontSize:"14px", width:"18px", textAlign:"center", flexShrink:0 }}>{icon}</span>
      <span style={{ ...C.label, width:"130px", flexShrink:0 }}>{label}</span>
      <span style={{ color:"var(--text-primary)", fontSize:"13px", fontWeight:500, wordBreak:"break-all" }}>{value || "—"}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 0 – Dashboard
// ══════════════════════════════════════════════════════════════════════════════
export function TabDashboard({ biz, lockedName, lockedEmail, openModal, setBiz, handleBankSave, userId }) {
  const C = makeC();
  return (
    <div style={{ animation:"fadeIn .3s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:"20px", alignItems:"start" }}>

        {/* LEFT: Business Info + KYC */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

          {/* Business Info — 2-col grid */}
          <div style={C.card}>
            <CardHeader title="Business Info" onEdit={() => openModal({
              title:"Edit Business Info",
              fields:[
                { key:"businessName", label:"Business Name", locked:true },
                { key:"_email",       label:"Email",         locked:true },
                { key:"ownerName",    label:"Owner Name" },
                { key:"businessType", label:"Business Type" },
                { key:"gst",          label:"GST Number" },
                { key:"pan",          label:"PAN" },
                { key:"phone",        label:"Phone", type:"tel" },
                { key:"website",      label:"Website", type:"url" },
              ],
              values:{ businessName:lockedName, _email:lockedEmail, ownerName:biz.ownerName, businessType:biz.businessType, gst:biz.gst, pan:biz.pan, phone:biz.phone, website:biz.website },
              onSave:(draft) => { const { businessName, _email, ...rest } = draft; setBiz((prev) => ({ ...prev, ...rest })); },
            })} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
              {[
                ["🏢","Business", lockedName], ["📧","Email",    lockedEmail],
                ["👤","Owner",    biz.ownerName], ["🏷️","Type",  biz.businessType],
                ["🔖","GST",      biz.gst],       ["🆔","PAN",    biz.pan],
                ["📱","Phone",    biz.phone],      ["📍","City",   biz.address?.city],
                ["🌐","Website",  biz.website],    ["✅","KYC",    biz.verificationStatus],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ display:"flex", gap:"7px", alignItems:"flex-start", padding:"6px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:"13px", flexShrink:0, marginTop:"2px" }}>{icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={C.label}>{label}</div>
                    <div style={{ color:"var(--text-primary)", fontSize:"12px", fontWeight:500, marginTop:"1px", wordBreak:"break-all" }}>{val || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KYC */}
          <div style={C.card}>
            <CardHeader title="KYC & Verification" onEdit={() => openModal({
              title:"Edit KYC Details",
              fields:[{ key:"pan", label:"PAN Number" }, { key:"aadhar", label:"Aadhar Number" }],
              values:{ pan:biz.pan, aadhar:biz.aadhar },
              onSave:(draft) => setBiz((prev) => ({ ...prev, ...draft })),
            })} />
            <InfoRow icon="✅" label="GST Status" value={biz.verificationStatus} />
            <InfoRow icon="🆔" label="PAN"        value={biz.pan} />
            <InfoRow icon="🪪" label="Aadhar"     value={biz.aadhar} />
            <InfoRow icon="📋" label="KYC Done"   value={biz.isKYCCompleted ? "Yes ✓" : "No"} />
          </div>
        </div>

        {/* RIGHT: Bank + Recent Listings + Revenue */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

          {/* Bank Details */}
          <div style={C.card}>
            <CardHeader title="Bank Details" onEdit={() => openModal({
              title:"Edit Bank Details",
              fields:[
                { key:"accountHolder", label:"Account Holder" }, { key:"bankName",      label:"Bank Name" },
                { key:"accountNumber", label:"Account Number" }, { key:"ifsc",          label:"IFSC Code" },
                { key:"upi",           label:"UPI ID" },
              ],
              values:{ ...biz.bank },
              onSave:handleBankSave,
            })} />
            <InfoRow icon="🏦" label="Bank"           value={biz.bank.bankName} />
            <InfoRow icon="👤" label="Account Holder" value={biz.bank.accountHolder} />
            <InfoRow icon="🔢" label="Account No"     value={biz.bank.accountNumber} />
            <InfoRow icon="🏷️" label="IFSC"          value={biz.bank.ifsc} />
            <InfoRow icon="📲" label="UPI"            value={biz.bank.upi} />
          </div>

          {/* Recent Listings */}

{/* Revenue */}
          <div style={{ ...C.card, background:"linear-gradient(135deg,rgba(99,102,241,.15),rgba(56,189,248,.1))", borderColor:"rgba(99,102,241,.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={C.muted}>This Month's Revenue</div>
                <div style={{ color:"var(--text-primary)", fontSize:"28px", fontWeight:900, margin:"4px 0", fontFamily:"system-ui, sans-serif" }}>{formatINR(520000)}</div>
                <div style={{ color:"#10b981", fontSize:"12px" }}>↑ 26% vs last month</div>
              </div>
              <div style={{ fontSize:"40px" }}>💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 – Settings
// ══════════════════════════════════════════════════════════════════════════════
export function TabSettings({ biz, setBiz, lockedName, lockedEmail, openModal, handleBankSave, userId }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const C = makeC();

  function SettingsSectionCard({ title, rows, onEdit }) {
    const C = makeC();
    return (
      <div style={{ ...C.card, marginBottom:"14px" }}>
        <CardHeader title={title} onEdit={onEdit} />
        {rows.map(({ label, value, locked }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border)" }}>
            <span style={{ ...C.label, width:"160px", flexShrink:0 }}>{label}</span>
            <span style={{ color: locked ? "var(--text-muted)" : "var(--text-primary)", fontSize:"13px", fontWeight:500, flex:1 }}>{value || "—"}</span>
            {locked && <span>🔒</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ animation:"fadeIn .3s ease", maxWidth:"700px" }}>

      {/* Account Identity */}
      <div style={{ ...C.card, marginBottom:"14px", borderColor:"rgba(99,102,241,.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <div style={C.title}>Account Identity</div>
          <span style={{ background:"rgba(99,102,241,.08)", color:"#6366f1", fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px", border:"1px solid rgba(99,102,241,.2)" }}>🔒 Login Managed</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border)" }}>
          <span style={{ ...C.label, width:"160px" }}>Business Name</span>
          <span style={{ color:"var(--text-muted)", fontSize:"13px", flex:1 }}>{lockedName}</span><span>🔒</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", padding:"9px 0" }}>
          <span style={{ ...C.label, width:"160px" }}>Email Address</span>
          <span style={{ color:"var(--text-muted)", fontSize:"13px", flex:1 }}>{lockedEmail}</span><span>🔒</span>
        </div>
      </div>

      <SettingsSectionCard title="Business Details"
        rows={[
          { label:"Owner Name",    value:biz.ownerName },   { label:"Business Type", value:biz.businessType },
          { label:"Category",      value:biz.category },    { label:"Phone",         value:biz.phone },
          { label:"Alt Phone",     value:biz.alternatePhone },{ label:"Website",      value:biz.website },
          { label:"Bio",           value:biz.bio },
        ]}
        onEdit={() => openModal({
          title:"Edit Business Details",
          fields:[
            { key:"ownerName", label:"Owner Name" }, { key:"businessType", label:"Business Type" },
            { key:"category",  label:"Category" },   { key:"phone",        label:"Phone", type:"tel" },
            { key:"alternatePhone", label:"Alt Phone", type:"tel" }, { key:"website", label:"Website", type:"url" },
            { key:"bio", label:"Bio" },
          ],
          values:{ ownerName:biz.ownerName, businessType:biz.businessType, category:biz.category, phone:biz.phone, alternatePhone:biz.alternatePhone, website:biz.website, bio:biz.bio },
          onSave:(draft) => setBiz((prev) => ({ ...prev, ...draft })),
        })}
      />

      <SettingsSectionCard title="Address"
        rows={[
          { label:"Line 1",  value:biz.address.line1 }, { label:"Line 2",  value:biz.address.line2 },
          { label:"City",    value:biz.address.city },  { label:"State",   value:biz.address.state },
          { label:"Pincode", value:biz.address.pincode },{ label:"Country", value:biz.address.country },
        ]}
        onEdit={() => openModal({
          title:"Edit Address",
          fields:[
            { key:"line1", label:"Line 1" }, { key:"line2", label:"Line 2" },
            { key:"city",  label:"City" },   { key:"state",  label:"State" },
            { key:"pincode", label:"Pincode" }, { key:"country", label:"Country" },
          ],
          values:{ ...biz.address },
          onSave:(draft) => setBiz((prev) => ({ ...prev, address:{ ...prev.address, ...draft } })),
        })}
      />

      <SettingsSectionCard title="Legal & KYC"
        rows={[
          { label:"GST Number",  value:biz.gst },           { label:"PAN",          value:biz.pan },
          { label:"Aadhar",      value:biz.aadhar },         { label:"Reg. Number",  value:biz.registrationNumber },
          { label:"KYC Status",  value:biz.isKYCCompleted ? "Completed ✓" : "Pending" },
          { label:"Verification",value:biz.verificationStatus },
        ]}
        onEdit={() => openModal({
          title:"Edit Legal & KYC",
          fields:[
            { key:"gst", label:"GST Number" }, { key:"pan", label:"PAN" },
            { key:"aadhar", label:"Aadhar" }, { key:"registrationNumber", label:"Registration Number" },
          ],
          values:{ gst:biz.gst, pan:biz.pan, aadhar:biz.aadhar, registrationNumber:biz.registrationNumber },
          onSave:(draft) => setBiz((prev) => ({ ...prev, ...draft })),
        })}
      />

      <SettingsSectionCard title="Bank Details"
        rows={[
          { label:"Account Holder", value:biz.bank.accountHolder }, { label:"Bank Name",   value:biz.bank.bankName },
          { label:"Account No",     value:biz.bank.accountNumber }, { label:"IFSC",        value:biz.bank.ifsc },
          { label:"UPI",            value:biz.bank.upi },
        ]}
        onEdit={() => openModal({
          title:"Edit Bank Details",
          fields:[
            { key:"accountHolder", label:"Account Holder" }, { key:"bankName",      label:"Bank Name" },
            { key:"accountNumber", label:"Account Number" }, { key:"ifsc",          label:"IFSC Code" },
            { key:"upi",           label:"UPI ID" },
          ],
          values:{ ...biz.bank },
          onSave:handleBankSave,
        })}
      />

      

      {/* Notifications */}
      <div style={{ ...C.card, marginBottom:"14px" }}>
        <div style={{ ...C.title, marginBottom:"16px" }}>🔔 Seller Notifications</div>
        {[
          ["Email when I get a new bid", true],
          ["Email when auction ends",    true],
          ["Weekly performance report",  true],
          ["New buyer messages",         true],
        ].map(([label, def]) => (
          <Toggle key={label} label={label} defaultOn={def} />
        ))}
      </div>

      {/* Danger Zone */}
      <div style={{ ...C.card, borderColor:"rgba(244,63,94,.25)" }}>
        <div style={{ color:"#f43f5e", fontWeight:700, fontSize:"16px", marginBottom:"16px" }}>⚠️ Danger Zone</div>
        <button onClick={async () => {
          const result = await Swal.fire({
            title:"Delete Account?", text:"This will permanently delete your business account and all data. This cannot be undone.",
            icon:"warning", showCancelButton:true, confirmButtonColor:"#e11d48", cancelButtonColor:"#475569",
            confirmButtonText:"Yes, delete it", cancelButtonText:"Cancel",
            background: isDark ? "#0f172a" : "#ffffff",
            color:      isDark ? "#f1f5f9" : "#0f172a",
          });
          if (!result.isConfirmed) return;
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/user/deleteuser/${userId}`, { method:"DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            await Swal.fire({ title:"Deleted!", text:"Your account has been deleted.", icon:"success", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#f1f5f9" : "#0f172a", confirmButtonColor:"#38bdf8", timer:2000, showConfirmButton:false, allowOutsideClick:false });
            logout(); navigate("/");
          } catch (err) {
            Swal.fire({ title:"Error", text:err.message, icon:"error", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#f1f5f9" : "#0f172a" });
          }
        }}
        style={{ padding:"10px 20px", background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.25)", borderRadius:"10px", color:"#f43f5e", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>
          🗑️ Delete Account
        </button>
      </div>
    </div>
  );
}

