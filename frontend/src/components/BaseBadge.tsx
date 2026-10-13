import { Badge } from 'antd'
import { baseColor } from '../bases'

/** Coloured dot + base letter, used by the sequence-viewer and base-composition legends. */
export default function BaseBadge({ base }: { base: string }) {
  return <Badge color={baseColor(base)} text={base} styles={{ indicator: { width: 10, height: 10 } }} />
}
