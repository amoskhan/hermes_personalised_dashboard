import type { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'

export const config = { runtime: 'nodejs' }

type Commit = {
  sha: string
  message: string
  author: string
  date: string
}

type Repo = {
  name: string
  full_name: string
  url: string
  description: string
  pushed_at: string
  commits: Commit[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = execSync('python3 /home/ubuntu/visual-os/scripts/get-github-activity.py', {
      timeout: 30000,
      encoding: 'utf-8'
    })
    const data: { repos: Repo[]; total_commits: number } = JSON.parse(raw)
    return res.json(data)
  } catch (err: any) {
    return res.json({ repos: [], total_commits: 0, error: err.message })
  }
}
