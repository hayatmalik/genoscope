import { Alert, Layout, Spin, Typography } from 'antd'
import { useState } from 'react'
import { errorMessage, useAnalyze } from './api/client'
import ResultsPage from './pages/ResultsPage'
import UploadPage from './pages/UploadPage'

export default function App() {
  const analyze = useAnalyze()
  const [file, setFile] = useState<Blob>()
  const [window, setWindow] = useState(500)

  const run = (f: Blob, w: number) => {
    setFile(f)
    setWindow(w)
    analyze.mutate({ file: f, window: w })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>GenoScope</Typography.Title>
      </Layout.Header>
      <Layout.Content style={{ padding: '24px clamp(16px, 4vw, 48px)' }}>
        {analyze.isError && (
          <Alert type="error" showIcon closable title={errorMessage(analyze.error)} onClose={analyze.reset}
                 style={{ maxWidth: 720, margin: '0 auto 16px' }} />
        )}
        <Spin spinning={analyze.isPending}>
          {analyze.data && file ? (
            <ResultsPage result={analyze.data} window={window} onWindowChange={(w) => run(file, w)}
                         onReset={analyze.reset} />
          ) : (
            <UploadPage loading={analyze.isPending} onSubmit={(f) => run(f, window)} />
          )}
        </Spin>
      </Layout.Content>
    </Layout>
  )
}
