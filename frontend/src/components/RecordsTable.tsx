import { Badge, Card, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { RecordResult } from '../api/client'
import { CLASS_COLORS } from '../theme'

type Row = RecordResult & { key: number }

interface Props {
  records: RecordResult[]
  selected: number
  onSelect: (index: number) => void
}

const ORIGINS = ['Archaea', 'Bacteria', 'Eukaryota', 'Viruses']

const columns: TableProps<Row>['columns'] = [
  { title: 'ID', dataIndex: 'id', ellipsis: true, sorter: (a, b) => a.id.localeCompare(b.id) },
  {
    title: 'Length (bp)', dataIndex: 'length', align: 'right',
    sorter: (a, b) => a.length - b.length, render: (v: number) => v.toLocaleString(),
  },
  {
    title: 'GC %', dataIndex: 'gc_content', align: 'right',
    sorter: (a, b) => a.gc_content - b.gc_content, render: (v: number) => (v * 100).toFixed(2),
  },
  {
    title: 'Predicted origin', key: 'origin',
    filters: ORIGINS.map((o) => ({ text: o, value: o })),
    onFilter: (value, r) => r.prediction?.label === value,
    sorter: (a, b) => (a.prediction?.label ?? '').localeCompare(b.prediction?.label ?? ''),
    render: (_, r) =>
      r.prediction ? (
        <>
          <Badge color={CLASS_COLORS[r.prediction.label]} text={r.prediction.label} />
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
            {(r.prediction.probabilities[r.prediction.label] * 100).toFixed(1)}%
          </Typography.Text>
        </>
      ) : (
        <Typography.Text type="secondary">too short</Typography.Text>
      ),
  },
]

export default function RecordsTable({ records, selected, onSelect }: Props) {
  return (
    <Card title={`Records (${records.length})`} style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
      <Table<Row>
        size="small"
        columns={columns}
        dataSource={records.map((r, key) => ({ ...r, key }))}
        rowSelection={{ type: 'radio', selectedRowKeys: [selected], onChange: (keys) => onSelect(Number(keys[0])) }}
        onRow={(r) => ({ onClick: () => onSelect(r.key), style: { cursor: 'pointer' } })}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 560 }}
      />
    </Card>
  )
}
