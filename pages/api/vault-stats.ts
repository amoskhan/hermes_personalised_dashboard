import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import cp from 'child_process'
import pathModule from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH || '/home/ubuntu/ObsidianVault'
    const notesDir = pathModule.join(vaultPath, 'Notes')

    if (!fs.existsSync(notesDir)) {
      return res.json({ totalNotes: 0, recentlyModified: [], brokenLinks: 0, vaultSize: '—', totalLinks: 0 })
    }

    const files = fs.readdirSync(notesDir).filter((f: string) => f.endsWith('.md'))

    const withTime = files.map((f: string) => ({
      name: f,
      time: fs.statSync(pathModule.join(notesDir, f)).mtimeMs
    }))
    withTime.sort((a: any, b: any) => b.time - a.time)

    const noteNames = new Set(files.map((f: string) => f.replace('.md', '')))
    let totalLinks = 0
    let brokenLinks = 0

    for (const f of files.slice(0, 50)) {
      const content = fs.readFileSync(pathModule.join(notesDir, f), 'utf-8')
      const links = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1])
      totalLinks += links.length
      for (const link of links) {
        const target = link.split('|')[0]
        if (!noteNames.has(target)) brokenLinks++
      }
    }

    let vaultSize = '—'
    try {
      vaultSize = cp.execSync(`du -sh ${vaultPath} 2>/dev/null | cut -f1`).toString().trim() || '—'
    } catch {}

    res.json({
      totalNotes: files.length,
      recentlyModified: withTime.slice(0, 7).map((f: any) => f.name),
      brokenLinks,
      vaultSize,
      totalLinks
    })
  } catch (error) {
    console.error('Vault stats error:', error)
    res.json({ totalNotes: 0, recentlyModified: [], brokenLinks: 0, vaultSize: '—', totalLinks: 0 })
  }
}
