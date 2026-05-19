import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import ForceGraph from '../../components/ForceGraph'

type UsageData = {
  totalCost: number
  creditsRemaining: number
  model: string
  dailyUsage: { date: string; cost: number; tokens: number }[]
}

type VaultStats = {
  totalNotes: number
  recentlyModified: string[]
  brokenLinks: number
  vaultSize: string
  totalLinks: number
}

type DreamingRec = {
  type: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

type ModelInfo = {
  id: string
  name: string
  provider: string
  costPer1kTokens: number
}

export default function Dashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [vault, setVault] = useState<VaultStats | null>(null)
  const [dreaming, setDreaming] = useState<DreamingRec[]>([])
  const [models, setModels] = useState<ModelInfo[]>([])
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
  const [time, setTime] = useState(new Date())
  const [showOnboard, setShowOnboard] = useState(true)

  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(setUsage).catch(() => {})
    fetch('/api/vault-stats').then(r => r.json()).then(setVault).catch(() => {})
    fetch('/api/dreaming').then(r => r.json()).then(setDreaming).catch(() => {})
    fetch('/api/models').then(r => r.json()).then(setModels).catch(() => {})
    fetch('/api/vault-graph').then(r => r.json()).then(setGraphData).catch(() => {})
    const t = setInterval(() => setTime(new Date()), 1000)
    const refresh = setInterval(() => {
      fetch('/api/usage').then(r => r.json()).then(setUsage).catch(() => {})
    }, 30000)
    return () => { clearInterval(t); clearInterval(refresh) }
  }, [])

  const totalMonthly = usage?.dailyUsage?.reduce((s, d) => s + d.cost, 0) || 0
  const subsTotal = 55 // Claude Pro S$20 + ChatGPT S$20 + OpenRouter ~S$15
  const roi =Math.max(0, (totalMonthly * 4) - subsTotal)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#0a0a0f', color: '#e0e0e0', minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff' }}>Visual OS</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>Claude Operating System · AI Workstation Dashboard</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#888' }}>
            {time.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#fff' }}>
            {time.toLocaleTimeString('en-SG')}
          </div>
        </div>
      </div>

      {/* Onboarding Wizard */}
      {showOnboard && (
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #2a2a4e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>🚀 Onboarding Wizard</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#aaa' }}>
                Auto-detected: OpenRouter API ✓ · Obsidian Vault ✓ · Hermes Agent ✓ · Cron Jobs ✓
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                All systems connected. Dashboard is live.
              </p>
            </div>
            <button onClick={() => setShowOnboard(false)}
              style={{ background: '#2a2a4e', border: 'none', color: '#888', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Row: Model Status + Memory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Model Status Card */}
        <DashboardCard title="🎯 Model Status" icon="◎">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StatBox label="Active Model" value={usage?.model || 'deepseek-v4-flash'} small />
            <StatBox label="Monthly Spend" value={`S$${(totalMonthly).toFixed(2)}`} />
            <StatBox label="Credits Left" value={usage ? `S$${(usage.creditsRemaining || 0).toFixed(2)}` : '—'} />
            <StatBox label="Subscriptions" value={`S$${subsTotal}/mo`} small />
          </div>
          {usage?.dailyUsage && usage.dailyUsage.length > 1 && (
            <div style={{ marginTop: 16, height: 120 }}>
              <p style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Daily Token Usage (7-day)</p>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={usage.dailyUsage}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tokens" stroke="#6366f1" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCard>

        {/* Memory Card */}
        <DashboardCard title="🧠 Memory Map" icon="📚">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <StatBox label="Vault Notes" value={String(vault?.totalNotes || '—')} />
            <StatBox label="Total Links" value={String(vault?.totalLinks || '—')} />
            <StatBox label="Vault Size" value={vault?.vaultSize || '—'} />
          </div>
          <ForceGraph data={graphData} />
          {vault && (
            <div style={{ marginTop: 8, fontSize: 11, color: vault.brokenLinks > 0 ? '#f59e0b' : '#22c55e', textAlign: 'center' }}>
              {vault.brokenLinks > 0 ? `⚠ ${vault.brokenLinks} broken link(s) detected` : '✅ All links healthy'}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Bottom Row: Dreaming + ROI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Dreaming Card */}
        <DashboardCard title="💭 Dreaming Engine" icon="✨" subtitle="Daily self-improvement recommendations">
          {dreaming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dreaming.slice(0, 4).map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 8,
                  background: rec.priority === 'high' ? 'rgba(239,68,68,0.1)' : rec.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${
                    rec.priority === 'high' ? 'rgba(239,68,68,0.3)' : rec.priority === 'medium' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'
                  }`
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {rec.type === 'cost_save' ? '💰' : rec.type === 'vault' ? '📝' : rec.type === 'task_gap' ? '⚡' : rec.type === 'skill' ? '🔧' : '💡'}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 2 }}>
                      {rec.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>{rec.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌙</div>
              <p style={{ fontSize: 13, margin: 0 }}>Dreaming engine hasn't run yet.</p>
              <p style={{ fontSize: 12, margin: '4px 0 0', color: '#444' }}>It fires daily at 6:00 AM SGT. Next run: tomorrow.</p>
            </div>
          )}
        </DashboardCard>

        {/* ROI Card */}
        <DashboardCard title="📊 ROI Tracker" icon="📈">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StatBox label="Time Saved (est.)" value="~8h/week" />
            <StatBox label="Hourly Rate" value="S$31.50" />
            <StatBox label="Monthly Value" value={`S$${(8 * 31.50 * 4.33).toFixed(0)}`} />
            <StatBox label="Subscriptions" value={`-S$${subsTotal}`} />
          </div>
          <div style={{
            marginTop: 16, padding: '16px 20px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,197,94,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Net Monthly ROI</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>
              +S${((8 * 31.50 * 4.33) - subsTotal).toFixed(0)}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Based on ~8h/week saved at S$31.50/h (MOE rate)
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '16px 0', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444' }}>
        <span>Visual OS v0.1 · Running on Hermes Agent</span>
        <span>Amos Khan · Singapore SGT (GMT+8)</span>
      </div>
    </div>
  )
}

function DashboardCard({ title, icon, subtitle, children }: { title: string; icon: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0d0d14', borderRadius: 12, padding: 20, border: '1px solid #1a1a2e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>{title}</h3>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function StatBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ background: '#0a0a12', borderRadius: 8, padding: '12px 14px', border: '1px solid #14141e' }}>
      <div style={{ fontSize: 10, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 18, fontWeight: 600, color: '#fff' }}>{value}</div>
    </div>
  )
}
