import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import cp from 'child_process'
import pathModule from 'path'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH || '/home/ubuntu/ObsidianVault'
    const notesDir = pathModule.join(vaultPath, 'Notes')
    
    let totalNotes = 0
    let totalLinks = 0
    let brokenLinks = 0
    let recentlyModified: string[] = []

    try {
      if (!fs.existsSync(notesDir)) throw new Error('no notes dir')
      const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'))
      totalNotes = files.length

      const withTime = files.map(f => ({
        name: f,
        time: fs.statSync(pathModule.join(notesDir, f)).mtimeMs
      }))
      withTime.sort((a, b) => b.time - a.time)
      recentlyModified = withTime.slice(0, 7).map(f => f.name)

      const noteNames = new Set(files.map(f => f.replace('.md', '')))
      for (const f of files.slice(0, 50)) {
        const content = fs.readFileSync(pathModule.join(notesDir, f), 'utf-8')
        const links = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1])
        totalLinks += links.length
        for (const link of links) {
          const target = link.split('|')[0]
          if (!noteNames.has(target)) brokenLinks++
        }
      }
    } catch {}

    let vaultSize = '—'
    try {
      vaultSize = cp.execSync(`du -sh ${vaultPath} 2>/dev/null | cut -f1`).toString().trim() || '—'
    } catch {}

    res.json({ totalNotes, recentlyModified, brokenLinks, vaultSize, totalLinks })
  } catch (error) {
    console.error('Vault stats error:', error)
    res.json({ totalNotes: 0, recentlyModified: [], brokenLinks: 0, vaultSize: '—', totalLinks: 0 })
  }
}
