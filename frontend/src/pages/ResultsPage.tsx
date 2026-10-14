import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Row, Typography } from 'antd'
import { useState } from 'react'
import type { AnalyzeResponse } from '../api/client'
import BaseCompositionCard from '../components/BaseCompositionCard'
import GCPlot from '../components/GCPlot'
import OrfMap from '../components/OrfMap'
import PredictionChart from '../components/PredictionChart'
import RecordsTable from '../components/RecordsTable'
import SequenceViewer from '../components/SequenceViewer'
import SummaryCard from '../components/SummaryCard'

interface Props {
  result: AnalyzeResponse
  window: number
  onWindowChange: (window: number) => void
  onReset: () => void
}

function downloadJson(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  Object.assign(document.createElement('a'), { href: url, download: 'genoscope-results.json' }).click()
  URL.revokeObjectURL(url)
}

export default function ResultsPage({ result, window, onWindowChange, onReset }: Props) {
  const [index, setIndex] = useState(0)
  const selected = Math.min(index, result.records.length - 1)
  const record = result.records[selected]

  return (
    <>
      <Flex wrap gap={8} justify="space-between" style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onReset}>New analysis</Button>
        <Button icon={<DownloadOutlined />} onClick={() => downloadJson(result)}>Export JSON</Button>
      </Flex>
      <RecordsTable records={result.records} selected={selected} onSelect={setIndex} />
      <Typography.Title level={4} ellipsis style={{ margin: '24px 0 16px' }}>{record.id}</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}><SummaryCard record={record} /></Col>
        <Col xs={24} lg={16}><SequenceViewer record={record} /></Col>
        <Col xs={24} lg={8}><BaseCompositionCard record={record} /></Col>
        <Col xs={24} lg={16}><GCPlot record={record} window={window} onWindowChange={onWindowChange} /></Col>
        <Col xs={24} lg={8}><PredictionChart record={record} /></Col>
        <Col xs={24} lg={16}><OrfMap record={record} /></Col>
      </Row>
    </>
  )
}
