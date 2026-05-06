export interface Field {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Season {
  id: string
  user_id: string
  name: string
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Pesticide {
  id: string
  user_id: string
  name: string
  registration_number: string | null
  max_uses_per_season: number
  pre_harvest_interval_days: number | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface SprayRecord {
  id: string
  user_id: string
  field_id: string
  season_id: string
  pesticide_id: string
  sprayed_at: string
  amount: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface SprayRecordWithJoins extends SprayRecord {
  fields: Pick<Field, 'id' | 'name'>
  seasons: Pick<Season, 'id' | 'name'>
  pesticides: Pick<Pesticide, 'id' | 'name' | 'max_uses_per_season'>
}

export type UsageStatus = 'ok' | 'warning' | 'limit' | 'over'

export interface UsageSummary {
  field: Field
  season: Season
  pesticide: Pesticide
  used_count: number
  remaining: number
  status: UsageStatus
}

export type CreateFieldInput = { name: string }
export type CreateSeasonInput = { name: string; start_date: string | null; end_date: string | null }
export type CreatePesticideInput = {
  name: string
  registration_number: string | null
  max_uses_per_season: number
  pre_harvest_interval_days: number | null
  memo: string | null
}
export type CreateSprayRecordInput = {
  field_id: string
  season_id: string
  pesticide_id: string
  sprayed_at: string
  amount: string | null
  memo: string | null
}

export type ToastType = 'success' | 'error' | 'info'
export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}
