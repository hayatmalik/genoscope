import type { ConfigProviderProps, ThemeConfig } from 'antd'

// Final palette — purple (primary: headings, interactive elements; card headers and labels in a
// deep indigo-purple shade) and cyan (secondary: values, tags, accents). Surfaces stay white/near-white.
export const PURPLE = '#6d4bc3'
export const DARK_PURPLE = '#30265e' // deep indigo-purple: card headers, app header start, field labels
export const CYAN = '#29b2d8' // light blue / cyan
export const DARK_CYAN = '#0b6c8a' // field values (readable on white)
export const SOFT_CYAN = '#dcf2f9' // tag backgrounds
export const HEADING = '#3b2a75' // deep purple for headings outside cards
// App header only: deep indigo-purple → cyan, white title
export const HEADER_GRADIENT = `linear-gradient(90deg, ${DARK_PURPLE} 0%, ${CYAN} 100%)`

// Prediction classes: discrete purple/cyan family colours
export const CLASS_COLORS: Record<string, string> = {
  Archaea: CYAN,
  Bacteria: '#4a7bd6',
  Eukaryota: '#9a7fdc',
  Viruses: PURPLE,
}

export const STRAND_COLORS = { Forward: CYAN, Reverse: PURPLE }

export const theme: ThemeConfig = {
  token: {
    colorPrimary: PURPLE,
    colorInfo: PURPLE,
    colorLink: PURPLE,
    colorTextHeading: HEADING,
    colorBgLayout: '#f6f5fb',
    borderRadius: 8,
    borderRadiusLG: 12,
  },
  components: {
    // solid deep indigo-purple card headers with white titles
    Card: { headerBg: DARK_PURPLE, colorTextHeading: '#fff', headerFontSize: 15 },
    Table: { headerBg: '#f4f2fa', rowSelectedBg: '#ece7f9', rowSelectedHoverBg: '#e4ddf6' },
    // field labels ("ID:", "Length:", …) deep indigo-purple; their values dark cyan
    Descriptions: { labelColor: DARK_PURPLE, contentColor: DARK_CYAN },
    Statistic: { colorTextDescription: DARK_PURPLE, colorTextHeading: DARK_CYAN },
  },
}

// Bold field labels app-wide (passed to ConfigProvider next to `theme`)
const BOLD_LABEL = { fontWeight: 600 }
export const componentDefaults: ConfigProviderProps = {
  descriptions: { styles: { label: BOLD_LABEL } },
  statistic: { styles: { title: BOLD_LABEL } },
}
