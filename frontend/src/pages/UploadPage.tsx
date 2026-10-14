import { InboxOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Tabs, Typography, Upload } from 'antd'
import { useState } from 'react'

interface Props {
  loading: boolean
  onSubmit: (file: Blob) => void
}

export default function UploadPage({ loading, onSubmit }: Props) {
  const [text, setText] = useState('')
  const loadExample = async () => onSubmit(await (await fetch('/example.fasta')).blob())

  return (
    <Card style={{ maxWidth: 720, margin: '48px auto' }}>
      <Typography.Title level={3}>Analyze a DNA sequence</Typography.Title>
      <Typography.Paragraph type="secondary">
        Upload a FASTA file to get its composition, GC profile, open reading frames and a predicted origin
        (Archaea, Bacteria, Eukaryota or Viruses).
      </Typography.Paragraph>
      <Tabs
        items={[
          {
            key: 'upload',
            label: 'Upload file',
            children: (
              <Upload.Dragger accept=".fa,.fasta,.fna,.txt" maxCount={1} showUploadList={false} disabled={loading}
                              beforeUpload={(file) => { onSubmit(file); return false }}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Click or drag a FASTA file here</p>
                <p className="ant-upload-hint">Up to 5 MB, one or more records</p>
              </Upload.Dragger>
            ),
          },
          {
            key: 'paste',
            label: 'Paste sequence',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input.TextArea rows={8} value={text} onChange={(e) => setText(e.target.value)}
                                placeholder={'>my_sequence\nACGT...'} style={{ fontFamily: 'monospace' }} />
                <Button type="primary" loading={loading} disabled={!text.trim()}
                        onClick={() => onSubmit(new Blob([text.trim().startsWith('>') ? text : `>pasted\n${text}`]))}>
                  Analyze
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Button type="link" onClick={loadExample} loading={loading} style={{ paddingLeft: 0 }}>
        Try an example (one sequence per superkingdom)
      </Button>
    </Card>
  )
}
