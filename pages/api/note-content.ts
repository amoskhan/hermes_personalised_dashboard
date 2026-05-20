import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const VAULT_DIR = '/home/ubuntu/ObsidianVault'

function findNoteFile(name: string): string | null {
  // Search the entire vault recursively for a matching .md file
  function walk(dir: string): string | null {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return null }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === '.git' || entry.name === '.obsidian') continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const found = walk(fullPath)
        if (found) return found
      } else if (entry.isFile() && entry.name === `${name}.md`) {
        return fullPath
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Also check if the relative path (without extension) matches
        const relPath = path.relative(VAULT_DIR, fullPath).replace(/\.md$/, '')
        if (relPath === name) return fullPath
      }
    }
    return null
  }
  return walk(VAULT_DIR)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing "name" query param' })
  }

  // Sanitize — prevent path traversal
  const cleanName = name.replace(/\.\.\//g, '').replace(/^~/, '').replace(/[<>"|]/g, '')
  const filePath = findNoteFile(cleanName)

  if (!filePath) {
    return res.status(404).json({ error: 'Note not found', name: cleanName })
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  // Extract a short description: first non-empty line after YAML frontmatter, or first paragraph
  let description = ''
  const lines = content.split('\n')
  let inFrontmatter = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true
      continue
    }
    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false
      continue
    }
    if (!inFrontmatter && line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('>') && !line.trim().startsWith('- [')) {
      description = line.trim()
      if (description.length > 150) {
        description = description.slice(0, 147) + '…'
      }
      break
    }
  }

  // Get tags from content
  const tags = [...content.matchAll(/#([\w-]+)/g)].map(m => m[1]).filter(
    t => !['daily-log', 'lesson-plan', 'project', 'research'].includes(t.toLowerCase())
  ).slice(0, 8)

  // Get all [[wikilinks]] in the note
  const links = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].split('|')[0])

  // Get backlinks (notes that link to this note)
  let backlinks: string[] = []
  try {
    function walkForBacklinks(dir: string) {
      let entries
      try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === '.git' || entry.name === '.obsidian') continue
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walkForBacklinks(fullPath)
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relPath = path.relative(VAULT_DIR, fullPath).replace(/\.md$/, '')
          if (relPath === cleanName) continue
          const fContent = fs.readFileSync(fullPath, 'utf-8')
          if (fContent.includes(`[[${cleanName}]]`)) {
            backlinks.push(relPath)
          }
        }
      }
    }
    walkForBacklinks(VAULT_DIR)
    backlinks = backlinks.slice(0, 10)
  } catch {}

  const fullContent = content
    .replace(/---[\s\S]*?---\n?/, '')  // strip frontmatter only
    .replace(/\[\[([^\]]+)\]\]/g, '$1')  // unwikilink
    .trim()

  const summary = fullContent.slice(0, 3000)

  return res.json({
    name: cleanName,
    description,
    summary: summary + (fullContent.length > 3000 ? '\n\n… (content continues)' : ''),
    fullContent,
    tags,
    links,
    backlinks,
    totalLines: lines.length,
  })
}
