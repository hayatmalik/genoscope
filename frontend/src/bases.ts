// Muted, warm base colours shared by the sequence viewer and the base-composition chart.
export const BASE_COLORS: Record<string, string> = {
  A: '#8aa4bf', // dusty blue
  T: '#a990b3', // muted mauve
  G: '#93b08c', // sage green
  C: '#d9b872', // ochre
  N: '#b8aea3', // warm grey
}
export const OTHER_COLOR = '#ddd5ca' // IUPAC ambiguity codes (R, Y, S, …)

export const baseColor = (base: string) => BASE_COLORS[base] ?? OTHER_COLOR
