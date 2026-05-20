import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Proxy to VPS if running on Vercel (ephemeral filesystem)
  if (process.env.VERCEL) {
    try {
      const proxyRes = await fetch('http://43.156.249.23:3002/api/dreaming', { signal: AbortSignal.timeout(8000) })
      const data = await proxyRes.json()
      return res.json(data)
    } catch {
      return res.json([])
    }
  }

  // Ensure dreaming directory exists on VPS
  try {
    fs.mkdirSync('/home/ubuntu/.hermes/dreaming', { recursive: true })
  } catch {}

  const dreamingFile = '/home/ubuntu/.hermes/dreaming/latest.json'

  // Try reading the dreaming file first
  try {
    if (fs.existsSync(dreamingFile)) {
      const data = fs.readFileSync(dreamingFile, 'utf-8')
      const recs = JSON.parse(data)
      if (Array.isArray(recs) && recs.length > 0) {
        return res.json(recs)
      }
    }
  } catch {}

  // Fallback recommendations (always available)
  res.json([
    { type: 'insight', message: '🧠 You switched to Claude Sonnet 4 with your own API key — direct Anthropic, no OpenRouter markup!', priority: 'high' },
    { type: 'skill', message: 'Visual OS dashboard is live with vault graph (175 nodes), live messages, and Hermes flow diagram.', priority: 'high' },
    { type: 'vault', message: 'Your vault has 95 notes across 26 folders — consider creating a MOC for your most-linked topics.', priority: 'medium' },
    { type: 'cost_save', message: 'Using your own Anthropic API key avoids OpenRouter markup (~20% savings).', priority: 'medium' },
    { type: 'task_gap', message: 'Add a Dreaming cron job to auto-generate fresh daily recommendations.', priority: 'low' }
  ])
}
