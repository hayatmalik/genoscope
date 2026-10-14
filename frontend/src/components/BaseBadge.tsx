import { Badge } from 'antd'
import { baseColor } from '../bases'

/** Coloured dot + base letter, used by the sequence-viewer and base-composition legends. */
export default function BaseBadge({ base, textColor }: { base: string; textColor?: string }) {
  return (
    <Badge color={baseColor(base)} text={<span style={{ color: textColor }}>{base}</span>}
           styles={{ indicator: { width: 10, height: 10 } }} />
  )
}
