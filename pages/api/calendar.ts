import type { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'

export const config = { runtime: 'nodejs' }

type CalendarEvent = {
  id: string
  summary: string
  start: string
  end: string
  location: string
  isAllDay: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = execSync('python3 /home/ubuntu/visual-os/scripts/get-today-calendar.py', {
      timeout: 15000,
      encoding: 'utf-8'
    })

    const events: CalendarEvent[] = JSON.parse(raw)

    return res.json({
      date: new Date().toISOString().split('T')[0],
      events
    })
  } catch (err: any) {
    return res.json({
      date: new Date().toISOString().split('T')[0],
      events: [],
      error: err.message
    })
  }
}
