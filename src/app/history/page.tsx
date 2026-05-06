'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import type { SprayRecordWithJoins } from '@/types'

export default function HistoryPage() {
  const router = useRouter()
  const { recordsWithJoins, fields, seasons, pesticides, deleteSprayRecord } = useApp()

  const [filterField, setFilterField] = useState('')
  const [filterSeason, setFilterSeason] = useState('')
  const [filterPesticide, setFilterPesticide] = useState('')

  const filtered = useMemo(() => {
    return recordsWithJoins.filter((r) => {
      if (filterField && r.field_id !== filterField) return false
      if (filterSeason && r.season_id !== filterSeason) return false
      if (filterPesticide && r.pesticide_id !== filterPesticide) return false
      return true
    })
  }, [recordsWithJoins, filterField, filterSeason, filterPesticide])

  const handleExportCSV = () => {
    const header = ['散布日', '圃場', '作期', '農薬', '使用量', 'メモ']
    const rows = filtered.map((r) => [
      r.sprayed_at,
      r.fields?.name ?? '',
      r.seasons?.name ?? '',
      r.pesticides?.name ?? '',
      r.amount ?? '',
      r.memo ?? '',
    ])
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `散布記録_${new Date().toLocaleDateString('sv-SE')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (r: SprayRecordWithJoins) => {
    if (!confirm(`${r.sprayed_at} の ${r.pesticides?.name} の記録を削除しますか？`)) return
    await deleteSprayRecord(r.id)
  }

  return (
    <div className="pb-24 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-5">
        <h1 className="text-xl font-bold">散布履歴</h1>
        <p className="text-emerald-100 text-sm mt-0.5">{filtered.length}件</p>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="">圃場: すべて</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="">作期: すべて</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filterPesticide}
            onChange={(e) => setFilterPesticide(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="">農薬: すべて</option>
            {pesticides.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-medium disabled:opacity-40 active:bg-emerald-50"
        >
          <Download size={16} />
          CSVエクスポート（{filtered.length}件）
        </button>
      </div>

      {/* 一覧 */}
      <div className="px-4 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>記録がありません</p>
          </div>
        ) : (
          filtered.map((r) => <RecordCard key={r.id} record={r} onDelete={() => handleDelete(r)} />)
        )}
      </div>

      {/* 注意文 */}
      <Disclaimer />
    </div>
  )
}

function RecordCard({ record: r, onDelete }: { record: SprayRecordWithJoins; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{r.sprayed_at}</p>
          <p className="font-semibold text-gray-800 truncate">{r.pesticides?.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.fields?.name}
            {r.seasons?.name && <span> / {r.seasons.name}</span>}
          </p>
          {r.amount && <p className="text-sm text-gray-500">{r.amount}</p>}
          {r.memo && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{r.memo}</p>}
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-gray-300 hover:text-red-400 active:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function Disclaimer() {
  return (
    <p className="mx-4 mt-4 mb-6 text-xs text-gray-400 leading-relaxed">
      ※農薬情報は変更される場合があります。使用前に必ず最新の農薬ラベル、農薬登録情報、地域の防除暦を確認してください。本アプリは記録補助ツールです。
    </p>
  )
}
