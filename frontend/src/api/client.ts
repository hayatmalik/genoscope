import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import type { components } from './schema'

export type AnalyzeResponse = components['schemas']['AnalyzeResponse']
export type RecordResult = components['schemas']['RecordResult']

export interface AnalyzeRequest {
  file: Blob
  window: number
}

export function useAnalyze() {
  return useMutation({
    mutationFn: async ({ file, window }: AnalyzeRequest) => {
      const form = new FormData()
      form.append('file', file, 'sequence.fasta')
      const { data } = await axios.post<AnalyzeResponse>('/api/analyze', form, { params: { window } })
      return data
    },
  })
}

export function errorMessage(error: unknown): string {
  return axios.isAxiosError(error) ? (error.response?.data?.detail ?? error.message) : String(error)
}
