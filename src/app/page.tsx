'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, RefreshCw } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildUsageSummaries } from '@/lib/usage'
import UsageCountCard from '@/components/UsageCountCard'
import type { UsageSummary } from '@/types'

export default function HomePage() {
  const { fields, seasons, pesticides, records, loading, reload } = useApp()
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const summaries = useMemo(
    () => buildUsageSummaries(fields, seasons, pesticides, records),
    [fields, seasons, pesticides, records]
  )

  const filtered = selectedFieldId
    ? summaries.filter((s) => s.field.id === selectedFieldId)
    : summaries

  // 圃場ごとにグループ化
  const grouped = useMemo(() => {
    const map = new Map<string, { fieldName: string; items: UsageSummary[] }>()
    for (const s of filtered) {
      if (!map.has(s.field.id)) {
        map.set(s.field.id, { fieldName: s.field.name, items: [] })
      }
      map.get(s.field.id)!.items.push(s)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="pb-24 pt-0 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🥒 キュウリ防除メモ</h1>
            <p className="text-emerald-100 text-sm mt-0.5">農薬使用回数の一覧</p>
          </div>
          <button
            onClick={reload}
            className="p-2 rounded-full bg-emerald-700 active:bg-emerald-800"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* 圃場フィルター */}
      {fields.length > 1 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedFieldId(null)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedFieldId === null
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            すべて
          </button>
          {fields.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFieldId(f.id === selectedFieldId ? null : f.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedFieldId === f.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-4xl mb-3 animate-spin">🔄</div>
            <p>読み込み中...</p>
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 mt-2">
            {grouped.map(([fieldId, { fieldName, items }]) => (
              <div key={fieldId}>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  {fieldName}
                </h2>
                <div className="space-y-2">
                  {items.map((s) => (
                    <UsageCountCard key={`${s.field.id}-${s.season.id}-${s.pesticide.id}`} summary={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 大きなCTAボタン */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Link
          href="/record"
          className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <PlusCircle size={22} />
          散布を記録する
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <div className="text-5xl mb-4">🌿</div>
      <p className="font-medium text-gray-600 mb-1">まだ記録がありません</p>
      <p className="text-sm">
        まず設定画面で圃場・作期・農薬を<br />登録してください
      </p>
      <Link
        href="/settings"
        className="mt-4 px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
      >
        設定へ
      </Link>
    </div>
  )
}
