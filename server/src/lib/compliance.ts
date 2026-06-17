/**
 * 中国广告法 / 医疗器械合规 文案净化器。
 *
 * Therabo 销售的是功能性「理疗服装/穿戴纺织品」，并非临床医疗器械，因此文案中不得
 * 出现「治愈/根治」等医疗功效用语，也不得出现「最佳/唯一/国家级/无任何副作用」等
 * 《广告法》绝对化用语。本模块把这些高风险词替换为合规的科技/健康表述
 * （促进微循环、辅助舒缓、佩戴体验更佳…），并用于：
 *   - 数据库内容净化脚本 (scripts/sanitize-db.ts)
 *   - 首次 seed 之后自动净化 (seed.ts)
 *
 * 字典按「长短语优先」排序，避免短词先替换破坏长短语。
 */

export const COMPLIANCE_REPLACEMENTS: Array<[RegExp, string]> = [
  // ── 医疗功效 / 疾病治疗类（最高风险）──
  [/全球唯一一款/g, '少见的一款'],
  [/全球唯一/g, '独特的'],
  [/根治/g, '辅助舒缓'],
  [/治愈/g, '辅助舒缓'],
  [/痊愈/g, '舒缓'],
  [/即刻起效/g, '佩戴即可感受'],
  [/秒润/g, '舒润'],
  [/消除高眼压不适/g, '舒缓眼周疲劳'],
  [/消除([^，。,.]{0,6})不适/g, '舒缓$1不适'],
  [/进入婴儿级深睡眠/g, '帮助放松、助您安睡'],
  [/婴儿级深睡眠/g, '安稳睡眠'],
  [/调节松果体褪黑素分泌/g, '帮助营造睡前放松状态'],
  [/无任何毒副作用/g, '无药物添加'],
  [/无任何副作用/g, '无药物添加'],
  [/毒副作用/g, '药物负担'],
  [/彻底摆脱外部药物/g, '无需依赖外部药物'],
  // ── 医疗器械 / 临床 / 三甲医院 类（理疗服装属纺织品，不得宣称医疗器械资质）──
  [/国家医疗器械[一二三]?类认证/g, '功能性纺织检测认证'],
  [/醫療器械[一二三]?類認證/g, '功能性紡織檢測認證'],
  [/医疗器械[一二三]类认证/g, '功能性纺织检测认证'],
  [/三甲医院/g, '专业机构'],
  [/三甲醫院/g, '專業機構'],
  [/临床合作验证/g, '检测合作'],
  [/臨床合作驗證/g, '檢測合作'],
  [/临床验证/g, '检测验证'],
  [/臨床驗證/g, '檢測驗證'],
  [/临床/g, '检测'],
  [/臨床/g, '檢測'],
  [/疗效/g, '使用效果'],
  [/療效/g, '使用效果'],
  [/持续起效/g, '持续作用'],
  [/持續起效/g, '持續作用'],
  [/起效/g, '作用'],
  [/消除/g, '舒缓'],
  [/永不/g, '不易'],
  // ── 《广告法》绝对化用语 ──
  [/效果最佳/g, '体验更佳'],
  [/最佳/g, '更佳'],
  [/全球顶峰/g, '高端之选'],
  [/顶级/g, '高品质'],
  [/顶尖/g, '出色'],
  [/国家级/g, '第三方'],
  [/彻底/g, '充分'],
  [/飙升/g, '提升'],
  // ── 繁体变体 ──
  [/全球唯一一款/g, '少見的一款'],
  [/根治/g, '輔助舒緩'],
  [/徹底/g, '充分'],
  [/最佳/g, '更佳'],
  [/頂級/g, '高品質'],
  [/國家級/g, '第三方'],
  [/飆升/g, '提升'],

  // ── English (Google E-E-A-T / health-claim safety) ──
  [/[Tt]he world['’]s only/g, 'a uniquely designed'],
  [/[Tt]he only sleep mask/g, 'A sleep mask'],
  [/resolves dry eyes,? ocular pressure (?:&|and) insomnia in one wear/gi,
    'helps soothe tired, dry eyes and supports pre-sleep relaxation'],
  [/therapeutic results/gi, 'a soothing experience'],
  [/relieves intraocular pressure/gi, 'helps ease eye-area fatigue'],
  [/modulates pineal-gland melatonin release/gi, 'supports a relaxed pre-sleep state'],
  [/ushers you into baby-deep sleep/gi, 'helps you wind down for restful sleep'],
  [/\bcures?\b/gi, 'soothes'],
  [/completely drug-free/gi, 'drug-free'],
  [/national-level/gi, 'third-party'],
  [/\bsurges? by\b/gi, 'rose by about']
];

/** Replace prohibited / absolute terms with compliant equivalents. Idempotent. */
export function sanitizeText(input: string): string {
  if (!input) return input;
  let out = input;
  for (const [re, to] of COMPLIANCE_REPLACEMENTS) out = out.replace(re, to);
  return out;
}

/** Sanitize every string value inside a (possibly nested) JSON value. */
export function sanitizeJson<T>(value: T): T {
  if (typeof value === 'string') return sanitizeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeJson(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) o[k] = sanitizeJson(v);
    return o as T;
  }
  return value;
}
