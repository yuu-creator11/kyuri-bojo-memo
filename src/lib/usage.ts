import type { Field, Season, Pesticide, SprayRecord, UsageStatus, UsageSummary } from '@/types'

export function calcStatus(remaining: number): UsageStatus {
  if (remaining >= 2) return 'ok'
  if (remaining === 1) return 'warning'
  if (remaining === 0) return 'limit'
  return 'over'
}

export const STATUS_COLORS: Record<UsageStatus, string> = {
  ok:      'bg-green-100 text-green-700 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  limit:   'bg-orange-100 text-orange-700 border border-orange-200',
  over:    'bg-red-100 text-red-700 border border-red-200',
}

export const STATUS_BADGE_LABELS: Record<UsageStatus, string> = {
  ok:      '残あり',
  warning: '残1回',
  limit:   '上限',
  over:    '超過',
}

export const STATUS_MESSAGE: Record<UsageStatus, (remaining: number) => string> = {
  ok:      (n) => `あと${n}回使えます`,
  warning: ()  => 'あと1回です',
  limit:   ()  => '上限に達しています',
  over:    ()  => '上限を超えている可能性があります',
}

export function buildUsageSummaries(
  fields: Field[],
  seasons: Season[],
  pesticides: Pesticide[],
  records: SprayRecord[]
): UsageSummary[] {
  const summaries: UsageSummary[] = []

  for (const field of fields) {
    for (const season of seasons) {
      for (const pesticide of pesticides) {
        const used_count = records.filter(
          (r) =>
            r.field_id === field.id &&
            r.season_id === season.id &&
            r.pesticide_id === pesticide.id
        ).length

        if (used_count === 0) continue

        const remaining = pesticide.max_uses_per_season - used_count
        summaries.push({
          field,
          season,
          pesticide,
          used_count,
          remaining,
          status: calcStatus(remaining),
        })
      }
    }
  }

  const order: Record<UsageStatus, number> = { over: 0, limit: 1, warning: 2, ok: 3 }
  return summaries.sort((a, b) => order[a.status] - order[b.status])
}

export function getUsageForRecord(
  fieldId: string,
  seasonId: string,
  pesticideId: string,
  pesticide: Pesticide,
  records: SprayRecord[]
): { used_count: number; remaining: number; status: UsageStatus } {
  const used_count = records.filter(
    (r) => r.field_id === fieldId && r.season_id === seasonId && r.pesticide_id === pesticideId
  ).length
  const remaining = pesticide.max_uses_per_season - used_count
  return { used_count, remaining, status: calcStatus(remaining) }
}
