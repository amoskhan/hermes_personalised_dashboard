import { useState } from 'react'

const NODES = [
  { id: 'you',       x: 40,  y: 40,  w: 160, h: 50,  label: 'You',          icon: '👤', color: '#22c55e', bg: '#064e3b', desc: 'You interact with Hermes via Telegram. Send voice notes, text, or requests — Hermes responds with full context from past conversations.' },
  { id: 'telegram',  x: 40,  y: 120, w: 160, h: 50,  label: 'Telegram',     icon: '💬', color: '#818cf8', bg: '#1e1b4b', desc: 'Your messaging platform. Messages are routed to Hermes Agent for AI processing. Supports voice notes, images, and links.' },
  { id: 'hermes',    x: 270, y: 50,  w: 200, h: 100,  label: 'Hermes Agent', icon: '🧠', color: '#a78bfa', bg: '#2e1065', desc: 'The AI brain — powered by your active model. Decides which tools to call, reads/writes memory, and responds intelligently to your requests.' },
  { id: 'cron',      x: 270, y: 220, w: 200, h: 50,  label: 'Cron Jobs',    icon: '⏰', color: '#67e8f9', bg: '#083344', desc: 'Background automations: Daily Standup Briefing (7am), Vault Pipeline (7:10am), Dreaming Engine (6am), Weekly Synthesis (Sunday).' },
  { id: 'skills',    x: 540, y: 30,  w: 200, h: 80,  label: 'Skills & Tools', icon: '🔧', color: '#fbbf24', bg: '#451a03', desc: 'Calendar, GitHub, Research, Memory, Files, Terminal, Maps, Spotify, YouTube, and 20+ more tools — each a specialized capability.' },
  { id: 'vault',     x: 540, y: 130, w: 200, h: 50,  label: 'Obsidian Vault', icon: '📓', color: '#c084fc', bg: '#3b0764', desc: 'Your knowledge base — 95+ notes in flat Karpathy-style structure. Daily notes, wiki entities, research, lesson plans.' },
  { id: 'kb',        x: 540, y: 200, w: 200, h: 50,  label: 'Knowledge Base', icon: '💾', color: '#f472b6', bg: '#4c0519', desc: 'Persistent memory across sessions. Stores your profile, environment facts, preferences, and project conventions.' },
  { id: 'dashboard', x: 540, y: 270, w: 200, h: 50,  label: 'Dashboard',    icon: '📊', color: '#2dd4bf', bg: '#134e4a', desc: 'Visual OS — model usage, vault graph, calendar, badminton training, live messages, dreaming engine suggestions.' },
  { id: 'vps',       x: 40,  y: 350, w: 700, h: 50,  label: 'VPS Server',   icon: '🖥️', color: '#94a3b8', bg: '#1e293b', desc: 'Your server at 43.156.249.23. Runs Hermes, the dashboard (port 3001), cron jobs, and git sync for the Obsidian vault.' },
]

const SKILL_LABELS = ['Calendar', 'GitHub', 'Research', 'Memory', 'Files']

const ARROWS = [
  { from: 'you',   to: 'telegram', label: 'Messages' },
  { from: 'telegram', to: 'you',   label: 'Replies' },
  { from: 'telegram', to: 'hermes', label: 'Prompts' },
  { from: 'hermes',   to: 'telegram', label: 'Responses' },
  { from: 'hermes',   to: 'skills',   label: 'Calls tools',   labelY: -20 },
  { from: 'hermes',   to: 'vault',    label: 'Reads & writes', labelY: -5 },
  { from: 'hermes',   to: 'kb',       label: 'Read/Writes',    labelY: 0 },
  { from: 'hermes',   to: 'dashboard', label: 'Data push',     labelY: 10 },
  { from: 'cron',     to: 'hermes',   label: 'Triggers' },
  { from: 'vps',      to: 'hermes',   label: 'Runs', labelY: -10 },
  { from: 'vps',      to: 'dashboard', label: 'Hosts' },
  { from: 'vps',      to: 'cron',     label: 'Schedules' },
]

function getEdge(id: string, side: 'left' | 'right' | 'top' | 'bottom'): [number, number] {
  const n = NODES.find(x => x.id === id)!
  if (side === 'left')   return [n.x,         n.y + n.h / 2]
  if (side === 'right')  return [n.x + n.w,   n.y + n.h / 2]
  if (side === 'top')    return [n.x + n.w/2, n.y]
  if (side === 'bottom') return [n.x + n.w/2, n.y + n.h]
  return [n.x + n.w/2, n.y + n.h/2]
}

function arrowPath(from: string, to: string): string {
  const f = NODES.find(x => x.id === from)!
  const t = NODES.find(x => x.id === to)!
  const fcx = f.x + f.w / 2, fcy = f.y + f.h / 2
  const tcx = t.x + t.w / 2, tcy = t.y + t.h / 2
  const dx = tcx - fcx, dy = tcy - fcy

  let fSide: 'left' | 'right' | 'top' | 'bottom'
  let tSide: 'left' | 'right' | 'top' | 'bottom'
  if (Math.abs(dx) > Math.abs(dy)) {
    fSide = dx > 0 ? 'right' : 'left'
    tSide = dx > 0 ? 'left' : 'right'
  } else {
    fSide = dy > 0 ? 'bottom' : 'top'
    tSide = dy > 0 ? 'top' : 'bottom'
  }
  const [sx, sy] = getEdge(from, fSide)
  const [ex, ey] = getEdge(to, tSide)

  const cx = (sx + ex) / 2
  const cy = (sy + ey) / 2
  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
}

function arrowLabelPos(from: string, to: string, labelYOffset = 0) {
  const f = NODES.find(x => x.id === from)!
  const t = NODES.find(x => x.id === to)!
  const offset = labelYOffset * (f.id === 'hermes' ? 1.5 : 1)
  return { x: (f.x + f.w/2 + t.x + t.w/2) / 2, y: (f.y + f.h/2 + t.y + t.h/2) / 2 - 14 + offset }
}

export default function HermesFlow() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipNode, setTooltipNode] = useState<typeof NODES[0] | null>(null)

  const selectedNode = NODES.find(n => n.id === selected)
  const hoverInfo = tooltipNode || selectedNode

  const isHighlighted = (id: string) => {
    if (!selected && !hovered) return true
    const active = selected || hovered
    if (id === active) return true
    return ARROWS.some(a => (a.from === active && a.to === id) || (a.to === active && a.from === id))
  }

  return (
    <div className="glass-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 30 }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              <span className="title-gradient">How Hermes Works</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#aab' }}>
              Architecture overview — hover to explore · click to pin
            </p>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 1040 420" preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 520 }}>
        <defs>
          <filter id="hf-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.6" />
          </filter>
          <marker id="hf-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#8888cc" />
          </marker>
          <marker id="hf-arrow-active" markerWidth="7" markerHeight="5.5" refX="7" refY="2.75" orient="auto">
            <polygon points="0 0, 7 2.75, 0 5.5" fill="#c4b5fd" />
          </marker>
        </defs>

        <rect x="0" y="0" width="1040" height="420" fill="#07070b" rx="0" />

        {/* Zone boxes */}
        {[
          { x: 20, y: 15, w: 200, h: 180, nodes: ['you', 'telegram'] },
          { x: 250, y: 15, w: 240, h: 270, nodes: ['hermes', 'cron'] },
          { x: 520, y: 15, w: 240, h: 320, nodes: ['skills', 'vault', 'kb', 'dashboard'] },
          { x: 20, y: 335, w: 740, h: 80, nodes: ['vps'] },
        ].map(z => {
          const zoneHovered = (hovered || selected) && z.nodes.includes(hovered || selected!)
          return (
            <rect key={z.x + '' + z.y}
              x={z.x} y={z.y} width={z.w} height={z.h}
              rx="10" fill="none"
              stroke={zoneHovered ? '#ffffff18' : '#ffffff06'}
              strokeWidth={zoneHovered ? 1.5 : 1}
              style={{ transition: 'stroke 0.3s, strokeWidth 0.3s' }}
            />
          )
        })}

        {/* Zone labels */}
        {[
          { x: 120, y: 35, text: 'USER', nodes: ['you', 'telegram'] },
          { x: 370, y: 35, text: 'AGENT & AUTOMATIONS', nodes: ['hermes', 'cron'] },
          { x: 640, y: 35, text: 'TOOLS & DATA', nodes: ['skills', 'vault', 'kb', 'dashboard'] },
          { x: 390, y: 355, text: 'INFRASTRUCTURE', nodes: ['vps'] },
        ].map(z => {
          const za = (hovered || selected) && z.nodes.includes(hovered || selected!)
          return (
            <text key={z.text} x={z.x} y={z.y}
              fill={za ? '#8888cc' : '#555578'}
              fontSize={11} textAnchor="middle" fontWeight={600} letterSpacing="2.5"
              style={{ transition: 'fill 0.3s' }}>
              {z.text}
            </text>
          )
        })}

        {/* Arrows */}
        {ARROWS.map(a => {
          const hl = isHighlighted(a.from) && isHighlighted(a.to)
          const path = arrowPath(a.from, a.to)
          const lp = arrowLabelPos(a.from, a.to, (a as any).labelY ?? 0)
          return (
            <g key={`${a.from}-${a.to}`}>
              <path d={path} fill="none"
                stroke={hl ? '#c4b5fd' : '#6666aa'}
                strokeWidth={hl ? 2.5 : 1.3}
                strokeOpacity={hl ? 1 : 0.5}
                markerEnd={hl ? 'url(#hf-arrow-active)' : 'url(#hf-arrow)'}
                style={{ transition: 'all 0.3s' }}
              />
              <text x={lp.x} y={lp.y}
                fill={hl ? '#ddd6fe' : '#9999bb'}
                fontSize={8.5} textAnchor="middle" fontWeight={hl ? 700 : 500}
                style={{ transition: 'all 0.3s' }}>
                {a.label}
              </text>
            </g>
          )
        })}

        {/* Skill sub-labels */}
        {SKILL_LABELS.map((s, i) => {
          const sh = hovered === 'skills' || selected === 'skills'
          return (
            <text key={s} x={565} y={56 + i * 14}
              fill={sh ? '#e2e8f0' : '#94a3b8'}
              fontSize={10} fontWeight={sh ? 700 : 600}
              style={{ transition: 'all 0.3s' }}>
              {sh ? '▶' : '▸'} {s}
            </text>
          )
        })}
        <text x={700} y={92} fill="#94a3b8" fontSize={9} fontStyle="italic">+ 20 more tools</text>

        {/* Sub-label highlights */}
        {[
          { id: 'vault', x: 565, y: 165, text: '📕 95+ notes · Karpathy-style', color: '#c084fc' },
          { id: 'kb', x: 565, y: 235, text: '📎 Session memory · profile', color: '#f472b6' },
          { id: 'dashboard', x: 565, y: 305, text: '📈 Live widgets · clickable', color: '#2dd4bf' },
          { id: 'cron', x: 290, y: 255, text: '⏰ 07:00 + 07:10 AM daily', color: '#67e8f9' },
        ].map(s => (
          <text key={s.id} x={s.x} y={s.y}
            fill={(hovered || selected) === s.id ? s.color : '#94a3b8'}
            fontSize={9} style={{ transition: 'fill 0.3s' }}>
            {s.text}
          </text>
        ))}

        {/* Nodes */}
        {NODES.map(n => {
          const hl = isHighlighted(n.id)
          const isHovered = hovered === n.id
          const isSelected = selected === n.id
          const dimmed = (selected || hovered) && !hl
          const active = isHovered || isSelected

          return (
            <g key={n.id}
              onMouseEnter={() => { setHovered(n.id); setTooltipNode(n) }}
              onMouseLeave={() => { setHovered(null); setTooltipNode(null) }}
              onClick={() => setSelected(isSelected ? null : n.id)}
              style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
              opacity={dimmed ? 0.25 : 1}
            >
              {/* Outer glow ring on active */}
              {active && (
                <rect x={n.x - 8} y={n.y - 8} width={n.w + 16} height={n.h + 16}
                  rx={14} ry={14} fill="none" stroke={n.color} strokeWidth={2}
                  strokeOpacity={0.2} style={{ transition: 'all 0.3s' }} />
              )}

              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} ry={10}
                fill={n.bg}
                stroke={isSelected ? '#fff' : (isHovered ? n.color : n.color + '50')}
                strokeWidth={isSelected ? 2.5 : (isHovered ? 2 : 1)}
                filter="url(#hf-shadow)"
                style={{ transition: 'stroke 0.3s, strokeWidth 0.3s' }}
              />

              <text x={n.x + 20} y={n.y + n.h / 2 + 6}
                fontSize={20} textAnchor="middle" dominantBaseline="middle">
                {n.icon}
              </text>

              <text x={n.x + 38} y={n.y + n.h / 2 + 1}
                fill={active ? '#fff' : '#e2e8f0'}
                fontSize={11} fontWeight={active ? 700 : 600}
                style={{ transition: 'fill 0.3s' }}>
                {isHovered ? `→ ${n.label}` : n.label}
              </text>
            </g>
          )
        })}

        {/* VPS IP */}
        <text x={390} y={395}
          fill={(hovered || selected) === 'vps' ? '#94a3b8' : '#64748b'}
          fontSize={8} textAnchor="middle" style={{ transition: 'fill 0.3s' }}>
          43.156.249.23
        </text>
      </svg>

      {/* ─── Hover / Selected Info Bar ─── */}
      {hoverInfo && (
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${hoverInfo.bg} 0%, rgba(15,10,25,0.95) 100%)`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          animation: 'hfFadeIn 0.15s ease-out',
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{hoverInfo.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: hoverInfo.color }}>
                {hoverInfo.label}
              </span>
              {/* Show connections count badge */}
              <span style={{
                fontSize: 9, padding: '1px 7px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', color: '#8888bb',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {ARROWS.filter(a => a.from === hoverInfo.id || a.to === hoverInfo.id).length} connections
              </span>
              {selected === hoverInfo.id && (
                <span style={{ fontSize: 9, color: '#8888bb' }}>· pinned · click again to close</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#cccce0', lineHeight: 1.5 }}>
              {hoverInfo.desc}
            </div>
            {/* Connection chips (only when pinned / selected) */}
            {selected === hoverInfo.id && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ARROWS.filter(a => a.from === hoverInfo.id).map(a => (
                  <span key={a.to} style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: '#aaaacc'
                  }}>
                    → {NODES.find(n => n.id === a.to)?.label || a.to}: {a.label}
                  </span>
                ))}
                {ARROWS.filter(a => a.to === hoverInfo.id).map(a => (
                  <span key={a.from} style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: '#aaaacc'
                  }}>
                    ← {NODES.find(n => n.id === a.from)?.label || a.from}: {a.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Close button — only when pinned */}
          {selected === hoverInfo.id && (
            <button onClick={() => setSelected(null)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#ccc', cursor: 'pointer', fontSize: 18,
                padding: '2px 10px', borderRadius: 6, lineHeight: 1.2, flexShrink: 0
              }}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 12, color: '#8888bb', display: 'flex', justifyContent: 'space-between'
      }}>
        <span>👆 Hover for info · Click to pin details</span>
        <span>{NODES.length} components · {ARROWS.length} connections</span>
      </div>

      <style>{`
        @keyframes hfFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
