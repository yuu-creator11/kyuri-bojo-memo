'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { getUsageForRecord, STATUS_MESSAGE } from '@/lib/usage'
import type { SprayRecord } from '@/types'

function today() {
  return new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD
}

interface SavedResult {
  record: SprayRecord
  fieldName: string
  seasonName: string
  pesticideName: string
  used_count: number
  remaining: number
  max: number
  message: string
}

export default function RecordPage() {
  const router = useRouter()
  const { fields, seasons, pesticides, records, createSprayRecord, getRecentPesticides } = useApp()

  const [date, setDate] = useState(today())
  const [fieldId, setFieldId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [pesticideId, setPesticideId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SavedResult | null>(null)

  const recentPesticides = getRecentPesticides()
  const otherPesticides = pesticides.filter((p) => !recentPesticides.find((r) => r.id === p.id))

  const canSave = fieldId && seasonId && pesticideId && date

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    const result = await createSprayRecord({
      field_id: fieldId,
      season_id: seasonId,
      pesticide_id: pesticideId,
      sprayed_at: date,
      amount: amount || null,
      memo: memo || null,
    })

    if (result) {
      const pesticide = pesticides.find((p) => p.id === pesticideId)!
      const field = fields.find((f) => f.id === fieldId)!
      const season = seasons.find((s) => s.id === seasonId)!

      // 保存後のrecordsには今回のレコードが含まれているのでそのまま集計
      const allRecords = [...records, result]
      const { used_count, remaining, status } = getUsageForRecord(
        fieldId, seasonId, pesticideId, pesticide, allRecords
      )

      setSaved({
        record: result,
        fieldName: field.name,
        seasonName: season.name,
        pesticideName: pesticide.name,
        used_count,
        remaining,
        max: pesticide.max_uses_per_season,
        message: STATUS_MESSAGE[status](remaining),
      })
    }

    setSaving(false)
  }

  const handleContinue = () => {
    setSaved(null)
    setAmount('')
    setMemo('')
    setPesticideId('')
  }

  if (saved) {
    return <SavedFeedback result={saved} onContinue={handleContinue} onHome={() => router.push('/')} />
  }

  return (
    <div className="pb-28 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-emerald-100 mb-3">
          <ChevronLeft size={18} /> 戻る
        </button>
        <h1 className="text-xl font-bold">散布を記録する</h1>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* 散布日 */}
        <Section label="散布日">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </Section>

        {/* 圃場 */}
        <Section label="圃場">
          {fields.length === 0 ? (
            <EmptyMessage label="圃場" href="/settings" />
          ) : (
            <ChipGroup
              items={fields.map((f) => ({ id: f.id, label: f.name }))}
              selected={fieldId}
              onSelect={setFieldId}
            />
          )}
        </Section>

        {/* 作期 */}
        <Section label="作期">
          {seasons.length === 0 ? (
            <EmptyMessage label="作期" href="/settings" />
          ) : (
            <ChipGroup
              items={seasons.map((s) => ({ id: s.id, label: s.name }))}
              selected={seasonId}
              onSelect={setSeasonId}
            />
          )}
        </Section>

        {/* 農薬 */}
        <Section label="農薬">
          {pesticides.length === 0 ? (
            <EmptyMessage label="農薬" href="/settings" />
          ) : (
            <div className="space-y-3">
              {recentPesticides.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">最近使用</p>
                  <ChipGroup
                    items={recentPesticides.map((p) => ({ id: p.id, label: p.name }))}
                    selected={pesticideId}
                    onSelect={setPesticideId}
                  />
                </div>
              )}
              {otherPesticides.length > 0 && (
                <div>
                  {recentPesticides.length > 0 && (
                    <p className="text-xs text-gray-400 mb-1.5">すべての農薬</p>
                  )}
                  <ChipGroup
                    items={otherPesticides.map((p) => ({ id: p.id, label: p.name }))}
                    selected={pesticideId}
                    onSelect={setPesticideId}
                  />
                </div>
              )}
            </div>
          )}
        </Section>

        {/* 使用量 */}
        <Section label="使用量（任意）">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例: 1000倍 100L"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </Section>

        {/* メモ */}
        <Section label="メモ（任意）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="天候、病害の状況など"
            rows={2}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
        </Section>
      </div>

      {/* 保存ボタン */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-emerald-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:shadow-none"
        >
          {saving ? '保存中...' : '散布を記録する'}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">{label}</label>
      {children}
    </div>
  )
}

function ChipGroup({
  items,
  selected,
  onSelect,
}: {
  items: { id: string; label: string }[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors active:scale-95 ${
            selected === item.id
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function EmptyMessage({ label, href }: { label: string; href: string }) {
  return (
    <p className="text-sm text-gray-400">
      {label}が未登録です。
      <a href={href} className="text-emerald-600 underline ml-1">設定から登録</a>
    </p>
  )
}

function SavedFeedback({
  result,
  onContinue,
  onHome,
}: {
  result: SavedResult
  onContinue: () => void
  onHome: () => void
}) {
  const percent = Math.min(result.used_count / result.max, 1) * 100

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={56} />
          <h2 className="text-2xl font-bold text-gray-800">記録しました</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <p className="text-sm text-gray-500 mb-0.5">{result.fieldName} / {result.seasonName}</p>
          <p className="text-lg font-bold text-gray-800 mb-3">{result.pesticideName}</p>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-800">
              {result.used_count}
              <span className="text-base font-normal text-gray-400"> / {result.max}回</span>
            </span>
            <span className="text-base font-semibold text-emerald-600">
              {result.message}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
          >
            続けて記録する
          </button>
          <button
            onClick={onHome}
            className="w-full bg-white text-emerald-700 font-semibold py-4 rounded-2xl border border-emerald-200 active:scale-95 transition-all"
          >
            ホームへ
          </button>
        </div>
      </div>
    </div>
  )
}
