import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dreamingFile = '/home/ubuntu/.hermes/dreaming/latest.json'
  
  try {
    if (fs.existsSync(dreamingFile)) {
      const data = fs.readFileSync(dreamingFile, 'utf-8')
      const recs = JSON.parse(data)
      return res.json(recs)
    }
  } catch {}

  res.json([
    { type: 'skill', message: 'Build the Visual OS dashboard — you\'re doing this now 🎉', priority: 'high' },
    { type: 'cost_save', message: 'DeepSeek V4 Flash is currently your most cost-effective model.', priority: 'medium' },
    { type: 'vault', message: 'Consider creating a dedicated MOC for exercise physiology research.', priority: 'medium' },
    { type: 'task_gap', message: 'Set up the "Dreaming" cron job to auto-generate daily recommendations.', priority: 'low' }
  ])
}
