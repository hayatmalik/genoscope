import { Line } from '@ant-design/plots'
import { InputNumber, Space } from 'antd'
import type { RecordResult } from '../api/client'
import { PURPLE } from '../theme'
import ChartCard from './ChartCard'

interface Props {
  record: RecordResult
  window: number
  onWindowChange: (window: number) => void
}

export default function GCPlot({ record, window, onWindowChange }: Props) {
  return (
    <ChartCard
      title="Sliding-window GC content"
      extra={
        <Space>
          Window
          <InputNumber min={10} max={10000} step={100} value={window} suffix="bp"
                       onChange={(v) => v && onWindowChange(v)} />
        </Space>
      }
      empty={record.gc_windows.length < 2}
    >
      <Line
        data={record.gc_windows}
        xField="position"
        yField="gc"
        height={300}
        axis={{ x: { title: 'Position (bp)' }, y: { title: 'GC fraction' } }}
        scale={{ y: { domain: [0, 1] } }}
        style={{ stroke: PURPLE, lineWidth: 1.5 }}
        slider={{ x: {} }}
      />
    </ChartCard>
  )
}
