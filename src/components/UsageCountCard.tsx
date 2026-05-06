import type { UsageSummary } from '@/types'
import { STATUS_COLORS, STATUS_BADGE_LABELS, STATUS_MESSAGE } from '@/lib/usage'

interface Props {
  summary: UsageSummary
  showSeason?: boolean
}

export default function UsageCountCard({ summary, showSeason = true }: Props) {
  const { pesticide, season, used_count, remaining, status } = summary
  const percent = Math.min(used_count / pesticide.max_uses_per_season, 1) * 100
  const barColor = status === 'over' || status === 'limit'
    ? 'bg-red-500'
    : status === 'warning'
    ? 'bg-yellow-400'
    : 'bg-emerald-500'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* 上段: 農薬名 + バッジ */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-semibold text-gray-800 text-base leading-tight flex-1">
          {pesticide.name}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
          {STATUS_BADGE_LABELS[status]}
        </span>
      </div>

      {/* 作期 */}
      {showSeason && (
        <p className="text-xs text-gray-400 mb-2">{season.name}</p>
      )}

      {/* プログレスバー */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 下段: 回数テキスト */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-800">
          {used_count}
          <span className="text-sm font-normal text-gray-400"> / {pesticide.max_uses_per_season}回</span>
        </span>
        <span className={`text-sm font-medium ${
          status === 'over'    ? 'text-red-600' :
          status === 'limit'   ? 'text-orange-600' :
          status === 'warning' ? 'text-yellow-600' :
                                 'text-emerald-600'
        }`}>
          {STATUS_MESSAGE[status](remaining)}
        </span>
      </div>
    </div>
  )
}
