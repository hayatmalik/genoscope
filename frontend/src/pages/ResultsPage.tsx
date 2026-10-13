import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Row, Select } from 'antd'
import { useState } from 'react'
import type { AnalyzeResponse } from '../api/client'
import GCPlot from '../components/GCPlot'
import KmerChart from '../components/KmerChart'
import PredictionChart from '../components/PredictionChart'
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
  const record = result.records[Math.min(index, result.records.length - 1)]

  return (
    <>
      <Flex wrap gap={8} style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onReset}>New analysis</Button>
        {result.records.length > 1 && (
          <Select value={index} onChange={setIndex} style={{ flex: '1 1 240px', maxWidth: 480, minWidth: 0 }}
                  options={result.records.map((r, i) => ({ value: i, label: r.description }))} />
        )}
        <Button icon={<DownloadOutlined />} onClick={() => downloadJson(result)} style={{ marginLeft: 'auto' }}>
          Export JSON
        </Button>
      </Flex>
      <Row gutter={16}>
        <Col xs={24} lg={8}>
          <SummaryCard record={record} />
        </Col>
        <Col xs={24} lg={16}>
          <GCPlot record={record} window={window} onWindowChange={onWindowChange} />
          <PredictionChart record={record} />
          <KmerChart record={record} />
        </Col>
      </Row>
    </>
  )
}
