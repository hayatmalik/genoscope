// Pastel base colours shared by the sequence viewer and the base-composition chart:
// soft enough not to shout, dark enough that the (dark) letters on them stay readable.
export const BASE_COLORS: Record<string, string> = {
  A: '#9cc0ef', // pastel blue
  T: '#f3afc8', // pastel pink
  G: '#97dbbd', // pastel green
  C: '#f5d589', // pastel yellow
  N: '#d3cedd', // pastel grey
}
export const OTHER_COLOR = '#e6e2ec' // IUPAC ambiguity codes (R, Y, S, …)

export const baseColor = (base: string) => BASE_COLORS[base] ?? OTHER_COLOR
