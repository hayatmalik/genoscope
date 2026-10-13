import { Alert, Card, Descriptions, Statistic, Tag } from 'antd'
import type { RecordResult } from '../api/client'

export default function SummaryCard({ record }: { record: RecordResult }) {
  const { prediction } = record
  return (
    <Card title="Summary" style={{ marginBottom: 16 }}>
      <Statistic title="Length" value={record.length} suffix="bp" />
      <Statistic title="GC content" value={record.gc_content * 100} precision={2} suffix="%" style={{ marginTop: 16 }} />
      {prediction && (
        <Statistic
          title={`Predicted origin (${prediction.windows} windows)`}
          value={prediction.label}
          suffix={<Tag color="blue">{(prediction.probabilities[prediction.label] * 100).toFixed(1)}%</Tag>}
          style={{ marginTop: 16 }}
        />
      )}
      {record.warning && <Alert type="warning" title={record.warning} style={{ marginTop: 16 }} />}
      <Descriptions title="Base counts" column={2} size="small" style={{ marginTop: 24 }}>
        {Object.entries(record.base_counts).map(([base, count]) => (
          <Descriptions.Item key={base} label={base}>
            {count.toLocaleString()}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  )
}
