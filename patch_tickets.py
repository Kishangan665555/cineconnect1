import re

file_path = r'src\pages\TheatreOwner.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The old section (search for the TICKETS comment up to the closing )} )
old_section = r"""        {/* ════════════════════ TICKETS ════════════════════ */}
        {tab === 'tickets' && (
          <div className="space-y-5" style={{ animation:'slideIn 0.5s ease both' }}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total Bookings', numVal:myBookings.length, kpi:'kpi-indigo', ico:'icon-indigo', icon:Ic.tickets, spark:[60,70,55,80,65,90,75] },
                { label:'Confirmed', numVal:confirmedCount, kpi:'kpi-emerald', ico:'icon-emerald', icon:Ic.check, spark:[30,55,70,45,80,65,90] },
                { label:'Cancelled', numVal:cancelledCount, kpi:'kpi-pink', ico:'icon-pink', icon:Ic.cancel, spark:[20,40,30,55,35,45,30] },
              ].map((s,i) => (
                <div key={i} className={`to-kpi-card ${s.kpi}`} style={{ animation:`kpiEntry 0.5s ease both`, animationDelay:`${i*0.1}s` }}>
                  <div className={`to-kpi-icon ${s.ico}`} style={{ width:40,height:40,borderRadius:14,marginBottom:12 }}>{s.icon}</div>
                  <p className="to-kpi-value" style={{ fontSize:'1.8rem' }}><AnimCounter value={s.numVal}/></p>
                  <p className="to-kpi-label" style={{ marginTop:4 }}>{s.label}</p>
                  <div className="to-kpi-sparkline">{s.spark.map((h,j) => <div key={j} className="to-spark-bar" style={{ height:`${h}%`, animationDelay:`${j*0.05}s` }}/>)}</div>
                </div>
              ))}
            </div>
            <div className="to-glass-panel">
              <div className="flex flex-wrap gap-3 items-center" style={{ padding:'14px 20px' }}>
                <div className="relative flex-1 min-w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(168,85,247,0.5)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input type="text" placeholder="Search by movie or booking ID\u2026" value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)} className="to-input" style={{ paddingLeft:36 }}/>
                </div>
                <div className="flex gap-1.5">
                  {(['all','confirmed','cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)}
                      className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${ticketFilter===f?'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg':'to-btn-ghost'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="to-glass-panel overflow-hidden">
              {filteredTickets.length === 0 ? (
                <div className="to-empty"><div className="to-empty-icon">\U0001f39f\ufe0f</div><p style={{ color:'rgba(241,245,249,0.35)', fontSize:13 }}>No tickets found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="to-table">
                    <thead><tr>{['Booking ID','Movie','Date & Time','Seats','Amount','Payment','Status','Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredTickets.map(b => (
                        <tr key={b.id}>
                          <td><span style={{ fontFamily:'monospace', fontSize:11, color:'rgba(241,245,249,0.5)', background:'rgba(99,102,241,0.08)', padding:'3px 8px', borderRadius:6 }}>BMS-{b.id.slice(0,8).toUpperCase()}</span></td>
                          <td><span style={{ color:'#f1f5f9', fontSize:12, fontWeight:700 }}>{b.movieTitle}</span></td>
                          <td>
                            <p style={{ color:'rgba(241,245,249,0.7)', fontSize:11 }}>{b.showDate}</p>
                            <p style={{ color:'rgba(241,245,249,0.35)', fontSize:11 }}>{b.showTime}</p>
                          </td>
                          <td><div className="flex flex-wrap gap-1">{b.seats.map(s => <span key={s} style={{ fontSize:10, background:'rgba(168,85,247,0.12)', color:'#c084fc', border:'1px solid rgba(168,85,247,0.25)', padding:'2px 6px', borderRadius:5, fontFamily:'monospace' }}>{s}</span>)}</div></td>
                          <td><span style={{ color:'#34d399', fontWeight:800, fontSize:13 }}>\u20b9{b.finalAmount}</span>{b.discount>0&&<p style={{ color:'rgba(241,245,249,0.3)', fontSize:10, textDecoration:'line-through' }}>\u20b9{b.totalAmount}</p>}</td>
                          <td><span style={{ color:'rgba(241,245,249,0.4)', fontSize:11 }}>{b.paymentMethod}</span></td>
                          <td>
                            <span className={`to-pill ${b.status==='confirmed'?'stat-running':b.status==='cancelled'?'stat-full':'stat-gold'}`} style={{ border:'1px solid', borderRadius:100, padding:'4px 10px', fontSize:10, fontWeight:800 }}>
                              {b.status==='confirmed'?'\u2714 Confirmed':b.status==='cancelled'?'\u2715 Cancelled':'\u23f3 Pending'}
                            </span>
                            {b.status==='cancelled'&&b.cancelledAt&&<p style={{ color:'rgba(241,245,249,0.3)', fontSize:10, marginTop:2 }}>Refund: \u20b9{b.refundAmount??b.finalAmount}</p>}
                          </td>
                          <td>{b.status==='confirmed'&&<button onClick={()=>setCancelTicketId(b.id)} className="to-btn-danger" style={{ borderRadius:100, fontSize:11 }}>{Ic.cancel} Cancel</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}"""

new_section = """        {/* ════════════════════ TICKETS ════════════════════ */}
        {tab === 'tickets' && (
          <div className="space-y-6" style={{ animation:'slideIn 0.5s ease both' }}>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:'Total Bookings', numVal:myBookings.length,  kpi:'kpi-indigo',  ico:'icon-indigo',  icon:Ic.tickets, spark:[60,70,55,80,65,90,75], accent:'#818cf8' },
                { label:'Confirmed',      numVal:confirmedCount,      kpi:'kpi-emerald', ico:'icon-emerald', icon:Ic.check,   spark:[30,55,70,45,80,65,90], accent:'#34d399' },
                { label:'Cancelled',      numVal:cancelledCount,      kpi:'kpi-pink',    ico:'icon-pink',    icon:Ic.cancel,  spark:[20,40,30,55,35,45,30], accent:'#f472b6' },
              ].map((s,i) => (
                <div key={i} className={`to-kpi-card ${s.kpi}`} style={{ animation:`kpiEntry 0.5s ease both`, animationDelay:`${i*0.1}s`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${s.accent}, transparent)`, opacity:0.7 }}/>
                  <div className={`to-kpi-icon ${s.ico}`} style={{ width:42,height:42,borderRadius:14,marginBottom:14 }}>{s.icon}</div>
                  <p className="to-kpi-value" style={{ fontSize:'2rem', color:s.accent }}><AnimCounter value={s.numVal}/></p>
                  <p className="to-kpi-label" style={{ marginTop:4 }}>{s.label}</p>
                  <div className="to-kpi-sparkline">{s.spark.map((h,j) => <div key={j} className="to-spark-bar" style={{ height:`${h}%`, animationDelay:`${j*0.05}s` }}/>)}</div>
                </div>
              ))}
            </div>

            {/* ── Revenue Summary Banner ── */}
            <div style={{
              background:'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 50%, rgba(52,211,153,0.08) 100%)',
              border:'1px solid rgba(168,85,247,0.22)',
              borderRadius:20,
              padding:'18px 24px',
              display:'flex', flexWrap:'wrap', gap:20, alignItems:'center',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(168,85,247,0.07)', pointerEvents:'none' }}/>
              <div>
                <p style={{ color:'rgba(241,245,249,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Total Revenue</p>
                <p style={{ color:'#34d399', fontWeight:900, fontSize:'1.9rem', fontFamily:"'Outfit',sans-serif", lineHeight:1.1 }}>\u20b9<AnimCounter value={totalRevenue}/></p>
              </div>
              <div style={{ width:1, height:44, background:'rgba(255,255,255,0.08)', flexShrink:0 }}/>
              {[
                { label:'Avg. Ticket',    val: confirmedCount>0 ? `\u20b9${Math.round(totalRevenue/confirmedCount)}` : '\u2014', color:'#818cf8' },
                { label:'Seat Yield',     val: myBookings.length>0 ? `${Math.round((confirmedCount/myBookings.length)*100)}%` : '\u2014', color:'#22d3ee' },
                { label:'Pending Refund', val: `\u20b9${myBookings.filter(b=>b.status==='cancelled').reduce((s,b)=>s+(b.refundAmount??b.finalAmount),0)}`, color:'#f472b6' },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ color:'rgba(241,245,249,0.35)', fontSize:11, fontWeight:600 }}>{item.label}</p>
                  <p style={{ color:item.color, fontWeight:800, fontSize:17, fontFamily:"'Outfit',sans-serif" }}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* ── Search / Filter Bar ── */}
            <div className="to-glass-panel" style={{ padding:'16px 20px' }}>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-52">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(168,85,247,0.55)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input type="text" placeholder="Search by movie title or booking ID\u2026" value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)} className="to-input" style={{ paddingLeft:38, borderRadius:14 }}/>
                </div>
                <div className="flex gap-2" style={{ flexShrink:0 }}>
                  {(['all','confirmed','cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)} style={{
                      padding:'8px 18px', borderRadius:100, fontSize:12, fontWeight:700,
                      background: ticketFilter===f ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.04)',
                      color: ticketFilter===f ? '#fff' : 'rgba(241,245,249,0.45)',
                      border: ticketFilter===f ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: ticketFilter===f ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                      cursor:'pointer', transition:'all 0.25s ease', textTransform:'capitalize',
                    }}>{f}</button>
                  ))}
                </div>
                <span style={{ color:'rgba(241,245,249,0.3)', fontSize:12, marginLeft:'auto' }}>{filteredTickets.length} result{filteredTickets.length!==1?'s':''}</span>
              </div>
            </div>

            {/* ── Ticket Cards ── */}
            {filteredTickets.length === 0 ? (
              <div className="to-glass-panel">
                <div className="to-empty" style={{ padding:60 }}>
                  <div className="to-empty-icon" style={{ fontSize:48 }}>\U0001f39f\ufe0f</div>
                  <p style={{ color:'rgba(241,245,249,0.35)', fontSize:14 }}>No tickets match your filter</p>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {filteredTickets.map((b, idx) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const statusColor  = isConfirmed ? '#34d399' : isCancelled ? '#f472b6' : '#fbbf24';
                  const statusBg     = isConfirmed ? 'rgba(52,211,153,0.10)' : isCancelled ? 'rgba(244,114,182,0.10)' : 'rgba(251,191,36,0.10)';
                  const statusBorder = isConfirmed ? 'rgba(52,211,153,0.30)' : isCancelled ? 'rgba(244,114,182,0.30)' : 'rgba(251,191,36,0.30)';
                  const statusLabel  = isConfirmed ? '\u2714 Confirmed' : isCancelled ? '\u2715 Cancelled' : '\u23f3 Pending';
                  return (
                    <div key={b.id} style={{
                      background:'rgba(255,255,255,0.025)',
                      border:'1px solid rgba(255,255,255,0.07)',
                      borderRadius:20,
                      overflow:'hidden',
                      transition:'transform 0.2s ease, box-shadow 0.2s ease',
                      animation:'kpiEntry 0.45s ease both',
                      animationDelay:`${idx*0.04}s`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(99,102,241,0.18)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                    >
                      {/* Colored top stripe */}
                      <div style={{ height:2, background:`linear-gradient(90deg,${statusColor}55,${statusColor},${statusColor}55)` }}/>
                      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'stretch' }}>

                        {/* LEFT – Movie + ID */}
                        <div style={{ flex:'1 1 220px', padding:'18px 22px', borderRight:'1px dashed rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:8 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor, boxShadow:`0 0 8px ${statusColor}` }}/>
                            <span style={{ fontFamily:'monospace', fontSize:10, color:'rgba(241,245,249,0.35)', letterSpacing:'0.05em' }}>BKG-{b.id.slice(0,10).toUpperCase()}</span>
                          </div>
                          <p style={{ color:'#f1f5f9', fontWeight:800, fontSize:15, fontFamily:"'Outfit',sans-serif", lineHeight:1.2 }}>{b.movieTitle}</p>
                          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:2 }}>
                            <span style={{ fontSize:11, color:'rgba(241,245,249,0.45)', display:'flex', alignItems:'center', gap:4 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:11, height:11 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {b.showDate}
                            </span>
                            <span style={{ fontSize:11, color:'rgba(241,245,249,0.45)', display:'flex', alignItems:'center', gap:4 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:11, height:11 }}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                              {b.showTime}
                            </span>
                          </div>
                        </div>

                        {/* MIDDLE – Seats */}
                        <div style={{ flex:'1 1 180px', padding:'18px 22px', borderRight:'1px dashed rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
                          <p style={{ color:'rgba(241,245,249,0.3)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Seats</p>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                            {b.seats.map(s => (
                              <span key={s} style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, background:'rgba(168,85,247,0.12)', color:'#c084fc', border:'1px solid rgba(168,85,247,0.3)', padding:'3px 8px', borderRadius:6 }}>{s}</span>
                            ))}
                          </div>
                          <p style={{ color:'rgba(241,245,249,0.25)', fontSize:10 }}>{b.seats.length} seat{b.seats.length!==1?'s':''}</p>
                        </div>

                        {/* RIGHT – Amount + Status */}
                        <div style={{ flex:'0 1 200px', padding:'18px 22px', display:'flex', flexDirection:'column', justifyContent:'space-between', gap:10 }}>
                          <div>
                            <p style={{ color:'rgba(241,245,249,0.3)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Amount</p>
                            <p style={{ color:'#34d399', fontWeight:900, fontSize:22, fontFamily:"'Outfit',sans-serif", lineHeight:1.1 }}>\u20b9{b.finalAmount}</p>
                            {b.discount>0 && (
                              <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:3 }}>
                                <span style={{ color:'rgba(241,245,249,0.25)', fontSize:10, textDecoration:'line-through' }}>\u20b9{b.totalAmount}</span>
                                <span style={{ fontSize:10, color:'#34d399', fontWeight:700, background:'rgba(52,211,153,0.1)', padding:'1px 6px', borderRadius:100 }}>-{Math.round(b.discount/(b.totalAmount||1)*100)}%</span>
                              </div>
                            )}
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width:11, height:11, color:'rgba(241,245,249,0.3)' }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                              <span style={{ color:'rgba(241,245,249,0.35)', fontSize:10 }}>{b.paymentMethod || 'Online'}</span>
                            </div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'5px 12px', borderRadius:100, fontSize:11, fontWeight:800, background:statusBg, border:`1px solid ${statusBorder}`, color:statusColor, letterSpacing:'0.04em' }}>{statusLabel}</span>
                            {isCancelled && b.cancelledAt && (
                              <p style={{ color:'rgba(241,245,249,0.25)', fontSize:10 }}>Refund: \u20b9{b.refundAmount??b.finalAmount}</p>
                            )}
                            {isConfirmed && (
                              <button onClick={() => setCancelTicketId(b.id)}
                                style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5, padding:'5px 12px', borderRadius:100, fontSize:11, fontWeight:700, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.25)', color:'#f472b6', cursor:'pointer', transition:'all 0.2s ease' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(244,114,182,0.18)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(244,114,182,0.08)'; }}
                              >{Ic.cancel} Cancel Ticket</button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}"""

if old_section in content:
    content = content.replace(old_section, new_section, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Tickets section replaced!")
else:
    # Try with CRLF
    old_crlf = old_section.replace('\n', '\r\n')
    if old_crlf in content:
        new_crlf = new_section.replace('\n', '\r\n')
        content = content.replace(old_crlf, new_crlf, 1)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS (CRLF): Tickets section replaced!")
    else:
        # Line-based replacement
        lines = content.splitlines(keepends=True)
        start_marker = "        {/* \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TICKETS \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}"
        end_marker = "        {/* \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SCANNER \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}"
        start_idx = None
        end_idx = None
        for i, line in enumerate(lines):
            if start_marker in line and start_idx is None:
                start_idx = i
            if end_marker in line and start_idx is not None:
                end_idx = i
                break
        if start_idx is not None and end_idx is not None:
            new_lines = lines[:start_idx] + [new_section + '\n\n'] + lines[end_idx:]
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f"SUCCESS (line-based): replaced lines {start_idx+1}–{end_idx}")
        else:
            print(f"FAILED: could not locate section. start={start_idx}, end={end_idx}")
