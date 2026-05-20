import { useState } from 'react'

const NODES = [
  { id: 'you',      x: 15,  y: 60,  w: 130, h: 55,  label: 'You',       icon: '👤', color: '#22c55e', bg: '#064e3b', desc: 'You interact with Hermes via Telegram. Send messages, ask questions, request tasks. Hermes responds with full context from past conversations.' },
  { id: 'telegram', x: 15,  y: 155, w: 130, h: 55,  label: 'Telegram',  icon: '💬', color: '#818cf8', bg: '#1e1b4b', desc: 'Your messaging platform. Messages are routed to Hermes Agent for AI processing. Supports text, images, files & voice.' },
  { id: 'hermes',   x: 210, y: 95,  w: 150, h: 80,  label: 'Hermes Agent', icon: '🧠', color: '#a78bfa', bg: '#2e1065', desc: 'The AI brain — powered by deepseek-v4-flash on OpenRouter. Decides which tools to use, reads/writes memory, and responds intelligently to every prompt.' },
  { id: 'skills',   x: 425, y: 15,  w: 170, h: 100, label: 'Skills & Tools', icon: '🔧', color: '#fbbf24', bg: '#451a03', desc: 'Modular capabilities: Calendar (Google), GitHub (repos/commits), Research (arXiv), Memory (persistent), Files (read/write/search), Terminal (shell) and more.' },
  { id: 'cron',     x: 425, y: 145, w: 170, h: 55,  label: 'Cron Jobs', icon: '⏰', color: '#67e8f9', bg: '#083344', desc: 'Background tasks: daily summaries at 6/12/17 SGT, vault health checks, dreaming engine, and messages watchdog every hour.' },
  { id: 'vault',    x: 210, y: 215, w: 150, h: 55,  label: 'Obsidian Vault', icon: '📓', color: '#c084fc', bg: '#3b0764', desc: 'Your knowledge base — 95 notes across 26 folders: daily logs, lesson plans, finances, projects, research, reading. Read for contextual suggestions.' },
  { id: 'kb',       x: 15,  y: 215, w: 130, h: 55,  label: 'Knowledge Base', icon: '💾', color: '#f472b6', bg: '#4c0519', desc: 'Persistent memory across sessions. Stores your profile, environment facts, and learned preferences. Injected into every conversation.' },
  { id: 'dashboard', x: 425, y: 240, w: 170, h: 55,  label: 'Dashboard', icon: '📊', color: '#2dd4bf', bg: '#134e4a', desc: 'This page — Visual OS. Shows model usage, vault graph, calendar, suggestions, live messages, ROI tracking. Hosted on VPS port 3001 + Vercel.' },
  { id: 'vps',      x: 625, y: 130, w: 105, h: 55,  label: 'VPS Server', icon: '🖥️', color: '#94a3b8', bg: '#1e293b', desc: 'Your server at 43.156.249.23. Runs Hermes Agent, Next.js dashboard (port 3001), and all cron jobs. Code lives at ~/visual-os/.' },
]

const SKILL_LABELS = ['Calendar', 'GitHub', 'Research', 'Memory', 'Files', 'Terminal']

const ARROWS = [
  { from: 'you',   to: 'telegram', label: 'Messages' },
  { from: 'telegram', to: 'you',   label: 'Replies' },
  { from: 'telegram', to: 'hermes', label: 'Prompts' },
  { from: 'hermes',   to: 'telegram', label: 'Responses' },
  { from: 'hermes',   to: 'skills',   label: 'Calls tools' },
  { from: 'hermes',   to: 'kb',       label: 'Read/Writes' },
  { from: 'hermes',   to: 'vault',    label: 'Reads' },
  { from: 'hermes',   to: 'dashboard', label: 'Data push' },
  { from: 'cron',     to: 'hermes',   label: 'Triggers' },
  { from: 'vps',      to: 'hermes',   label: 'Runs' },
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
  const cx = (sx + ex) / 2, cy = (sy + ey) / 2
  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
}

function arrowLabelPos(from: string, to: string) {
  const f = NODES.find(x => x.id === from)!
  const t = NODES.find(x => x.id === to)!
  return { x: (f.x + f.w/2 + t.x + t.w/2) / 2, y: (f.y + f.h/2 + t.y + t.h/2) / 2 - 12 }
}

export default function HermesFlow() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const selectedNode = NODES.find(n => n.id === selected)
  const isHighlighted = (id: string) => {
    if (!selected && !hovered) return true
    const active = selected || hovered
    if (id === active) return true
    return ARROWS.some(a => (a.from === active && a.to === id) || (a.to === active && a.from === id))
  }

  return (
    <div className="glass-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 26 }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              <span className="title-gradient">How Hermes Works</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#aab' }}>
              Architecture overview — click any component to learn more
            </p>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 760 330" style={{ width: '100%', height: 'auto', display: 'block', marginBottom: -4 }}>
        <defs>
          <filter id="hf-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.6" />
          </filter>
          <marker id="hf-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#7777bb" />
          </marker>
          <marker id="hf-arrow-active" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#c4b5fd" />
          </marker>
        </defs>

        {/* Diagram background */}
        <rect x="0" y="0" width="760" height="330" fill="#07070b" rx="0" />

        {/* Arrows */}
        {ARROWS.map(a => {
          const hl = isHighlighted(a.from) && isHighlighted(a.to)
          const path = arrowPath(a.from, a.to)
          const lp = arrowLabelPos(a.from, a.to)
          return (
            <g key={`${a.from}-${a.to}`}>
              <path d={path} fill="none"
                stroke={hl ? '#c4b5fd' : '#5a5a8a'}
                strokeWidth={hl ? 2.5 : 1.5}
                strokeOpacity={hl ? 1 : 0.5}
                strokeDasharray={hl ? 'none' : '6 4'}
                markerEnd={hl ? 'url(#hf-arrow-active)' : 'url(#hf-arrow)'}
                style={{ transition: 'all 0.3s' }}
              />
              <text x={lp.x} y={lp.y}
                fill={hl ? '#ddd6fe' : '#8888bb'}
                  fontSize={10} textAnchor="middle" fontWeight={hl ? 700 : 500}
                style={{ transition: 'all 0.3s' }}>
                {a.label}
              </text>
            </g>
          )
        })}

        {/* Skill sub-labels */}
        {SKILL_LABELS.map((s, i) => (
          <text key={s} x={433} y={47 + i * 13} fill="#e2e8f0" fontSize={10} fontWeight={600}>▸ {s}</text>
        ))}
        <text x={433} y={102} fill="#94a3b8" fontSize={9} fontStyle="italic">+ 20 more tools</text>

        {/* Nodes */}
        {NODES.map(n => {
          const hl = isHighlighted(n.id)
          const isSelected = selected === n.id
          const dimmed = (selected || hovered) && !hl

          return (
            <g key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(isSelected ? null : n.id)}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.3s' }}
            >
              {/* Main card — SOLID visible background */}
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} ry={10}
                fill={n.bg}
                stroke={isSelected ? n.color : (hl ? n.color + 'cc' : n.color + '60')}
                strokeWidth={isSelected ? 2.5 : (hl ? 2 : 1.5)}
                filter="url(#hf-shadow)"
                style={{ transition: 'all 0.3s' }}
              />

              {/* Glow border on select */}
              {isSelected && (
                <rect x={n.x - 2} y={n.y - 2} width={n.w + 4} height={n.h + 4} rx={12} ry={12}
                  fill="none" stroke={n.color} strokeWidth={2} strokeOpacity={0.6} />
              )}

              {/* Icon */}
              <text x={n.x + 18} y={n.y + n.h / 2 + 6} fontSize={22} textAnchor="middle" dominantBaseline="middle">
                {n.icon}
              </text>

              {/* Label */}
              <text x={n.x + 40} y={n.y + n.h / 2 + 2}
                fill={isSelected ? '#fff' : (hl ? '#fff' : '#e2e8f0')}
                fontSize={isSelected ? 13 : 12}
                fontWeight={isSelected ? 700 : 600}
                style={{ transition: 'all 0.3s' }}>
                {n.label}
              </text>
            </g>
          )
        })}

        {/* VPS IP */}
        <text x={677} y={200} fill="#94a3b8" fontSize={11} textAnchor="middle">43.156.249.23</text>
      </svg>

      {/* Info panel */}
      {selectedNode && (
        <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: selectedNode.bg }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 32 }}>{selectedNode.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: selectedNode.color }}>
                  {selectedNode.label}
                </span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4,
                  background: selectedNode.color + '25', color: selectedNode.color,
                  border: `1px solid ${selectedNode.color}40` }}>
                  Click again to close
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontWeight: 400 }}>
                {selectedNode.desc}
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '4px 10px', borderRadius: 8, lineHeight: 1.2, flexShrink: 0 }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 11, color: '#8888bb', display: 'flex', justifyContent: 'space-between' }}>
        <span>Hover to highlight · Click for details</span>
        <span>{NODES.length} components · {ARROWS.length} connections</span>
      </div>
    </div>
  )
}
