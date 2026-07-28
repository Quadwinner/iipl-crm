import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const DEFAULT_GST_RATE = 18

export function useGstRatePercent() {
  return useQuery({
    queryKey: ['config', 'gst-rate'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase()
        .from('global_config')
        .select('default_gst_rate_percent')
        .eq('id', 1)
        .maybeSingle()
      if (error || !data) return DEFAULT_GST_RATE
      return Number(data.default_gst_rate_percent)
    },
  })
}
