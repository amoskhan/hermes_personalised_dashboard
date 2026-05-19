import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import pathModule from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH || '/home/ubuntu/ObsidianVault'
    const notesDir = pathModule.join(vaultPath, 'Notes')

    if (!fs.existsSync(notesDir)) {
      return res.json({ nodes: [], links: [] })
    }

    const files = fs.readdirSync(notesDir).filter((f: string) => f.endsWith('.md'))
    const noteNames = new Set(files.map((f: string) => f.replace('.md', '')))

    const nodes: { id: string; group: number; size: number }[] = []
    const links: { source: string; target: string; count: number }[] = []
    const linkMap = new Map<string, number>()

    for (const f of files) {
      const name = f.replace('.md', '')
      const content = fs.readFileSync(pathModule.join(notesDir, f), 'utf-8')
      const matches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1])

      for (const link of matches) {
        const target = link.split('|')[0]
        const key = [name, target].sort().join('::')
        linkMap.set(key, (linkMap.get(key) || 0) + 1)
      }
    }

    // Build nodes with link counts as sizes
    const linkCounts = new Map<string, number>()
    for (const [key, count] of linkMap) {
      const [a, b] = key.split('::')
      linkCounts.set(a, (linkCounts.get(a) || 0) + count)
      linkCounts.set(b, (linkCounts.get(b) || 0) + count)
    }

    for (const f of files) {
      const name = f.replace('.md', '')
      nodes.push({
        id: name,
        group: name.startsWith('2026') ? 1 : 2,
        size: linkCounts.get(name) || 1
      })
    }

    for (const [key, count] of linkMap) {
      const [source, target] = key.split('::')
      if (noteNames.has(source) && noteNames.has(target)) {
        links.push({ source, target, count })
      }
    }

    res.json({ nodes, links })
  } catch (error) {
    console.error('Vault graph error:', error)
    res.json({ nodes: [], links: [] })
  }
}
