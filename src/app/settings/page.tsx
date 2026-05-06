'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import type { Field, Season, Pesticide } from '@/types'

type Tab = 'fields' | 'seasons' | 'pesticides'

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('fields')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fields', label: '圃場' },
    { id: 'seasons', label: '作期' },
    { id: 'pesticides', label: '農薬' },
  ]

  return (
    <div className="pb-24 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">設定</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-emerald-100 text-sm"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </div>

      {/* タブ */}
      <div className="flex bg-white border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === 'fields' && <FieldsTab />}
        {tab === 'seasons' && <SeasonsTab />}
        {tab === 'pesticides' && <PesticidesTab />}
      </div>

      {/* 免責事項 */}
      <p className="mx-4 mt-4 text-xs text-gray-400 leading-relaxed">
        ※農薬情報は変更される場合があります。使用前に必ず最新の農薬ラベル、農薬登録情報、地域の防除暦を確認してください。本アプリは記録補助ツールです。
      </p>
    </div>
  )
}

// ─── 圃場タブ ───────────────────────────────────────────────
function FieldsTab() {
  const { fields, createField, updateField, deleteField } = useApp()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    await createField({ name: newName.trim() })
    setNewName('')
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    await updateField(id, { name: editName.trim() })
    setEditId(null)
  }

  return (
    <div className="space-y-3">
      {/* 追加フォーム */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="圃場名を入力"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="bg-emerald-600 disabled:bg-gray-200 text-white px-4 rounded-xl active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* 一覧 */}
      {fields.map((f) => (
        <EditableRow
          key={f.id}
          label={f.name}
          isEditing={editId === f.id}
          editValue={editName}
          onEditChange={setEditName}
          onEditStart={() => { setEditId(f.id); setEditName(f.name) }}
          onEditSave={() => handleUpdate(f.id)}
          onEditCancel={() => setEditId(null)}
          onDelete={() => deleteField(f.id)}
        />
      ))}

      {fields.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">圃場がまだ登録されていません</p>
      )}
    </div>
  )
}

// ─── 作期タブ ───────────────────────────────────────────────
function SeasonsTab() {
  const { seasons, createSeason, updateSeason, deleteSeason } = useApp()
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', start_date: '', end_date: '' })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await createSeason({
      name: form.name.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    })
    setForm({ name: '', start_date: '', end_date: '' })
  }

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) return
    await updateSeason(id, {
      name: editForm.name.trim(),
      start_date: editForm.start_date || null,
      end_date: editForm.end_date || null,
    })
    setEditId(null)
  }

  return (
    <div className="space-y-3">
      {/* 追加フォーム */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="作期名（例: 2026年春作）"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <button
          onClick={handleAdd}
          disabled={!form.name.trim()}
          className="w-full bg-emerald-600 disabled:bg-gray-200 text-white py-3 rounded-xl font-medium active:scale-95 transition-all"
        >
          作期を追加
        </button>
      </div>

      {/* 一覧 */}
      {seasons.map((s) => (
        editId === s.id ? (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-2">
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={editForm.start_date ?? ''} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input type="date" value={editForm.end_date ?? ''} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleUpdate(s.id)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium">保存</button>
              <button onClick={() => setEditId(null)} className="px-4 border border-gray-200 rounded-xl text-sm text-gray-500">キャンセル</button>
            </div>
          </div>
        ) : (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-2">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{s.name}</p>
              {(s.start_date || s.end_date) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.start_date ?? '?'} 〜 {s.end_date ?? '?'}
                </p>
              )}
            </div>
            <button onClick={() => { setEditId(s.id); setEditForm({ name: s.name, start_date: s.start_date ?? '', end_date: s.end_date ?? '' }) }}
              className="p-2 text-gray-400 hover:text-emerald-600"><Pencil size={16} /></button>
            <button onClick={() => deleteSeason(s.id)} className="p-2 text-gray-300 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        )
      ))}

      {seasons.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">作期がまだ登録されていません</p>
      )}
    </div>
  )
}

// ─── 農薬タブ ───────────────────────────────────────────────
function PesticidesTab() {
  const { pesticides, createPesticide, updatePesticide, deletePesticide } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const emptyForm = { name: '', registration_number: '', max_uses_per_season: 5, pre_harvest_interval_days: '', memo: '' }
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await createPesticide({
      name: form.name.trim(),
      registration_number: form.registration_number || null,
      max_uses_per_season: Number(form.max_uses_per_season) || 5,
      pre_harvest_interval_days: form.pre_harvest_interval_days ? Number(form.pre_harvest_interval_days) : null,
      memo: form.memo || null,
    })
    setForm(emptyForm)
    setShowForm(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) return
    await updatePesticide(id, {
      name: editForm.name.trim(),
      registration_number: editForm.registration_number || null,
      max_uses_per_season: Number(editForm.max_uses_per_season) || 5,
      pre_harvest_interval_days: editForm.pre_harvest_interval_days ? Number(editForm.pre_harvest_interval_days) : null,
      memo: editForm.memo || null,
    })
    setEditId(null)
  }

  return (
    <div className="space-y-3">
      {/* 追加ボタン / フォーム */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-600 font-medium text-sm active:bg-emerald-50"
        >
          <Plus size={18} /> 農薬を追加
        </button>
      ) : (
        <PesticideForm
          value={form}
          onChange={setForm}
          onSave={handleAdd}
          onCancel={() => { setShowForm(false); setForm(emptyForm) }}
          saveLabel="追加する"
        />
      )}

      {/* 一覧 */}
      {pesticides.map((p) => (
        editId === p.id ? (
          <PesticideForm
            key={p.id}
            value={editForm}
            onChange={setEditForm}
            onSave={() => handleUpdate(p.id)}
            onCancel={() => setEditId(null)}
            saveLabel="保存"
          />
        ) : (
          <PesticideCard
            key={p.id}
            pesticide={p}
            onEdit={() => {
              setEditId(p.id)
              setEditForm({
                name: p.name,
                registration_number: p.registration_number ?? '',
                max_uses_per_season: p.max_uses_per_season,
                pre_harvest_interval_days: p.pre_harvest_interval_days?.toString() ?? '',
                memo: p.memo ?? '',
              })
            }}
            onDelete={() => deletePesticide(p.id)}
          />
        )
      ))}

      {pesticides.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">農薬がまだ登録されていません</p>
      )}
    </div>
  )
}

function PesticideForm({
  value,
  onChange,
  onSave,
  onCancel,
  saveLabel,
}: {
  value: { name: string; registration_number: string; max_uses_per_season: number; pre_harvest_interval_days: string; memo: string }
  onChange: (v: typeof value) => void
  onSave: () => void
  onCancel: () => void
  saveLabel: string
}) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white'

  return (
    <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3">
      <Field label="農薬名 *">
        <input type="text" value={value.name} onChange={set('name')} placeholder="例: ダコニール1000"
          className={inputCls} />
      </Field>
      <Field label="登録番号">
        <input type="text" value={value.registration_number} onChange={set('registration_number')} placeholder="例: 農林水産省登録第〇〇号"
          className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="使用回数上限 *">
          <input type="number" min={1} max={20} value={value.max_uses_per_season}
            onChange={(e) => onChange({ ...value, max_uses_per_season: Number(e.target.value) })}
            className={`${inputCls} text-center`} />
        </Field>
        <Field label="収穫前日数">
          <input type="number" min={0} value={value.pre_harvest_interval_days} onChange={set('pre_harvest_interval_days')} placeholder="日"
            className={`${inputCls} text-center`} />
        </Field>
      </div>
      <Field label="メモ">
        <textarea value={value.memo} onChange={set('memo')} rows={2} placeholder="希釈倍数、対象病害虫など"
          className={`${inputCls} resize-none`} />
      </Field>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={!value.name.trim()}
          className="flex-1 bg-emerald-600 disabled:bg-gray-200 text-white py-3 rounded-xl font-medium">
          {saveLabel}
        </button>
        <button onClick={onCancel} className="px-4 border border-gray-200 rounded-xl text-gray-500 text-sm">
          キャンセル
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function PesticideCard({ pesticide: p, onEdit, onDelete }: { pesticide: Pesticide; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{p.name}</p>
          <div className="flex gap-3 mt-1 text-xs text-gray-400">
            <span>上限: <span className="text-emerald-600 font-semibold">{p.max_uses_per_season}回</span></span>
            {p.pre_harvest_interval_days != null && <span>収穫前: {p.pre_harvest_interval_days}日</span>}
            {p.registration_number && <span className="truncate">{p.registration_number}</span>}
          </div>
          {p.memo && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.memo}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-emerald-600"><Pencil size={16} /></button>
          <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-400"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  )
}

function EditableRow({
  label, isEditing, editValue, onEditChange, onEditStart, onEditSave, onEditCancel, onDelete,
}: {
  label: string
  isEditing: boolean
  editValue: string
  onEditChange: (v: string) => void
  onEditStart: () => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}) {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input type="text" value={editValue} onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel() }}
          autoFocus
          className="flex-1 border border-emerald-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
        <button onClick={onEditSave} className="p-3 bg-emerald-600 text-white rounded-xl"><Check size={18} /></button>
        <button onClick={onEditCancel} className="p-3 border border-gray-200 rounded-xl text-gray-400"><X size={18} /></button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 flex items-center gap-2">
      <span className="flex-1 font-medium text-gray-800">{label}</span>
      <button onClick={onEditStart} className="p-2 text-gray-400 hover:text-emerald-600"><Pencil size={16} /></button>
      <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-400"><Trash2 size={16} /></button>
    </div>
  )
}
