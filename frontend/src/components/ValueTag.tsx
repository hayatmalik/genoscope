import { Tag } from 'antd'
import type { ReactNode } from 'react'
import { DARK_CYAN, SOFT_CYAN } from '../theme'

/** Soft-cyan tag for highlighted values (prediction confidence, AT/GC share). */
export default function ValueTag({ children }: { children: ReactNode }) {
  return (
    <Tag variant="filled" style={{ background: SOFT_CYAN, color: DARK_CYAN, fontWeight: 600 }}>
      {children}
    </Tag>
  )
}
