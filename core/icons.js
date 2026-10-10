/* Shared SVG symbol sprite (stroke icons + Cloudscape status glyphs), injected before slides build. */
document.write(`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6 20.5 20.5"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/></symbol>
<symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/></symbol>
<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .35 1.9l.05.05a2 2 0 1 1-2.85 2.85l-.05-.05a1.7 1.7 0 0 0-2.9 1.2v.15a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-3-1.25l-.05.05a2 2 0 1 1-2.85-2.85l.05-.05a1.7 1.7 0 0 0-1.2-2.9h-.15a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.25-3l-.05-.05a2 2 0 1 1 2.85-2.85l.05.05a1.7 1.7 0 0 0 1.9.35h.08a1.7 1.7 0 0 0 1.05-1.55v-.15a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 2.9 1.2l.05-.05a2 2 0 1 1 2.85 2.85l-.05.05a1.7 1.7 0 0 0 1.2 2.9h.15a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.55 1.05z"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.6 4.6L19 6.8"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></symbol>
<symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 3 2.5 20h19z"/><path d="M12 9v5"/><path d="M12 17.2h.01"/></symbol>
<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.4 4.6 4.6 0 0 0 7 18.5z"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></symbol>
<symbol id="i-cursor" viewBox="0 0 24 24"><path d="M5.5 3.2 19 12.1l-5.7 1.3-2.6 5.3z" fill="#fff" stroke="#0A0E18" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-dollar" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M16.5 7.5c0-1.9-2-3-4.5-3S7.5 5.6 7.5 7.5s2 2.6 4.5 3 4.5 1.3 4.5 3.3-2 3.2-4.5 3.2-4.5-1.3-4.5-3.2"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></symbol>
<symbol id="i-server" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01"/><path d="M7 16.5h.01"/></symbol>
<symbol id="i-ai" viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/></symbol>
<symbol id="i-pkg" viewBox="0 0 24 24"><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5"/><path d="M12 12v9"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="14" r="4.5"/><path d="M11.5 11 20 3"/><path d="M16.5 6.5 19 9"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M6 3h7.5L19 8.5V21H6z"/><path d="M13.5 3v5.5H19"/></symbol>
<symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="5.6" rx="7.4" ry="2.8"/><path d="M4.6 5.6v12.8c0 1.6 3.3 2.8 7.4 2.8s7.4-1.2 7.4-2.8V5.6"/><path d="M4.6 12c0 1.6 3.3 2.8 7.4 2.8s7.4-1.2 7.4-2.8"/></symbol>
<symbol id="i-net" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5V12"/><path d="M12 12 6.5 17"/><path d="M12 12l5.5 5"/></symbol>
<symbol id="i-browser" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19"/><circle cx="5.8" cy="6.5" r=".7" fill="currentColor"/><circle cx="8.2" cy="6.5" r=".7" fill="currentColor"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/></symbol>
<symbol id="i-like" viewBox="0 0 24 24"><path d="M7 21V10l4.4-7A2 2 0 0 1 14.7 4.6L13.6 9h5.1a2 2 0 0 1 1.95 2.45l-1.6 7A2 2 0 0 1 17.1 20H7z"/><path d="M7 10H4.2A1.2 1.2 0 0 0 3 11.2v8.6A1.2 1.2 0 0 0 4.2 21H7"/></symbol>
<symbol id="a-ok" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="a-stop" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 12h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></symbol>
<symbol id="a-neg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
<symbol id="a-prog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
<symbol id="a-pend" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/></symbol>
</defs></svg>`);
