'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { SEED_PESTICIDES } from '@/lib/seed-pesticides'
import type {
  Field, Season, Pesticide, SprayRecord, SprayRecordWithJoins,
  CreateFieldInput, CreateSeasonInput, CreatePesticideInput, CreateSprayRecordInput,
  ToastMessage, ToastType,
} from '@/types'

// ── localStorage キー ───────────────────────────────────────
const KEYS = {
  fields:        'kyuri:fields',
  seasons:       'kyuri:seasons',
  pesticides:    'kyuri:pesticides',
  sprayRecords:  'kyuri:spray_records',
  seeded:        'kyuri:seeded',
} as const

const LOCAL_USER = 'local'

// ── ユーティリティ ──────────────────────────────────────────
function genId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// SprayRecord + JOIN情報を結合して SprayRecordWithJoins を生成
function joinRecords(
  records: SprayRecord[],
  fields: Field[],
  seasons: Season[],
  pesticides: Pesticide[],
): SprayRecordWithJoins[] {
  return records
    .map((r) => {
      const field = fields.find((f) => f.id === r.field_id)
      const season = seasons.find((s) => s.id === r.season_id)
      const pesticide = pesticides.find((p) => p.id === r.pesticide_id)
      if (!field || !season || !pesticide) return null
      return {
        ...r,
        fields:     { id: field.id, name: field.name },
        seasons:    { id: season.id, name: season.name },
        pesticides: { id: pesticide.id, name: pesticide.name, max_uses_per_season: pesticide.max_uses_per_season },
      }
    })
    .filter(Boolean) as SprayRecordWithJoins[]
}

// ── Context 型 ──────────────────────────────────────────────
interface AppContextValue {
  fields: Field[]
  seasons: Season[]
  pesticides: Pesticide[]
  records: SprayRecord[]
  recordsWithJoins: SprayRecordWithJoins[]
  loading: boolean

  createField: (input: CreateFieldInput) => Promise<Field | null>
  updateField: (id: string, input: Partial<CreateFieldInput>) => Promise<void>
  deleteField: (id: string) => Promise<void>

  createSeason: (input: CreateSeasonInput) => Promise<Season | null>
  updateSeason: (id: string, input: Partial<CreateSeasonInput>) => Promise<void>
  deleteSeason: (id: string) => Promise<void>

  createPesticide: (input: CreatePesticideInput) => Promise<Pesticide | null>
  updatePesticide: (id: string, input: Partial<CreatePesticideInput>) => Promise<void>
  deletePesticide: (id: string) => Promise<void>

  createSprayRecord: (input: CreateSprayRecordInput) => Promise<SprayRecord | null>
  deleteSprayRecord: (id: string) => Promise<void>

  getRecentPesticides: () => Pesticide[]
  reload: () => Promise<void>

  toasts: ToastMessage[]
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [fields, setFields]       = useState<Field[]>([])
  const [seasons, setSeasons]     = useState<Season[]>([])
  const [pesticides, setPesticides] = useState<Pesticide[]>([])
  const [records, setRecords]     = useState<SprayRecord[]>([])
  const [recordsWithJoins, setRecordsWithJoins] = useState<SprayRecordWithJoins[]>([])
  const [loading, setLoading]     = useState(true)
  const [toasts, setToasts]       = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // localStorageから全データ読み込み
  const loadAll = useCallback(async () => {
    setLoading(true)

    // 初回のみ農薬マスターをシード登録
    const seeded = localStorage.getItem(KEYS.seeded)
    const savedPesticides = load<Pesticide>(KEYS.pesticides)
    if (!seeded && savedPesticides.length === 0) {
      const initial: Pesticide[] = SEED_PESTICIDES.map((p) => ({
        id: genId(),
        user_id: LOCAL_USER,
        name: p.name,
        registration_number: null,
        max_uses_per_season: p.max_uses_per_season,
        pre_harvest_interval_days: null,
        memo: p.memo,
        created_at: now(),
        updated_at: now(),
      }))
      save(KEYS.pesticides, initial)
      localStorage.setItem(KEYS.seeded, '1')
      setPesticides(initial)
    } else {
      setPesticides(savedPesticides)
    }

    const f = load<Field>(KEYS.fields)
    const s = load<Season>(KEYS.seasons)
    const r = load<SprayRecord>(KEYS.sprayRecords)
      .sort((a, b) => b.sprayed_at.localeCompare(a.sprayed_at))

    setFields(f)
    setSeasons(s)
    setRecords(r)

    const p = load<Pesticide>(KEYS.pesticides)
    setRecordsWithJoins(joinRecords(r, f, s, p))
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // 状態更新後に JOIN データも再生成するヘルパー
  const refresh = (
    f: Field[], s: Season[], p: Pesticide[], r: SprayRecord[]
  ) => {
    setFields(f); setSeasons(s); setPesticides(p); setRecords(r)
    setRecordsWithJoins(joinRecords(r, f, s, p))
  }

  // ── 圃場 CRUD ──────────────────────────────────────────────
  const createField = async (input: CreateFieldInput): Promise<Field | null> => {
    const item: Field = { id: genId(), user_id: LOCAL_USER, ...input, created_at: now(), updated_at: now() }
    const next = [...fields, item]
    save(KEYS.fields, next)
    refresh(next, seasons, pesticides, records)
    showToast(`「${item.name}」を登録しました`, 'success')
    return item
  }

  const updateField = async (id: string, input: Partial<CreateFieldInput>) => {
    const next = fields.map((f) => f.id === id ? { ...f, ...input, updated_at: now() } : f)
    save(KEYS.fields, next)
    refresh(next, seasons, pesticides, records)
    showToast('更新しました', 'success')
  }

  const deleteField = async (id: string) => {
    const next = fields.filter((f) => f.id !== id)
    save(KEYS.fields, next)
    refresh(next, seasons, pesticides, records)
    showToast('削除しました', 'success')
  }

  // ── 作期 CRUD ──────────────────────────────────────────────
  const createSeason = async (input: CreateSeasonInput): Promise<Season | null> => {
    const item: Season = { id: genId(), user_id: LOCAL_USER, ...input, created_at: now(), updated_at: now() }
    const next = [...seasons, item]
    save(KEYS.seasons, next)
    refresh(fields, next, pesticides, records)
    showToast(`「${item.name}」を登録しました`, 'success')
    return item
  }

  const updateSeason = async (id: string, input: Partial<CreateSeasonInput>) => {
    const next = seasons.map((s) => s.id === id ? { ...s, ...input, updated_at: now() } : s)
    save(KEYS.seasons, next)
    refresh(fields, next, pesticides, records)
    showToast('更新しました', 'success')
  }

  const deleteSeason = async (id: string) => {
    const next = seasons.filter((s) => s.id !== id)
    save(KEYS.seasons, next)
    refresh(fields, next, pesticides, records)
    showToast('削除しました', 'success')
  }

  // ── 農薬 CRUD ──────────────────────────────────────────────
  const createPesticide = async (input: CreatePesticideInput): Promise<Pesticide | null> => {
    const item: Pesticide = { id: genId(), user_id: LOCAL_USER, ...input, created_at: now(), updated_at: now() }
    const next = [...pesticides, item]
    save(KEYS.pesticides, next)
    refresh(fields, seasons, next, records)
    showToast(`「${item.name}」を登録しました`, 'success')
    return item
  }

  const updatePesticide = async (id: string, input: Partial<CreatePesticideInput>) => {
    const next = pesticides.map((p) => p.id === id ? { ...p, ...input, updated_at: now() } : p)
    save(KEYS.pesticides, next)
    refresh(fields, seasons, next, records)
    showToast('更新しました', 'success')
  }

  const deletePesticide = async (id: string) => {
    const next = pesticides.filter((p) => p.id !== id)
    save(KEYS.pesticides, next)
    refresh(fields, seasons, next, records)
    showToast('削除しました', 'success')
  }

  // ── 散布記録 ───────────────────────────────────────────────
  const createSprayRecord = async (input: CreateSprayRecordInput): Promise<SprayRecord | null> => {
    const item: SprayRecord = { id: genId(), user_id: LOCAL_USER, ...input, created_at: now(), updated_at: now() }
    const next = [item, ...records]
    save(KEYS.sprayRecords, next)
    refresh(fields, seasons, pesticides, next)
    return item
  }

  const deleteSprayRecord = async (id: string) => {
    const next = records.filter((r) => r.id !== id)
    save(KEYS.sprayRecords, next)
    refresh(fields, seasons, pesticides, next)
    showToast('削除しました', 'success')
  }

  // 直近7日で使用した農薬（記録画面ショートカット用）
  const getRecentPesticides = useCallback((): Pesticide[] => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const recentIds = [
      ...new Set(
        records
          .filter((r) => r.sprayed_at >= cutoffStr)
          .map((r) => r.pesticide_id)
      ),
    ].slice(0, 5)

    return recentIds
      .map((id) => pesticides.find((p) => p.id === id))
      .filter(Boolean) as Pesticide[]
  }, [records, pesticides])

  return (
    <AppContext.Provider value={{
      fields, seasons, pesticides, records, recordsWithJoins, loading,
      createField, updateField, deleteField,
      createSeason, updateSeason, deleteSeason,
      createPesticide, updatePesticide, deletePesticide,
      createSprayRecord, deleteSprayRecord,
      getRecentPesticides,
      reload: loadAll,
      toasts, showToast, dismissToast,
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onDismiss(t.id)}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-red-500 text-white' :
                                   'bg-gray-700 text-white'
          }`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
