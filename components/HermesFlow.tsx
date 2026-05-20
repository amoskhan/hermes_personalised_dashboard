import { useState } from 'react'

const NODES = {
  you:       { x: 80,  y: 60,  w: 100, h: 44,  label: 'You (Amos)', color: '#22c55e', icon: '👤' },
  telegram:  { x: 80,  y: 160, w: 100, h: 44,  label: 'Telegram',   color: '#6366f1', icon: '💬' },
  hermes:    { x: 300, y: 110, w: 140, h: 60,  label: 'Hermes Agent', color: '#818cf8', icon: '🧠' },
  skills:    { x: 540, y: 40,  w: 130, h: 100, label: 'Skills & Tools', color: '#f59e0b', icon: '🔧' },
  cron:      { x: 540, y: 170, w: 130, h: 44,  label: 'Cron Jobs',  color: '#06b6d4', icon: '⏰' },
  vault:     { x: 300, y: 240, w: 140, h: 44,  label: 'Obsidian Vault', color: '#8b5cf6', icon: '📓' },
  kb:        { x: 80,  y: 240, w: 100, h: 44,  label: 'Knowledge Base', color: '#ec4899', icon: '💾' },
  dashboard: { x: 540, y: 240, w: 130, h: 44,  label: 'Dashboard',  color: '#14b8a6', icon: '📊' },
  vps:       { x: 80,  y: 320, w: 100, h: 44,  label: 'VPS Server', color: '#64748b', icon: '🖥️' },
}

const SKILL_ITEMS = [
  { x: 555, y: 65,  label: 'Calendar' },
  { x: 555, y: 80,  label: 'GitHub' },
  { x: 555, y: 95,  label: 'Research' },
  { x: 637, y: 65,  label: 'Memory' },
  { x: 637, y: 80,  label: 'Files' },
  { x: 637, y: 95,  label: 'Terminal' },
]

const LINKS = [
  { from: 'you',      to: 'telegram',  label: 'Messages' },
  { from: 'telegram', to: 'hermes',    label: 'Prompts' },
  { from: 'hermes',   to: 'telegram',  label: 'Replies' },
  { from: 'hermes',   to: 'skills',    label: 'Uses tools' },
  { from: 'hermes',   to: 'kb',        label: 'Reads/Writes' },
  { from: 'hermes',   to: 'vault',     label: 'Reads notes' },
  { from: 'hermes',   to: 'dashboard', label: 'Pushes data' },
  { from: 'cron',     to: 'hermes',    label: 'Triggers' },
  { from: 'vps',      to: 'hermes',    label: 'Runs on' },
  { from: 'vps',      to: 'dashboard', label: 'Hosts' },
  { from: 'vps',      to: 'cron',      label: 'Schedules' },
  { from: 'skills',   to: 'vault',     label: 'Read notes' },
]

// Node name -> center point
function center(id: string): [number, number] {
  const n = NODES[id as keyof typeof NODES]
  return [n.x + n.w / 2, n.y + n.h / 2]
}

// Path from one node's edge to another's
function edgePath(from: string, to: string): string {
  const [fx, fy] = center(from)
  const [tx, ty] = center(to)
  const f = NODES[from as keyof typeof NODES]
  const t = NODES[to as keyof typeof NODES]

  // Determine which edges to connect
  const dx = tx - fx
  const dy = ty - fy

  // Start from closest edge of source
  let sx = fx, sy = fy
  if (Math.abs(dx) > Math.abs(dy)) {
    sx = dx > 0 ? f.x + f.w : f.x
  } else {
    sy = dy > 0 ? f.y + f.h : f.y
  }

  // End at closest edge of target
  let ex = tx, ey = ty
  if (Math.abs(dx) > Math.abs(dy)) {
    ex = dx > 0 ? t.x : t.x + t.w
  } else {
    ey = dy > 0 ? t.y : t.y + t.h
  }

  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  return `M ${sx} ${sy} Q ${mx} ${my}, ${ex} ${ey}`
}

function linkLabelPos(from: string, to: string): { x: number; y: number } {
  const [fx, fy] = center(from)
  const [tx, ty] = center(to)
  return { x: (fx + tx) / 2 - 5, y: (fy + ty) / 2 - 8 }
}

export default function HermesFlow() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const nodeIds = Object.keys(NODES) as (keyof typeof NODES)[]

  return (
    <div className="glass-card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>🧠</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>How Hermes Works</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Architecture overview · Click a node for details
          </p>
        </div>
      </div>

      <svg viewBox="0 0 750 400" style={{ width: '100%', height: 'auto', maxHeight: 420 }}>
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="currentColor" floodOpacity="0.3" />
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#555577" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
          </marker>
        </defs>

        {/* Background zone */}
        <rect x="10" y="10" width="730" height="380" rx="12" fill="rgba(255,255,255,0.01)" />

        {/* Links */}
        {LINKS.map(l => {
          const key = `${l.from}-${l.to}`
          const isActive = hovered === l.from || hovered === l.to || selected === l.from || selected === l.to
          const pos = linkLabelPos(l.from, l.to)
          return (
            <g key={key}>
              <path
                d={edgePath(l.from, l.to)}
                fill="none"
                stroke={isActive ? '#818cf8' : '#555577'}
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={isActive ? 0.9 : 0.4}
                strokeDasharray={isActive ? 'none' : '4 3'}
                markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                style={{ transition: 'all 0.3s' }}
              />
              {l.label && (
                <text
                  x={pos.x}
                  y={pos.y}
                  fill={isActive ? '#818cf8' : '#555577'}
                  fontSize={9}
                  textAnchor="middle"
                  style={{ transition: 'all 0.3s' }}
                >
                  {l.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodeIds.map(id => {
          const n = NODES[id]
          const isActive = hovered === id || selected === id
          const isDimmed = selected && selected !== id && !LINKS.some(l => (l.from === selected && l.to === id) || (l.to === selected && l.from === id))

          return (
            <g
              key={id}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected === id ? null : id)}
              style={{ cursor: 'pointer', opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.3s' }}
            >
              {/* Main rect */}
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={10}
                ry={10}
                fill={n.color + '18'}
                stroke={isActive ? n.color : n.color + '50'}
                strokeWidth={isActive ? 2 : 1}
                filter={isActive ? 'url(#shadow)' : undefined}
                style={{ transition: 'all 0.3s' }}
              />

              {/* Inner glow when active */}
              {isActive && (
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={10}
                  ry={10}
                  fill="none"
                  stroke={n.color}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  filter="url(#glow)"
                />
              )}

              {/* Icon */}
              <text
                x={n.x + 14}
                y={n.y + n.h / 2 + 5}
                fontSize={16}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {n.icon}
              </text>

              {/* Label */}
              <text
                x={n.x + 32}
                y={n.y + n.h / 2 + 1}
                fill={isActive ? '#f0f0f4' : '#cccce0'}
                fontSize={isActive ? 13 : 12}
                fontWeight={isActive ? 600 : 400}
                style={{ transition: 'all 0.3s' }}
              >
                {n.label}
              </text>

              {/* Subtle dot indicator */}
              <circle cx={n.x + n.w - 8} cy={n.y + 8} r={3} fill={n.color} opacity={0.5} />
            </g>
          )
        })}

        {/* Skills sub-items */}
        {SKILL_ITEMS.map((s, i) => (
          <text
            key={i}
            x={s.x}
            y={s.y}
            fill="#8888aa"
            fontSize={8}
          >
            ▸ {s.label}
          </text>
        ))}
      </svg>

      {/* Info panel when a node is selected */}
      {selected && (
        <div style={{
          marginTop: 10, padding: '12px 14px', borderRadius: 8,
          background: `${NODES[selected as keyof typeof NODES].color}10`,
          border: `1px solid ${NODES[selected as keyof typeof NODES].color}20`,
          fontSize: 12, color: '#cccce0', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: NODES[selected as keyof typeof NODES].color, marginBottom: 4 }}>
            {NODES[selected as keyof typeof NODES].icon} {NODES[selected as keyof typeof NODES].label}
          </div>
          {selected === 'you' && <div>You interact with Hermes via Telegram. Send messages, ask questions, request tasks. Hermes responds contextually with memory of past conversations.</div>}
          {selected === 'telegram' && <div>Messaging platform where conversations happen. Supports text, images, files, and voice messages. Messages are routed to Hermes Agent for processing.</div>}
          {selected === 'hermes' && <div>The AI brain. Powered by <strong>deepseek-v4-flash</strong> on <strong>OpenRouter</strong>. Processes your prompts, decides which skills/tools to use, reads/writes memory, and responds intelligently.</div>}
          {selected === 'skills' && <div>Modular capabilities Hermes can use: <strong>Calendar</strong> (Google Calendar), <strong>GitHub</strong> (repos/commits), <strong>Research</strong> (arXiv/PubMed), <strong>Memory</strong> (persistent storage), <strong>Files</strong> (read/write/search), <strong>Terminal</strong> (shell commands), and more.</div>}
          {selected === 'cron' && <div>Scheduled background tasks. Runs daily summaries, vault health checks, dreaming engine, and messages watchdog. Every hour the watchdog checks system health and logs activity.</div>}
          {selected === 'vault' && <div>Your Obsidian knowledge base at <code>~/ObsidianVault</code>. 175+ notes across 26 folders — daily logs, lesson plans, finances, projects, research. Hermes reads these to give contextual suggestions.</div>}
          {selected === 'kb' && <div>Persistent memory that survives across sessions. Stores your profile (name, role, preferences), environment facts, and learned conventions. Injected into every conversation for context.</div>}
          {selected === 'dashboard' && <div>This page! Visual OS — shows model usage, vault graph, calendar events, suggestions, live messages, and ROI tracking. Hosted on the VPS at port 3001, also deployed on Vercel.</div>}
          {selected === 'vps' && <div>Your <strong>43.156.249.23</strong> server. Runs the Hermes Agent (Python), dashboard (Next.js on port 3001), and cron jobs. All your data lives here — code at <code>~/visual-os/</code>.</div>}
          <button
            onClick={() => setSelected(null)}
            style={{
              marginTop: 6, padding: '2px 10px', fontSize: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 4, color: '#888', cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 10, color: '#555577', textAlign: 'center' }}>
        Hover to highlight · Click a node for details · Arrows show data flow
      </div>
    </div>
  )
}
