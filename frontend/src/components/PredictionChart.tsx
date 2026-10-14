import { Bar } from '@ant-design/plots'
import type { RecordResult } from '../api/client'
import { CLASS_COLORS, DARK_CYAN, DARK_PURPLE } from '../theme'
import ChartCard from './ChartCard'

export default function PredictionChart({ record }: { record: RecordResult }) {
  const data = Object.entries(record.prediction?.probabilities ?? {}).map(([label, p]) => ({ label, probability: p }))
  return (
    <ChartCard title="Origin prediction (class probabilities)" empty={!record.prediction}>
      <Bar
        data={data}
        xField="label"
        yField="probability"
        colorField="label"
        height={240}
        scale={{
          y: { domain: [0, 1] },
          color: { domain: Object.keys(CLASS_COLORS), range: Object.values(CLASS_COLORS) },
        }}
        // class names styled like field labels, percentages like values
        axis={{ x: { labelFill: DARK_PURPLE, labelOpacity: 1, labelFillOpacity: 1, labelFontWeight: 600 } }}
        label={{
          text: (d: { probability: number }) => `${(d.probability * 100).toFixed(1)}%`,
          position: 'right', textAlign: 'start', dx: 6,
          fill: DARK_CYAN, fillOpacity: 1,
        }}
        legend={false}
      />
    </ChartCard>
  )
}
