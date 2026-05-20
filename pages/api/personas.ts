import type { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'
import fs from 'fs'

export const config = { runtime: 'nodejs' }

type Persona = {
  id: string
  name: string
  description: string
  emoji: string
}

const PERSONA_EMOJIS: Record<string, string> = {
  helpful: '🤝',
  concise: '🎯',
  technical: '⚙️',
  creative: '🎨',
  teacher: '👨‍🏫',
  kawaii: '🌸',
  catgirl: '🐱',
  pirate: '🏴‍☠️',
  shakespeare: '🎭',
  surfer: '🏄',
  noir: '🕵️',
  uwu: '🥺',
  philosopher: '🧠',
  hype: '🔥'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: return all personas + active one
  if (req.method === 'GET') {
    try {
      const raw = execSync('python3 /home/ubuntu/visual-os/scripts/get-personas.py', {
        timeout: 10000,
        encoding: 'utf-8'
      })
      const data = JSON.parse(raw)
      const personas: Persona[] = data.personas.map((p: any) => ({
        ...p,
        emoji: PERSONA_EMOJIS[p.id] || '🤖'
      }))
      return res.json({ personas, active: data.active, count: data.count })
    } catch (err: any) {
      // Fallback static list
      const fallback: Persona[] = Object.entries(PERSONA_EMOJIS).map(([id, emoji]) => ({
        id, name: id.charAt(0).toUpperCase() + id.slice(1),
        description: '',
        emoji
      }))
      return res.json({ personas: fallback, active: 'kawaii', count: fallback.length })
    }
  }

  // POST: switch persona
  if (req.method === 'POST') {
    try {
      const { persona } = req.body
      if (!persona) return res.status(400).json({ error: 'persona name required' })

      execSync(`python3 /home/ubuntu/visual-os/scripts/set-persona.py ${persona}`, {
        timeout: 10000,
        encoding: 'utf-8'
      })
      return res.json({ status: 'ok', active: persona })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
