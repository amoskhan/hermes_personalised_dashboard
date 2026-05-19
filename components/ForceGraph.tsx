import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'

interface GraphNode {
  id: string
  group: number
  size: number
}

interface GraphLink {
  source: string
  target: string
  count: number
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export default function ForceGraph({ data }: { data: GraphData }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [dimensions, setDimensions] = useState({ w: 600, h: 340 })

  // Compute connection counts for sizing
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const link of data.links) {
      counts[link.source as string] = (counts[link.source as string] || 0) + 1
      counts[link.target as string] = (counts[link.target as string] || 0) + 1
    }
    return counts
  }, [data])

  // Track resize
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width
        if (w > 0) setDimensions(prev => prev.w !== w ? { w, h: Math.min(400, Math.max(280, w * 0.55)) } : prev)
      }
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Main D3 render
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    const { w, h } = dimensions
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Clean IDs for display
    const shortId = (id: string) => {
      const s = id.replace(/\.md$/, '').replace(/^.*[/\\]/, '')
      return s.length > 20 ? s.slice(0, 17) + '…' : s
    }

    // Zoom behavior
    const g = svg.append('g')
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)
    // Center initially
    svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(0.7))

    const color = (g: number, id: string) => {
      if (g === 1) {
        const deg = (id.length * 37) % 360
        return `oklch(65% 0.15 ${deg})`
      }
      return '#444466'
    }

    // Compute node radii by connection count
    const maxConns = Math.max(...data.nodes.map(n => connectionCounts[n.id] || 1), 1)
    const radius = (id: string) => Math.max(3, Math.min(12, ((connectionCounts[id] || 1) / maxConns) * 10 + 2))

    // Search highlighting
    const searchLower = search.toLowerCase()
    const isHighlighted = (id: string) => searchLower && id.toLowerCase().includes(searchLower)

    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink<any, any>(data.links).id((d: any) => d.id).distance((d: any) => 50 + (d.count || 1) * 10))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius((d: any) => radius(d.id) + 4))
      .alphaDecay(0.02)

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#2a2a5e')
      .attr('stroke-width', d => Math.min(d.count, 3))
      .attr('stroke-opacity', d => 0.2 + d.count * 0.08)

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => radius(d.id))
      .attr('fill', d => color(d.group, d.id))
      .attr('stroke', d => isHighlighted(d.id) ? '#fff' : d.group === 1 ? '#1a1a3e' : 'none')
      .attr('stroke-width', d => isHighlighted(d.id) ? 2 : 1)
      .attr('cursor', 'grab')
      .style('filter', d => isHighlighted(d.id) ? 'drop-shadow(0 0 6px rgba(255,255,255,0.3))' : 'none')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('mouseenter', (event: MouseEvent, d: any) => {
        const rect = svgRef.current!.getBoundingClientRect()
        setTooltip({
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 8,
          text: `${d.id}${connectionCounts[d.id] ? ` · ${connectionCounts[d.id]} connections` : ''}`
        })
      })
      .on('mouseleave', () => setTooltip(null))

    // Labels
    const label = g.append('g')
      .selectAll('text')
      .data(data.nodes.filter(n => n.group === 1))
      .join('text')
      .text(d => shortId(d.id))
      .attr('font-size', d => isHighlighted(d.id) ? 11 : 9)
      .attr('fill', d => isHighlighted(d.id) ? '#fff' : '#8888aa')
      .attr('font-weight', d => isHighlighted(d.id) ? 600 : 400)
      .attr('dx', d => radius(d.id) + 4)
      .attr('dy', 3)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.6)')

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    // Click to zoom on search match
    if (searchLower) {
      const match = data.nodes.find(n => n.id.toLowerCase().includes(searchLower))
      if (match) {
        setTimeout(() => {
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(w / 2 - (match as any).x * 1.5, h / 2 - (match as any).y * 1.5).scale(1.5)
          )
        }, 600)
      }
    }

    return () => { simulation.stop() }
  }, [data, search, dimensions])

  const existingCount = data.nodes.filter(n => n.group === 1).length
  const externalCount = data.nodes.filter(n => n.group === 2).length

  if (!data.nodes.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#555577' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🗄️</div>
        <div style={{ fontSize: 13 }}>No vault data to graph</div>
        <div style={{ fontSize: 11, marginTop: 4, color: '#444' }}>Write some notes with [[wikilinks]] to see them here</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Search bar */}
      <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="🔍 Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '6px 10px', fontSize: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6, color: '#ccc', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              padding: '4px 10px', fontSize: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, color: '#888', cursor: 'pointer'
            }}
          >✕</button>
        )}
      </div>

      {/* Graph container */}
      <div ref={containerRef} style={{ width: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <svg ref={svgRef} style={{ width: '100%', height: dimensions.h, cursor: 'grab' }} />
        
        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', left: tooltip.x, top: tooltip.y,
            background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 6, padding: '4px 10px', fontSize: 11,
            color: '#ccc', pointerEvents: 'none', whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)', zIndex: 10
          }}>
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend + Stats */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10,
        fontSize: 11, alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#8888aa', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(65% 0.15 210)', display: 'inline-block' }} />
            {existingCount} notes
          </span>
          <span style={{ color: '#666688', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#444466', display: 'inline-block' }} />
            {externalCount} external refs
          </span>
          <span style={{ color: '#666688' }}>🔗 {data.links.length} connections</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#555577', fontSize: 10 }}>
            Scroll to zoom · Drag to pan · 🔍 type to search
          </span>
        </div>
      </div>
    </div>
  )
}
