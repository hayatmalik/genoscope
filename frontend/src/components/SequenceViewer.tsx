import ResizeObserver from '@rc-component/resize-observer'
import VirtualList from '@rc-component/virtual-list'
import { Space } from 'antd'
import { useMemo, useState } from 'react'
import type { RecordResult } from '../api/client'
import { BASE_COLORS, baseColor } from '../bases'
import BaseBadge from './BaseBadge'
import ChartCard from './ChartCard'
import './SequenceViewer.css'

const PER_ROW = 40
const GROUP = 10
const ROW_HEIGHT = 22
// position label + tiles + group gaps + scrollbar room (must match SequenceViewer.css)
const ROW_WIDTH = 64 + PER_ROW * 15 + (PER_ROW / GROUP - 1) * 6 + 12

function SequenceRow({ start, bases }: { start: number; bases: string }) {
  return (
    <div className="seq-row">
      <span className="seq-pos">{(start + 1).toLocaleString()}</span>
      {[...bases].map((b, i) => (
        <span key={i} className={i % GROUP === 0 && i > 0 ? 'seq-base seq-gap' : 'seq-base'}
              style={{ background: baseColor(b) }}>
          {b}
        </span>
      ))}
    </div>
  )
}

export default function SequenceViewer({ record }: { record: RecordResult }) {
  const { sequence } = record
  const [width, setWidth] = useState(ROW_WIDTH)
  // Only the visible rows are rendered, so multi-megabase sequences scroll smoothly.
  const rows = useMemo(() => Array.from({ length: Math.ceil(sequence.length / PER_ROW) }, (_, i) => i), [sequence])

  return (
    <ChartCard
      title="Sequence"
      extra={<Space size={12}>{Object.keys(BASE_COLORS).map((b) => <BaseBadge key={b} base={b} />)}</Space>}
    >
      <ResizeObserver onResize={(size) => setWidth(size.width)}>
        <div className="seq-scroll">
          {/* horizontal scrolling only when the card is narrower than a row (phones) */}
          <VirtualList data={rows} height={286} itemHeight={ROW_HEIGHT} itemKey={(r) => r}
                       scrollWidth={width < ROW_WIDTH ? ROW_WIDTH : undefined}>
            {(r) => <SequenceRow start={r * PER_ROW} bases={sequence.slice(r * PER_ROW, (r + 1) * PER_ROW)} />}
          </VirtualList>
        </div>
      </ResizeObserver>
    </ChartCard>
  )
}
