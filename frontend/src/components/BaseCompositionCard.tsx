import { Pie } from '@ant-design/plots'
import { Descriptions, Typography } from 'antd'
import type { RecordResult } from '../api/client'
import { BASE_COLORS, baseColor } from '../bases'
import BaseBadge from './BaseBadge'
import ChartCard from './ChartCard'

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(1)}%`

export default function BaseCompositionCard({ record }: { record: RecordResult }) {
  const counts = Object.keys(BASE_COLORS).map((base) => ({ base, count: record.base_counts[base] ?? 0 }))
  const other = record.length - counts.reduce((sum, c) => sum + c.count, 0)
  const data = other > 0 ? [...counts, { base: 'Other', count: other }] : counts
  const count = (b: string) => record.base_counts[b] ?? 0

  return (
    <ChartCard title="Base composition">
      <Pie
        data={data}
        angleField="count"
        colorField="base"
        innerRadius={0.6}
        height={200}
        scale={{ color: { domain: data.map((d) => d.base), range: data.map((d) => baseColor(d.base)) } }}
        legend={false}
        label={false}
        tooltip={{ items: [(d: { base: string; count: number }) => ({ name: d.base, value: d.count.toLocaleString() })] }}
      />
      <Descriptions column={2} size="small"
                    items={data.map((d) => ({
                      key: d.base,
                      label: <BaseBadge base={d.base} />,
                      children: `${d.count.toLocaleString()} (${pct(d.count, record.length)})`,
                    }))} />
      <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
        AT {pct(count('A') + count('T'), record.length)} · GC {pct(count('G') + count('C'), record.length)}
      </Typography.Paragraph>
    </ChartCard>
  )
}
