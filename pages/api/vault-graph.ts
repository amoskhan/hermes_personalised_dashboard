import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import pathModule from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isVercel = !require('fs').existsSync('/home/ubuntu/ObsidianVault')
  if (isVercel) {
    try {
      const proxyRes = await fetch('http://43.156.249.23:3001/api/vault-graph', { signal: AbortSignal.timeout(8000) })
      const data = await proxyRes.json()
      return res.json(data)
    } catch {
      return res.json({ nodes: [], links: [] })
    }
  }

  try {
    const vaultPath = '/home/ubuntu/ObsidianVault'

    // Scan ALL .md files recursively, excluding .git and .obsidian
    const allMdFiles: string[] = []
    function walk(dir: string, baseDepth: number) {
      let entries
      try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
      for (const entry of entries) {
        const fullPath = pathModule.join(dir, entry.name)
        if (entry.name.startsWith('.') || entry.name === '.git' || entry.name === '.obsidian') continue
        if (entry.isDirectory()) {
          walk(fullPath, baseDepth + 1)
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Use relative path from vault root as the node id
          const relPath = pathModule.relative(vaultPath, fullPath)
          allMdFiles.push(relPath)
        }
      }
    }
    walk(vaultPath, 0)

    // Collect all [[wikilinks]] and file data
    const allTargets = new Set<string>()
    const fileLinks: { source: string; targets: string[]; folder: string }[] = []

    for (const relPath of allMdFiles) {
      const fullPath = pathModule.join(vaultPath, relPath)
      const name = relPath.replace(/\.md$/, '')
      const content = fs.readFileSync(fullPath, 'utf-8')
      const matches = [...content.matchAll(/\[\[([^\]]+)\|?[^\]]*\]\]/g)].map(m => m[1].split('|')[0])
      fileLinks.push({
        source: name,
        targets: matches,
        folder: pathModule.dirname(relPath).replace(/^\.$/, 'root'),
      })
      for (const t of matches) allTargets.add(t)
    }

    // Build nodes
    const existingFiles = new Set(allMdFiles.map(f => f.replace(/\.md$/, '')))
    const nodes: { id: string; group: number; size: number; folder: string }[] = []

    // Folder colors — assign a stable index per folder
    const folderOrder = [...new Set(fileLinks.map(f => f.folder))]
    const folderIndex = (folder: string) => folderOrder.indexOf(folder)

    for (const f of allMdFiles) {
      const name = f.replace(/\.md$/, '')
      const link = fileLinks.find(l => l.source === name)
      nodes.push({
        id: name,
        group: 1,
        size: 5,
        folder: link?.folder || 'root',
      })
    }

    // Add external targets (referenced but not a file)
    for (const target of allTargets) {
      if (!existingFiles.has(target)) {
        nodes.push({ id: target, group: 2, size: 2, folder: 'external' })
      }
    }

    // Build links
    const links: { source: string; target: string; count: number }[] = []
    const linkMap = new Map<string, number>()

    for (const { source, targets } of fileLinks) {
      for (const target of targets) {
        if (source === target) continue // skip self-links
        const key = [source, target].sort().join('::')
        linkMap.set(key, (linkMap.get(key) || 0) + 1)
      }
    }

    for (const [key, count] of linkMap) {
      const [a, b] = key.split('::')
      links.push({ source: a, target: b, count })
    }

    res.json({ nodes, links })
  } catch (error) {
    console.error('Vault graph error:', error)
    res.json({ nodes: [], links: [] })
  }
}
