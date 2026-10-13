import { Column } from '@ant-design/plots'
import type { RecordResult } from '../api/client'
import ChartCard from './ChartCard'

export default function KmerChart({ record }: { record: RecordResult }) {
  const data = Object.entries(record.kmer_profile).map(([kmer, frequency]) => ({ kmer, frequency }))
  return (
    <ChartCard title="4-mer profile (model input features)">
      <Column
        data={data}
        xField="kmer"
        yField="frequency"
        height={260}
        axis={{ x: { label: false, title: '256 tetranucleotides (AAAA → TTTT)' }, y: { title: 'Frequency' } }}
        slider={{ x: {} }}
      />
    </ChartCard>
  )
}
