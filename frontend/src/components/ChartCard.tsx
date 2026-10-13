import { Card, Empty } from 'antd'
import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  extra?: ReactNode
  empty?: boolean
  children: ReactNode
}

export default function ChartCard({ title, extra, empty, children }: Props) {
  return (
    <Card title={title} extra={extra} style={{ height: '100%' }}>
      {empty ? <Empty description="Not enough sequence for this view" /> : children}
    </Card>
  )
}
