/**
 * はっしーの農薬リスト（初回ログイン時にシードとして登録）
 * ()内の数字 = 作期内使用回数上限
 */
export const SEED_PESTICIDES = [
  // うどんこ病
  { name: 'スコア', memo: 'うどんこ病', max_uses_per_season: 3 },
  { name: 'プロパティ', memo: 'うどんこ病', max_uses_per_season: 3 },

  // うどんこ・灰色カビ・菌核・褐斑
  { name: 'ダイアメリット（ポリオキシン+ベルクート）', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 2 },
  { name: 'ファンタジスタ', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 3 },
  { name: 'ベルクートFL', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 7 },
  { name: 'アフェット', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 3 },
  { name: 'ファンベル（ファンタジスタ+ベルクート）', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 3 },
  { name: 'ショウチノスケ（ガッテン+フルピカ）', memo: 'うどんこ、灰色カビ、菌核、褐斑', max_uses_per_season: 2 },

  // 灰カビ・菌核・褐斑
  { name: 'セイビアー', memo: '灰カビ、菌核、褐斑', max_uses_per_season: 3 },
  { name: 'ジャストミート（セイビア+パスワード）', memo: '灰カビ、菌核、褐斑', max_uses_per_season: 3 },

  // 褐斑・うどんこ・カビ
  { name: 'フルピカ', memo: '褐斑、うどんこ、カビ', max_uses_per_season: 4 },

  // べと病
  { name: 'ランマン', memo: 'べと病', max_uses_per_season: 4 },
  { name: 'ライメイ', memo: 'べと病', max_uses_per_season: 4 },
  { name: 'ジャストフィット', memo: 'べと病', max_uses_per_season: 3 },
  { name: 'ベトファイター', memo: 'べと病', max_uses_per_season: 3 },
  { name: 'ザンプロ', memo: 'べと病', max_uses_per_season: 5 },

  // べと・褐斑
  { name: 'プロポーズ', memo: 'べと病、褐斑', max_uses_per_season: 3 },

  // アザミウマ・コナジラミ
  { name: 'アファーム', memo: 'アザミウマ、コナジラミ', max_uses_per_season: 2 },

  // アブラムシ・コナジラミ・アザミウマ
  { name: 'アクタラ', memo: 'アブラムシ、コナジラミ、アザミウマ', max_uses_per_season: 3 },
  { name: 'アドマイヤー', memo: 'アブラムシ、コナジラミ、アザミウマ', max_uses_per_season: 3 },
  { name: 'ベストガード', memo: 'アブラムシ、コナジラミ、アザミウマ', max_uses_per_season: 3 },
  { name: 'アルバリン', memo: 'アブラムシ、コナジラミ、アザミウマ', max_uses_per_season: 2 },
  { name: 'ダントツ', memo: 'アブラムシ、コナジラミ、アザミウマ', max_uses_per_season: 3 },

  // アザミウマ・ハダニ
  { name: 'コテツ', memo: 'アザミウマ、ハダニ', max_uses_per_season: 3 },

  // アブラムシ・コナジラミ
  { name: 'ウララ', memo: 'アブラムシ、コナジラミ', max_uses_per_season: 3 },

  // ハダニ
  { name: 'ダニサラバ', memo: 'ハダニ', max_uses_per_season: 2 },

  // アブラムシ
  { name: 'バリアード', memo: 'アブラムシ', max_uses_per_season: 3 },
] as const

export type SeedPesticide = {
  name: string
  memo: string
  max_uses_per_season: number
}
