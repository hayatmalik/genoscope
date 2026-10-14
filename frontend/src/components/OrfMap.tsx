import { Bar } from '@ant-design/plots'
import { Col, Empty, Row, Statistic } from 'antd'
import type { RecordResult } from '../api/client'
import { STRAND_COLORS } from '../theme'
import ChartCard from './ChartCard'

const FRAMES = ['+1', '+2', '+3', '-1', '-2', '-3']
const MIN_ORF_LEN = 300 // must match MIN_ORF_LEN in backend/app/analysis.py

export default function OrfMap({ record }: { record: RecordResult }) {
  const orfs = record.orfs.map((o) => ({
    frame: o.frame > 0 ? `+${o.frame}` : `${o.frame}`,
    range: [o.start, o.end],
    strand: o.frame > 0 ? 'Forward' : 'Reverse',
    length: o.end - o.start + 1,
    position: `${o.start.toLocaleString()}–${o.end.toLocaleString()}`,
  }))
  const longest = Math.max(0, ...orfs.map((o) => o.length))

  return (
    <ChartCard title="Open reading frames (six-frame map)">
      <Row gutter={16} style={{ marginBottom: 8 }}>
        <Col span={8}><Statistic title={`ORFs ≥ ${MIN_ORF_LEN} bp:`} value={orfs.length} /></Col>
        <Col span={8}>
          <Statistic title="Longest ORF:" value={longest} suffix={`bp · ${Math.max(0, (longest - 3) / 3)} aa`} />
        </Col>
        <Col span={8}>
          <Statistic title="Coding density:" value={record.coding_density * 100} precision={1} suffix="%" />
        </Col>
      </Row>
      {orfs.length === 0 ? (
        <Empty description={`No ATG→stop ORFs of at least ${MIN_ORF_LEN} bp`} />
      ) : (
        <Bar
          data={orfs}
          xField="frame"
          yField="range"
          colorField="strand"
          height={260}
          scale={{
            x: { domain: FRAMES },
            y: { domain: [1, record.length] },
            color: { domain: Object.keys(STRAND_COLORS), range: Object.values(STRAND_COLORS) },
          }}
          axis={{ x: { title: 'Frame' }, y: { title: 'Position (bp)' } }}
          style={{ maxWidth: 14, radius: 2 }}
          legend={{ color: { position: 'top' } }}
          tooltip={{
            title: (d: { frame: string }) => `Frame ${d.frame}`,
            items: [
              (d: { position: string }) => ({ name: 'Position', value: d.position }),
              (d: { length: number }) => ({ name: 'Length', value: `${d.length} bp · ${(d.length - 3) / 3} aa` }),
            ],
          }}
        />
      )}
    </ChartCard>
  )
}
