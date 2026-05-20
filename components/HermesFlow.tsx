import { useState } from 'react'

const NODES = [
  { id: 'you',      x: 20,  y: 60,  w: 110, h: 50,  label: 'You',       icon: '👤', color: '#22c55e', desc: 'You interact with Hermes via Telegram. Send messages, ask questions, request tasks. Hermes responds with full context from past conversations.' },
  { id: 'telegram', x: 20,  y: 150, w: 110, h: 50,  label: 'Telegram',  icon: '💬', color: '#6366f1', desc: 'Your messaging platform. Messages are routed to Hermes Agent for AI processing. Supports text, images, files & voice.' },
  { id: 'hermes',   x: 200, y: 95,  w: 130, h: 70,  label: 'Hermes Agent', icon: '🧠', color: '#818cf8', desc: 'The AI brain — powered by deepseek-v4-flash on OpenRouter. Decides which tools to use, reads/writes memory, and responds intelligently to every prompt.' },
  { id: 'skills',   x: 400, y: 20,  w: 150, h: 90,  label: 'Skills & Tools', icon: '🔧', color: '#f59e0b', desc: 'Modular capabilities: Calendar (Google), GitHub (repos/commits), Research (arXiv), Memory (persistent), Files (read/write/search), Terminal (shell) and more.' },
  { id: 'cron',     x: 400, y: 145, w: 150, h: 50,  label: 'Cron Jobs', icon: '⏰', color: '#06b6d4', desc: 'Background tasks: daily summaries at 6/12/17 SGT, vault health checks, dreaming engine, and messages watchdog every hour.' },
  { id: 'vault',    x: 200, y: 210, w: 130, h: 50,  label: 'Obsidian Vault', icon: '📓', color: '#8b5cf6', desc: 'Your knowledge base — 95 notes across 26 folders: daily logs, lesson plans, finances, projects, research, reading. Read for contextual suggestions.' },
  { id: 'kb',       x: 20,  y: 210, w: 110, h: 50,  label: 'Knowledge Base', icon: '💾', color: '#ec4899', desc: 'Persistent memory across sessions. Stores your profile, environment facts, and learned preferences. Injected into every conversation.' },
  { id: 'dashboard', x: 400, y: 235, w: 150, h: 50,  label: 'Dashboard', icon: '📊', color: '#14b8a6', desc: 'This page — Visual OS. Shows model usage, vault graph, calendar, suggestions, live messages, ROI tracking. Hosted on VPS port 3001 + Vercel.' },
  { id: 'vps',      x: 590, y: 130, w: 100, h: 50,  label: 'VPS Server', icon: '🖥️', color: '#64748b', desc: 'Your server at 43.156.249.23. Runs Hermes Agent, Next.js dashboard (port 3001), and all cron jobs. Code lives at ~/visual-os/.' },
]

const SKILL_LABELS = ['Calendar', 'GitHub', 'Research', 'Memory', 'Files', 'Terminal']

// Define arrows with proper from/to edge routing
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

// Smart arrow path: chooses best edges based on relative positions
function arrowPath(from: string, to: string): string {
  const f = NODES.find(x => x.id === from)!
  const t = NODES.find(x => x.id === to)!

  const fcx = f.x + f.w / 2
  const fcy = f.y + f.h / 2
  const tcx = t.x + t.w / 2
  const tcy = t.y + t.h / 2

  const dx = tcx - fcx
  const dy = tcy - fcy

  // Determine which edges to use
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

  // Control point for curve
  const cx = (sx + ex) / 2
  const cy = (sy + ey) / 2

  return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
}

function arrowLabelPos(from: string, to: string): { x: number; y: number } {
  const f = NODES.find(x => x.id === from)!
  const t = NODES.find(x => x.id === to)!
  return { x: (f.x + f.w/2 + t.x + t.w/2) / 2, y: (f.y + f.h/2 + t.y + t.h/2) / 2 - 10 }
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
      {/* Header */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              <span className="title-gradient">How Hermes Works</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Architecture overview — click any component to learn more
            </p>
          </div>
        </div>
      </div>

      {/* SVG Diagram */}
      <svg viewBox="0 0 720 310" style={{ width: '100%', height: 'auto', display: 'block', marginBottom: -4 }}>
        <defs>
          <filter id="hf-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="currentColor" floodOpacity="0.3" />
          </filter>
          <filter id="hf-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <marker id="hf-arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#555577" />
          </marker>
          <marker id="hf-arrow-active" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#818cf8" />
          </marker>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="720" height="310" fill="rgba(0,0,0,0.08)" rx="0" />

        {/* Arrows */}
        {ARROWS.map(a => {
          const hl = isHighlighted(a.from) && isHighlighted(a.to)
          const path = arrowPath(a.from, a.to)
          const lp = arrowLabelPos(a.from, a.to)
          return (
            <g key={`${a.from}-${a.to}`}>
              <path
                d={path}
                fill="none"
                stroke={hl ? '#818cf8' : '#444466'}
                strokeWidth={hl ? 2 : 1}
                strokeOpacity={hl ? 0.9 : 0.35}
                strokeDasharray={hl ? '6 3' : '4 4'}
                markerEnd={hl ? 'url(#hf-arrow-active)' : 'url(#hf-arrow)'}
                style={{ transition: 'all 0.3s' }}
              />
              {a.label && (
                <text
                  x={lp.x}
                  y={lp.y}
                  fill={hl ? '#818cf8' : '#555577'}
                  fontSize={9}
                  textAnchor="middle"
                  fontWeight={hl ? 600 : 400}
                  style={{ transition: 'all 0.3s' }}
                >
                  {a.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Skill sub-labels */}
        {SKILL_LABELS.map((s, i) => (
          <text key={s} x={410} y={52 + i * 12} fill="#8888aa" fontSize={9}>▸ {s}</text>
        ))}
        <text x={410} y={100} fill="#555577" fontSize={8} fontStyle="italic">+ 20 more skills</text>

        {/* Nodes */}
        {NODES.map(n => {
          const hl = isHighlighted(n.id)
          const isSelected = selected === n.id
          const dimmed = (selected || hovered) && !hl

          return (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(isSelected ? null : n.id)}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.3s' }}
            >
              {/* Card background */}
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={10}
                ry={10}
                fill={isSelected ? n.color + '25' : 'rgba(255,255,255,0.02)'}
                stroke={isSelected ? n.color + '80' : (hl ? n.color + '60' : 'rgba(255,255,255,0.06)')}
                strokeWidth={isSelected ? 2 : (hl ? 1.5 : 1)}
                filter={isSelected || hl ? 'url(#hf-shadow)' : undefined}
                style={{ transition: 'all 0.3s' }}
              />

              {/* Top accent line */}
              <rect
                x={n.x + 2}
                y={n.y + 2}
                width={n.w - 4}
                height={3}
                rx={1.5}
                ry={1.5}
                fill={n.color}
                opacity={hl ? 0.8 : 0.3}
                style={{ transition: 'all 0.3s' }}
              />

              {/* Glow ring when selected */}
              {isSelected && (
                <rect
                  x={n.x - 2}
                  y={n.y - 2}
                  width={n.w + 4}
                  height={n.h + 4}
                  rx={12}
                  ry={12}
                  fill="none"
                  stroke={n.color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  filter="url(#hf-glow)"
                />
              )}

              {/* Icon */}
              <text x={n.x + 16} y={n.y + n.h / 2 + 5} fontSize={18} textAnchor="middle" dominantBaseline="middle">
                {n.icon}
              </text>

              {/* Label */}
              <text
                x={n.x + 34}
                y={n.y + n.h / 2 + 2}
                fill={isSelected ? '#f0f0f4' : (hl ? '#e0e0f0' : '#aaaacc')}
                fontSize={isSelected ? 13 : 12}
                fontWeight={isSelected ? 700 : 500}
                style={{ transition: 'all 0.3s' }}
              >
                {n.label}
              </text>
            </g>
          )
        })}

        {/* VPS label */}
        <text x={640} y={195} fill="#555577" fontSize={8} textAnchor="middle">43.156.249.23</text>
      </svg>

      {/* Info panel */}
      {selectedNode && (
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
          background: selectedNode.color + '08',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{selectedNode.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: selectedNode.color }}>
                  {selectedNode.label}
                </span>
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 4,
                  background: selectedNode.color + '20', color: selectedNode.color,
                  border: `1px solid ${selectedNode.color}30`,
                }}>
                  Click again to close
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#ccd', lineHeight: 1.6 }}>
                {selectedNode.desc}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#888', cursor: 'pointer', fontSize: 16, padding: '2px 8px', borderRadius: 6, lineHeight: 1.3,
                flexShrink: 0,
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.03)',
        fontSize: 9, color: '#555577', display: 'flex', justifyContent: 'space-between'
      }}>
        <span>Hover to highlight · Click to explore</span>
        <span>{NODES.length} components · {ARROWS.length} connections</span>
      </div>
    </div>
  )
}
