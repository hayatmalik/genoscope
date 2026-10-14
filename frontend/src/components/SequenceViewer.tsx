import ResizeObserver from '@rc-component/resize-observer'
import VirtualList from '@rc-component/virtual-list'
import { Space } from 'antd'
import { useMemo, useState } from 'react'
import type { RecordResult } from '../api/client'
import { BASE_COLORS, baseColor } from '../bases'
import BaseBadge from './BaseBadge'
import ChartCard from './ChartCard'
import './SequenceViewer.css'

const MAX_PER_ROW = 50
const ROW_HEIGHT = 22
// Must match SequenceViewer.css: position label + scrollbar room, and tile width + margin.
const ROW_PADDING = 64 + 12
const TILE_WIDTH = 15

/** Largest multiple of 10 bases (10–50) that fits the available width, so rows never overflow. */
const basesPerRow = (width: number) =>
  Math.min(MAX_PER_ROW, Math.max(10, Math.floor((width - ROW_PADDING) / TILE_WIDTH / 10) * 10))

function SequenceRow({ start, bases }: { start: number; bases: string }) {
  return (
    <div className="seq-row">
      <span className="seq-pos">{(start + 1).toLocaleString()}</span>
      {[...bases].map((b, i) => (
        <span key={i} className="seq-base" style={{ background: baseColor(b) }}>{b}</span>
      ))}
    </div>
  )
}

export default function SequenceViewer({ record }: { record: RecordResult }) {
  const { sequence } = record
  const [perRow, setPerRow] = useState(MAX_PER_ROW)
  // Only the visible rows are rendered, so multi-megabase sequences scroll smoothly.
  const rows = useMemo(
    () => Array.from({ length: Math.ceil(sequence.length / perRow) }, (_, i) => i),
    [sequence, perRow],
  )

  return (
    <ChartCard
      title="Sequence"
      extra={<Space size={12}>{Object.keys(BASE_COLORS).map((b) => <BaseBadge key={b} base={b} />)}</Space>}
    >
      <ResizeObserver onResize={(size) => setPerRow(basesPerRow(size.width))}>
        <div className="seq-scroll">
          <VirtualList data={rows} height={286} itemHeight={ROW_HEIGHT} itemKey={(r) => r}>
            {(r) => <SequenceRow start={r * perRow} bases={sequence.slice(r * perRow, (r + 1) * perRow)} />}
          </VirtualList>
        </div>
      </ResizeObserver>
    </ChartCard>
  )
}
