'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SEED_PESTICIDES } from '@/lib/seed-pesticides'
import type {
  Field, Season, Pesticide, SprayRecord, SprayRecordWithJoins,
  CreateFieldInput, CreateSeasonInput, CreatePesticideInput, CreateSprayRecordInput,
  ToastMessage, ToastType,
} from '@/types'

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

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

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

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [fieldsRes, seasonsRes, pesticidesRes, recordsRes, recordsJoinRes] = await Promise.all([
      supabase.from('fields').select('*').order('created_at'),
      supabase.from('seasons').select('*').order('created_at'),
      supabase.from('pesticides').select('*').order('created_at'),
      supabase.from('spray_records').select('*').order('sprayed_at', { ascending: false }),
      supabase
        .from('spray_records')
        .select('*, fields(id, name), seasons(id, name), pesticides(id, name, max_uses_per_season)')
        .order('sprayed_at', { ascending: false }),
    ])
    if (fieldsRes.data)       setFields(fieldsRes.data)
    if (seasonsRes.data)      setSeasons(seasonsRes.data)
    if (pesticidesRes.data)   setPesticides(pesticidesRes.data)
    if (recordsRes.data)      setRecords(recordsRes.data)
    if (recordsJoinRes.data)  setRecordsWithJoins(recordsJoinRes.data as SprayRecordWithJoins[])
    setLoading(false)
  }, [])

  // 初回ログイン後、農薬マスターが空なら28種をシード登録
  const seedPesticidesIfEmpty = useCallback(async () => {
    const { count } = await supabase
      .from('pesticides')
      .select('*', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('pesticides').insert(
        SEED_PESTICIDES.map((p) => ({
          name: p.name,
          memo: p.memo,
          max_uses_per_season: p.max_uses_per_season,
          registration_number: null,
          pre_harvest_interval_days: null,
        }))
      )
    }
  }, [])

  useEffect(() => {
    loadAll().then(seedPesticidesIfEmpty).then(loadAll)
  }, [loadAll, seedPesticidesIfEmpty])

  // 圃場
  const createField = async (input: CreateFieldInput): Promise<Field | null> => {
    const { data, error } = await supabase.from('fields').insert(input).select().single()
    if (error) { showToast('圃場の登録に失敗しました', 'error'); return null }
    setFields((prev) => [...prev, data])
    showToast(`「${data.name}」を登録しました`, 'success')
    return data
  }
  const updateField = async (id: string, input: Partial<CreateFieldInput>) => {
    const { error } = await supabase.from('fields').update(input).eq('id', id)
    if (error) { showToast('更新に失敗しました', 'error'); return }
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...input } : f))
    showToast('更新しました', 'success')
  }
  const deleteField = async (id: string) => {
    const { error } = await supabase.from('fields').delete().eq('id', id)
    if (error) { showToast('削除に失敗しました', 'error'); return }
    setFields((prev) => prev.filter((f) => f.id !== id))
    showToast('削除しました', 'success')
  }

  // 作期
  const createSeason = async (input: CreateSeasonInput): Promise<Season | null> => {
    const { data, error } = await supabase.from('seasons').insert(input).select().single()
    if (error) { showToast('作期の登録に失敗しました', 'error'); return null }
    setSeasons((prev) => [...prev, data])
    showToast(`「${data.name}」を登録しました`, 'success')
    return data
  }
  const updateSeason = async (id: string, input: Partial<CreateSeasonInput>) => {
    const { error } = await supabase.from('seasons').update(input).eq('id', id)
    if (error) { showToast('更新に失敗しました', 'error'); return }
    setSeasons((prev) => prev.map((s) => s.id === id ? { ...s, ...input } : s))
    showToast('更新しました', 'success')
  }
  const deleteSeason = async (id: string) => {
    const { error } = await supabase.from('seasons').delete().eq('id', id)
    if (error) { showToast('削除に失敗しました', 'error'); return }
    setSeasons((prev) => prev.filter((s) => s.id !== id))
    showToast('削除しました', 'success')
  }

  // 農薬
  const createPesticide = async (input: CreatePesticideInput): Promise<Pesticide | null> => {
    const { data, error } = await supabase.from('pesticides').insert(input).select().single()
    if (error) { showToast('農薬の登録に失敗しました', 'error'); return null }
    setPesticides((prev) => [...prev, data])
    showToast(`「${data.name}」を登録しました`, 'success')
    return data
  }
  const updatePesticide = async (id: string, input: Partial<CreatePesticideInput>) => {
    const { error } = await supabase.from('pesticides').update(input).eq('id', id)
    if (error) { showToast('更新に失敗しました', 'error'); return }
    setPesticides((prev) => prev.map((p) => p.id === id ? { ...p, ...input } : p))
    showToast('更新しました', 'success')
  }
  const deletePesticide = async (id: string) => {
    const { error } = await supabase.from('pesticides').delete().eq('id', id)
    if (error) { showToast('削除に失敗しました', 'error'); return }
    setPesticides((prev) => prev.filter((p) => p.id !== id))
    showToast('削除しました', 'success')
  }

  // 散布記録
  const createSprayRecord = async (input: CreateSprayRecordInput): Promise<SprayRecord | null> => {
    const { data, error } = await supabase.from('spray_records').insert(input).select().single()
    if (error) { showToast('記録の保存に失敗しました', 'error'); return null }
    await loadAll()
    return data
  }
  const deleteSprayRecord = async (id: string) => {
    const { error } = await supabase.from('spray_records').delete().eq('id', id)
    if (error) { showToast('削除に失敗しました', 'error'); return }
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setRecordsWithJoins((prev) => prev.filter((r) => r.id !== id))
    showToast('削除しました', 'success')
  }

  const getRecentPesticides = useCallback((): Pesticide[] => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const recentIds = [
      ...new Set(records.filter((r) => r.sprayed_at >= cutoffStr).map((r) => r.pesticide_id)),
    ].slice(0, 5)
    return recentIds.map((id) => pesticides.find((p) => p.id === id)).filter(Boolean) as Pesticide[]
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
