import { Alert, Card, Descriptions, Statistic } from 'antd'
import type { RecordResult } from '../api/client'
import ValueTag from './ValueTag'

export default function SummaryCard({ record }: { record: RecordResult }) {
  const { prediction } = record
  return (
    <Card title="Summary" style={{ height: '100%' }}>
      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}
                    items={[
                      { label: 'ID', children: record.id },
                      { label: 'Description', children: record.description },
                    ]} />
      <Statistic title="Length:" value={record.length} suffix="bp" />
      <Statistic title="GC content:" value={record.gc_content * 100} precision={2} suffix="%" style={{ marginTop: 16 }} />
      {prediction && (
        <Statistic
          title={`Predicted origin (${prediction.windows} windows):`}
          value={prediction.label}
          suffix={<ValueTag>{(prediction.probabilities[prediction.label] * 100).toFixed(1)}%</ValueTag>}
          style={{ marginTop: 16 }}
        />
      )}
      {record.warning && <Alert type="warning" title={record.warning} style={{ marginTop: 16 }} />}
    </Card>
  )
}
