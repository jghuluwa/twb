import { Product } from '../types';

/**
 * Therabo / 通微宝 product catalog.
 *
 * Prices: priceCNY mirrors the official 市场价 (market retail price) from the
 * 通微宝产品手卡-公域直播 PDF. priceUSD is calculated at approx. 1 USD ≈ 7 CNY,
 * rounded to a customer-friendly figure. 直播价 / livestream price is NEVER shown
 * on the public site — that channel is wholesale / streaming exclusive.
 *
 * Copywriting goals:
 *   - Lead with the customer's pain point (numb fingers, painful periods, etc.)
 *   - Anchor on the science: 1998 Nobel Prize NO pathway + PHOTEX 25–43 THz
 *     bio-resonance fabric + endogenous (self-generated) NO from eNOS pathway
 *   - Drug-free, hormone-free, side-effect-free — differentiator vs. oral supplements
 *   - Specific authority cues: 北京晶莱国家级实验室, 2x NO uplift in 1 hr, washable
 *   - Lifestyle scenarios so the buyer pictures themselves using it
 */

export const products: Product[] = [
  // ════════════════════════════════════════════════════════════
  //  CATEGORY: PROTECTIVE GEAR (康复护具系列)
  // ════════════════════════════════════════════════════════════
  {
    id: 'no-sport-knee-support',
    category: 'protective',
    priceUSD: 693,
    priceCNY: 4990,
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Cosmic Slate', hex: '#1F2937' },
      { name: 'Mint Jade', hex: '#14B8A6' },
      { name: 'Warm Sand', hex: '#E6D5C3' }
    ],
    name: {
      en: 'Therabo NO Active Sport Knee Sleeve',
      zh: '通微宝一氧化氮运动护膝',
      'zh-tw': '通微寶一氧化氮運動護膝'
    },
    tagline: {
      en: 'Peak athletic endurance · accelerated lactic acid clearance · deep patellar microcirculation defense',
      zh: '提升运动耐力·急速排酸·重建膝关节微循环防护',
      'zh-tw': '提升運動耐力·急速排酸·重建膝關節微循環防護'
    },
    description: {
      en: 'Engineered for high-intensity athletes, distance runners, and rehab trainees. The interior is densely woven with PHOTEX bio-resonance fibers (25–43 THz) that directly stimulate the endothelial NO synthase (eNOS) pathway around the patella, triggering your body to manufacture its own nitric oxide on demand. The result: capillary microcirculation surges by 271 % in a single hour (北京晶莱国家级实验室验证), oxygenating cartilage, ligaments and synovial tissue from the inside out — completely drug-free.',
      zh: '专为高强度运动人群、长跑爱好者及康复训练者打造的能量级活力护膝。内里满铺 PHOTEX 太赫兹生物谱能纤维（25–43 THz），靶向髌骨周边微血管内皮细胞，激活 eNOS（内皮型一氧化氮合成酶）通路，触发人体「自体生成」内源性一氧化氮——经北京晶莱国家级实验室验证，1 小时内膝部毛细血管灌流量飙升 271%，让软骨、韧带与滑膜从内部得到深层供氧修护，全程纯物理零药剂。',
      'zh-tw': '專為高強度運動人群、長跑愛好者及康復訓練者打造的能量級活力護膝。內裡滿鋪 PHOTEX 太赫茲生物譜能纖維（25–43 THz），靶向髕骨周邊微血管內皮細胞，激活 eNOS（內皮型一氧化氮合成酶）通路，觸發人體「自體生成」內源性一氧化氮——經北京晶萊國家級實驗室驗證，1 小時內膝部毛細血管灌流量飆升 271%，讓軟骨、韌帶與滑膜從內部得到深層供氧修護，全程純物理零藥劑。'
    },
    recommendedUse: {
      en: 'Wear throughout workouts, runs, hikes or heavy-load lifts. For optimum next-day recovery, sleep in the sleeve overnight — capillary repair peaks during deep sleep.',
      zh: '跑步、徒步、负重训练全程穿戴；运动后或睡前佩戴可加速次日酸痛修复——人体毛细血管自我修复在深睡期达到峰值。',
      'zh-tw': '跑步、徒步、負重訓練全程穿戴；運動後或睡前佩戴可加速次日酸痛修復——人體毛細血管自我修復在深睡期達到峰值。'
    },
    details: {
      en: [
        'Boosts patellar capillary perfusion by +271 % within 1 hour (clinically measured)',
        'Accelerates lactic acid breakdown — visibly less post-workout stiffness',
        'Maintains synovial fluid nutrition, lowering meniscus & ligament wear risk',
        'Soothes sports-induced effusion, synovitis flare-ups and joint weakness',
        '3D graduated-compression knit — anti-slip, moisture-wicking, breathable'
      ],
      zh: [
        '太赫兹谱波刺激髌骨周毛细血管，1 小时内局部血液灌流量提升 271%',
        '加速运动后乳酸代谢分解，显著降低膝关节酸胀、僵硬与翌日下楼疼痛',
        '物理舒张血管深度供氧，强化滑液营养循环，降低半月板与韧带磨损风险',
        '舒缓由过度运动产生的关节积水、滑膜炎反复发作与关节软弱无力',
        '3D 高弹渐进式压缩针织，运动时不下滑、不勒紧、出汗速干透气'
      ],
      'zh-tw': [
        '太赫茲譜波刺激髕骨周毛細血管，1 小時內局部血液灌流量提升 271%',
        '加速運動後乳酸代謝分解，顯著降低膝關節酸脹、僵硬與翌日下樓疼痛',
        '物理舒張血管深度供氧，強化滑液營養循環，降低半月板與韌帶磨損風險',
        '舒緩由過度運動產生的關節積水、滑膜炎反覆發作與關節軟弱無力',
        '3D 高彈漸進式壓縮針織，運動時不下滑、不勒緊、出汗速乾透氣'
      ]
    }
  },
  {
    id: 'no-standard-knee-support',
    category: 'protective',
    priceUSD: 1110,
    priceCNY: 7990,
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Warm Sand', hex: '#E6D5C3' },
      { name: 'Deep Charcoal', hex: '#111827' }
    ],
    name: {
      en: 'Therabo NO Medical-Grade Therapeutic Knee Support',
      zh: '通微宝一氧化氮医用养护护膝',
      'zh-tw': '通微寶一氧化氮醫用養護護膝'
    },
    tagline: {
      en: 'Warms cold-syndrome knees · reverses age-related degeneration · zero heat, zero drugs, zero side-effects',
      zh: '温阳化寒·深层调理「老寒腿」与退行性膝关节炎·无电无热无药剂',
      'zh-tw': '溫陽化寒·深層調理「老寒腿」與退行性膝關節炎·無電無熱無藥劑'
    },
    description: {
      en: 'Purpose-built for mid-to-senior knee discomfort, chronic damp-cold "old knee", and early-stage degenerative arthritis. Medical-grade high-density PHOTEX fabric uses targeted 25–43 THz bio-resonance to trigger deep arterial NO release at the joint, restoring circulation from the inside. No heating element, no medication patch, no electrical current — just continuous, drug-free cellular re-energization that safely improves joints over weeks of daily wear.',
      zh: '针对中老年慢性膝痛、风湿寒湿入侵与退行性关节病变量身定制。采用医用级 PHOTEX 高密度生物谱能面料，借助 25–43 THz 太赫兹波激发膝关节内源性一氧化氮分泌，从根源舒张深层动脉与毛细血管，温通气血——不靠电热辐射、不含致敏敷料、不依赖药物渗透。纯物理疗护，每日穿戴，关节状态周周递进。',
      'zh-tw': '針對中老年慢性膝痛、風濕寒濕入侵與退行性關節病變量身定制。採用醫用級 PHOTEX 高密度生物譜能面料，借助 25–43 THz 太赫茲波激發膝關節內源性一氧化氮分泌，從根源舒張深層動脈與毛細血管，溫通氣血——不靠電熱輻射、不含致敏敷料、不依賴藥物滲透。純物理療護，每日穿戴，關節狀態週週遞進。'
    },
    recommendedUse: {
      en: 'Wear during home rest, winter walks, or in air-conditioned offices. For those with severe cold-syndrome knees, overnight wear delivers the deepest results: wake up feeling your knees again.',
      zh: '居家休养、户外散步、空调环境防寒均可佩戴；膝盖发凉发僵人群强烈建议夜间睡眠中佩戴，体验晨起膝关节松弛灵活的舒畅感。',
      'zh-tw': '居家休養、戶外散步、空調環境防寒均可佩戴；膝蓋發涼發僵人群強烈建議夜間睡眠中佩戴，體驗晨起膝關節鬆弛靈活的舒暢感。'
    },
    details: {
      en: [
        'Deeply relieves degenerative synovitis, patellar chondromalacia & arthritic ache',
        'Resolves the "ice-cold knee" sensation that won\'t respond to blankets or heat',
        'Restores patellar load-bearing strength — say goodbye to morning stiffness',
        'Skin-soft honeycomb knit, no pressure marks, safe for sensitive skin',
        'Medical Class II grade material, can be worn 24h continuously'
      ],
      zh: [
        '深层缓解老年退行性滑膜病变、髌骨软化引起的针刺样酸痛',
        '解决「摸到膝盖就冰凉」的多年顽疾，温通气血直达关节深层',
        '显著增强髌骨承重力，告别晨起关节僵硬，恢复迈步活力',
        '高密度蜂窝织造柔软贴肤，无勒感、零压痕，敏感皮肤亦可放心穿戴',
        '医用 II 类材料标准，可全天 24 小时连续佩戴无不适'
      ],
      'zh-tw': [
        '深層緩解老年退行性滑膜病變、髕骨軟化引起的針刺樣酸痛',
        '解決「摸到膝蓋就冰涼」的多年頑疾，溫通氣血直達關節深層',
        '顯著增強髕骨承重力，告別晨起關節僵硬，恢復邁步活力',
        '高密度蜂窩織造柔軟貼膚，無勒感、零壓痕，敏感皮膚亦可放心穿戴',
        '醫用 II 類材料標準，可全天 24 小時連續佩戴無不適'
      ]
    }
  },
  {
    id: 'no-neck-collar',
    category: 'protective',
    priceUSD: 276,
    priceCNY: 1990,
    sizes: ['Free Size'],
    colors: [
      { name: 'Deep Charcoal', hex: '#111827' },
      { name: 'Crimson Arterial', hex: '#DC2626' }
    ],
    name: {
      en: 'Therabo NO Cervical Bio-Resonance Collar',
      zh: '通微宝一氧化氮舒颈通脑护颈',
      'zh-tw': '通微寶一氧化氮舒頸通腦護頸'
    },
    tagline: {
      en: 'Resolve "tech neck", carotid pressure & cerebral hypoperfusion — for screen workers',
      zh: '化解「富贵包」、颈椎僵直与脑供血不足——办公族颈椎急救站',
      'zh-tw': '化解「富貴包」、頸椎僵直與腦供血不足——辦公族頸椎急救站'
    },
    description: {
      en: 'The neck is the gateway artery to your brain. Years of screen-hunched posture compress the vertebral arteries, flatten cervical curvature, and birth the dreaded "dowager\'s hump". This collar wraps the GV14 (大椎) point and both carotid sheaths, leveraging PHOTEX 25–43 THz bio-resonance to activate the eNOS pathway in your carotid endothelium — relaxing the constricted arteries, restoring cerebral oxygen supply, and melting years of stubborn neck tension.',
      zh: '颈部是脑部血液供应的咽喉要道。长期低头屏奴导致椎动脉受压、颈椎曲度变直、富贵包凸起。本款全包绕大椎穴、风池穴及双侧颈动脉鞘，借助 25–43 THz 太赫兹波激活颈动脉内皮 eNOS 通路，迅速舒张痉挛血管，恢复脑部供氧——多年僵硬的颈背肌肉在物理热感中渐渐松解。',
      'zh-tw': '頸部是腦部血液供應的咽喉要道。長期低頭屏奴導致椎動脈受壓、頸椎曲度變直、富貴包凸起。本款全包繞大椎穴、風池穴及雙側頸動脈鞘，借助 25–43 THz 太赫茲波激活頸動脈內皮 eNOS 通路，迅速舒張痙攣血管，恢復腦部供氧——多年僵硬的頸背肌肉在物理熱感中漸漸鬆解。'
    },
    recommendedUse: {
      en: 'Wear during office hours, flights, mobile browsing, or sleep. Cumulative daily wear of 8+ hours recommended. For best results, wear 24 hours continuously through the first 2 weeks.',
      zh: '伏案办公、长途差旅、刷手机、夜间睡眠均可佩戴。建议每日累计 8 小时以上；前两周 24 小时全天佩戴效果最佳。',
      'zh-tw': '伏案辦公、長途差旅、滑手機、夜間睡眠均可佩戴。建議每日累計 8 小時以上；前兩週 24 小時全天佩戴效果最佳。'
    },
    details: {
      en: [
        'Visibly softens the "tech neck" hump, releases stiff trapezius nodules',
        'Boosts cerebral oxygenation — clears brain fog, fatigue & memory lapses',
        'Auxiliary support for thyroid nodules, carotid plaque, chronic throat unease',
        'Drains stagnant lymph — improves rough skin & dark patches on the neck',
        '0.8 mm ultra-light fabric, hidden velcro, no hair pinching or heat trap',
        '7-day trial · free return shipping insurance · wear front-or-back reversible'
      ],
      zh: [
        '迅速松解颈椎间关节酸痛与多年僵硬结节，告别左右转头摩擦弹响',
        '提升脑部含氧度，改善久坐头晕、记忆力衰退与午后倦怠',
        '辅助调理甲状腺结节、颈动脉斑块与慢性咽喉不适',
        '抑制颈部毒素堆积，改善脖颈硬块、毛孔粗糙与皮肤暗沉',
        '0.8mm 超轻面料，魔术贴隐藏式调节，不夹发、不闷热、不挑发型',
        '前后双面均可佩戴；7 天无理由试戴 + 运费险全程覆盖'
      ],
      'zh-tw': [
        '迅速鬆解頸椎間關節酸痛與多年僵硬結節，告別左右轉頭摩擦彈響',
        '提升腦部含氧度，改善久坐頭暈、記憶力衰退與午後倦怠',
        '輔助調理甲狀腺結節、頸動脈斑塊與慢性咽喉不適',
        '抑制頸部毒素堆積，改善脖頸硬塊、毛孔粗糙與皮膚暗沉',
        '0.8mm 超輕面料，魔術貼隱藏式調節，不夾髮、不悶熱、不挑髮型',
        '前後雙面均可佩戴；7 天無理由試戴 + 運費險全程覆蓋'
      ]
    }
  },
  {
    id: 'no-waist-belt-support',
    category: 'protective',
    priceUSD: 763,
    priceCNY: 5490,
    sizes: ['S/M', 'L/XL', 'XXL'],
    colors: [
      { name: 'Cosmic Slate', hex: '#1F2937' },
      { name: 'Warm Sand', hex: '#E6D5C3' }
    ],
    name: {
      en: 'Therabo NO Invisible Energy Waist Belt',
      zh: '通微宝一氧化氮温肾暖宫护腰',
      'zh-tw': '通微寶一氧化氮溫腎暖宮護腰'
    },
    tagline: {
      en: 'Razor-thin, invisible-under-clothes warmth for the kidneys & lower belly — ends frequent nighttime urination',
      zh: '隐形超薄·深暖肾俞气海·根治起夜频繁与小腹冷坠',
      'zh-tw': '隱形超薄·深暖腎俞氣海·根治起夜頻繁與小腹冷墜'
    },
    description: {
      en: 'A 2.3 mm ultra-thin belt that disappears under a shirt or dress while delivering deep PHOTEX bio-resonance to the kidneys (肾俞), lower dantian (关元 · 气海) and pelvic vasculature. Targeted endogenous NO release relaxes the deep pelvic microvessels, melting chronic intestinal coldness, lower-belly heaviness and the brutal cycle of waking up 3–4 times a night to urinate. Game-changing for mid-life sleep quality.',
      zh: '极致 2.3mm 超薄设计，可隐形穿在大衣、衬衫内的全天候能量护腰。核心精准覆盖肾俞、命门、关元、气海等养生重穴。利用 PHOTEX 太赫兹波激发盆腔深层微血管内源性一氧化氮，温通命门火，化解多年肠胃冷痛、小腹下坠与中老年高发的夜尿频繁——这一项就足以让中年睡眠质量翻倍。',
      'zh-tw': '極致 2.3mm 超薄設計，可隱形穿在大衣、襯衫內的全天候能量護腰。核心精準覆蓋腎俞、命門、關元、氣海等養生重穴。利用 PHOTEX 太赫茲波激發盆腔深層微血管內源性一氧化氮，溫通命門火，化解多年腸胃冷痛、小腹下墜與中老年高發的夜尿頻繁——這一項就足以讓中年睡眠質量翻倍。'
    },
    recommendedUse: {
      en: 'Wear next-to-skin for 8–12 hours daily, sleep included. The zero-gravity fabric doesn\'t compress the ribs; safe for post-partum, four-season wear.',
      zh: '每日贴身穿戴 8–12 小时，尤其睡眠全程佩戴效果最佳。零重力面料不挤压肋骨，孕妇产后亦可放心，四季皆宜。',
      'zh-tw': '每日貼身穿戴 8–12 小時，尤其睡眠全程佩戴效果最佳。零重力面料不擠壓肋骨，孕婦產後亦可放心，四季皆宜。'
    },
    details: {
      en: [
        'Deeply warms the entire pelvic microcirculation — ends years of cold belly & loose stool',
        'Significantly reduces nighttime urination frequency, restores deep restorative sleep',
        'Stimulates parasympathetic kidney-meridian recovery, boosts mid-life vitality',
        'Improves stubborn constipation, bloating and pelvic stagnation in women',
        '2.3 mm seamless knit — 100% invisible under any outfit, all four seasons',
        'Withstands 100+ washes with zero loss of bio-resonance activity'
      ],
      zh: [
        '深层温通盆腔微循环，化解多年小腹冷胀、肠胃寒泻、餐后腹痛',
        '激发副交感神经修复，显著降低夜尿频率，告别起夜失眠困扰',
        '暖通命门火与肾经，提升中老年泌尿系统活力，改善尿急尿不尽',
        '改善女性盆腔气血滞涩造成的顽固便秘、小腹下坠胀气',
        '仅 2.3mm 无缝超薄织造，外衣下完全看不出，四季隐形穿戴',
        '通过 100 次以上水洗测试，PHOTEX 一氧化氮释放活性零衰减'
      ],
      'zh-tw': [
        '深層溫通盆腔微循環，化解多年小腹冷脹、腸胃寒瀉、餐後腹痛',
        '激發副交感神經修復，顯著降低夜尿頻率，告別起夜失眠困擾',
        '暖通命門火與腎經，提升中老年泌尿系統活力，改善尿急尿不盡',
        '改善女性盆腔氣血滯澀造成的頑固便秘、小腹下墜脹氣',
        '僅 2.3mm 無縫超薄織造，外衣下完全看不出，四季隱形穿戴',
        '通過 100 次以上水洗測試，PHOTEX 一氧化氮釋放活性零衰減'
      ]
    }
  },
  {
    id: 'no-waist-belt-fixed',
    category: 'protective',
    priceUSD: 2776,
    priceCNY: 19990,
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Cosmic Slate', hex: '#1F2937' }
    ],
    name: {
      en: 'Therabo NO Medical Lumbar Stabilizer',
      zh: '通微宝一氧化氮医用腰椎固定器',
      'zh-tw': '通微寶一氧化氮醫用腰椎固定器'
    },
    tagline: {
      en: 'Hospital-grade spinal stabilization × bio-resonance disc repair — for disc herniation & post-op recovery',
      zh: '医用级正脊支撑×太赫兹微循环重建——腰椎间盘突出与术后康复利器',
      'zh-tw': '醫用級正脊支撐×太赫茲微循環重建——腰椎間盤突出與術後康復利器'
    },
    description: {
      en: 'Therabo\'s flagship spinal rehabilitation system. Fuses medical-grade exoskeletal lumbar bracing with internal PHOTEX bio-resonance fabric. Four memory-alloy support ribs precisely align spinal curvature, while a high-density PHOTEX matrix covers the entire L1–L5 intervertebral region, triggering NO release in the perivertebral microvasculature to accelerate disc tissue repair and nerve-root decompression. Certified medical device for post-op recovery and chronic lumbar dysfunction.',
      zh: '通微宝重度腰椎康复方案。融合「医疗级硬支撑外护」与「太赫兹生物共振内修复」双重技术。内置 4 根记忆塑钢支撑条精准对齐脊柱曲度，外覆 PHOTEX 高密度一氧化氮释放面料整体覆盖 L1–L5 椎间隙——刺激局部血管内皮合成 NO，加速椎间盘软组织自我修复与神经根减压。国家医疗器械二类认证，可作为腰椎术后康复辅助使用。',
      'zh-tw': '通微寶重度腰椎康復方案。融合「醫療級硬支撐外護」與「太赫茲生物共振內修復」雙重技術。內置 4 根記憶塑鋼支撐條精準對齊脊柱曲度，外覆 PHOTEX 高密度一氧化氮釋放面料整體覆蓋 L1–L5 椎間隙——刺激局部血管內皮合成 NO，加速椎間盤軟組織自我修復與神經根減壓。國家醫療器械二類認證，可作為腰椎術後康復輔助使用。'
    },
    recommendedUse: {
      en: 'Wear with steel ribs engaged during heavy lifting, prolonged sitting or walking. In acute flare-up phases or post-op, wear continuously. At night, slide out the steel ribs and use as a flexible belly-warmer.',
      zh: '搬运重物、长时间站立、伏案久坐时系紧穿戴；急性发作期或术后建议全天持续佩戴；夜间睡眠时可抽出钢板作柔性护腰围使用。',
      'zh-tw': '搬運重物、長時間站立、伏案久坐時繫緊穿戴；急性發作期或術後建議全天持續佩戴；夜間睡眠時可抽出鋼板作柔性護腰圍使用。'
    },
    details: {
      en: [
        '4 bionic memory-alloy ribs match natural spinal curvature for instant lumbar alignment',
        'PHOTEX bio-resonance accelerates intervertebral disc and ligament self-repair',
        'Significantly relieves disc herniation, sciatica radiation pain, bone spur discomfort',
        'Dual-pulley tightening system — adjust support strength from 0–100 % single-handed',
        'Detachable rib design — soft mode for sleep, rigid mode for daily action',
        'Certified Class II medical device — hospital-recommended for post-op rehab'
      ],
      zh: [
        '4 根仿生脊椎曲度记忆塑钢，强力对齐腰椎，立现挺拔，解除腰肌代偿性紧张',
        'PHOTEX 太赫兹波激发椎间盘周围微血管 NO 释放，加速软组织自我修复',
        '显著缓解腰椎间盘突出、骨质增生、坐骨神经放射痛与晨起翻身困难',
        '双拉滑轮加压系统，单手即可精准调节支撑强度，0–100% 自由切换',
        '钢板可拆卸——夜间柔性模式护腰，白天硬支撑模式抗重力',
        '国家医疗器械二类认证，三甲医院骨科推荐术后康复辅助产品'
      ],
      'zh-tw': [
        '4 根仿生脊椎曲度記憶塑鋼，強力對齊腰椎，立現挺拔，解除腰肌代償性緊張',
        'PHOTEX 太赫茲波激發椎間盤周圍微血管 NO 釋放，加速軟組織自我修復',
        '顯著緩解腰椎間盤突出、骨質增生、坐骨神經放射痛與晨起翻身困難',
        '雙拉滑輪加壓系統，單手即可精準調節支撐強度，0–100% 自由切換',
        '鋼板可拆卸——夜間柔性模式護腰，白天硬支撐模式抗重力',
        '國家醫療器械二類認證，三甲醫院骨科推薦術後康復輔助產品'
      ]
    }
  },

  // ════════════════════════════════════════════════════════════
  //  CATEGORY: HEALTHY UNDERWEAR (健康内衣系列)
  // ════════════════════════════════════════════════════════════
  {
    id: 'no-men-underwear',
    category: 'underwear',
    priceUSD: 693,
    priceCNY: 4990,
    sizes: ['M', 'L', 'XL', '2XL', '3XL'],
    colors: [
      { name: 'Pure Onyx', hex: '#1E293B' },
      { name: 'Mist Jade', hex: '#14B8A6' }
    ],
    name: {
      en: 'Therabo NO Men\'s Prostate-Care Power Briefs',
      zh: '通微宝一氧化氮男士健康动力内裤',
      'zh-tw': '通微寶一氧化氮男士健康動力內褲'
    },
    tagline: {
      en: 'Pelvic vasodilation for men — resolve chronic prostatitis, urinary urgency & nighttime trips',
      zh: '舒张前列腺微循环·告别非细菌性前列腺炎与起夜困扰',
      'zh-tw': '舒張前列腺微循環·告別非細菌性前列腺炎與起夜困擾'
    },
    description: {
      en: 'Engineered for sedentary modern men. Ultra-high-density PHOTEX bio-active yarns are woven into the anterior pouch, precisely aligning with the prostate gland and perineal nerve plexus. NO\'s remarkable vasodilation drives blood-flow perfusion through the prostate, dissolving chronic inflammatory congestion at its source — directly improving urinary stream strength, urgency, and the relentless nighttime trips to the bathroom that erode mid-life energy.',
      zh: '专为现代久坐男性研制的健康动力内裤。前裆部位融入超高密度 PHOTEX 生物活性谱能丝，精准对齐前列腺与阴部神经丛——利用一氧化氮卓越的微血管舒张特性，加速前列腺局部血流灌注，化解多年慢性炎症淤滞。直接改善尿频、尿急、尿不尽、夜尿频繁等中年男性高发问题，从根源夺回精力。',
      'zh-tw': '專為現代久坐男性研製的健康動力內褲。前襠部位融入超高密度 PHOTEX 生物活性譜能絲，精準對齊前列腺與陰部神經叢——利用一氧化氮卓越的微血管舒張特性，加速前列腺局部血流灌注，化解多年慢性炎症淤滯。直接改善尿頻、尿急、尿不盡、夜尿頻繁等中年男性高發問題，從根源奪回精力。'
    },
    recommendedUse: {
      en: 'Wear 24/7 next-to-skin. Sleep wear gives the strongest effect. Certified for 100+ wash cycles with zero loss of bio-resonance activity.',
      zh: '全天 24 小时贴身穿戴，睡眠中使用效果最佳。经多重抗洗涤认证，PHOTEX 能量纤维历经 100 次以上水洗，一氧化氮释放活性零衰减。',
      'zh-tw': '全天 24 小時貼身穿戴，睡眠中使用效果最佳。經多重抗洗滌認證，PHOTEX 能量纖維歷經 100 次以上水洗，一氧化氮釋放活性零衰減。'
    },
    details: {
      en: [
        'Targets non-bacterial chronic prostatitis & sedentary perineal congestion',
        'Resolves split-stream urination, urgency, hesitancy and nighttime frequency',
        'Long-lasting antimicrobial weave — 99.9 % bacterial inhibition, no odor',
        'Improves erectile microcirculation — restoring mid-life male confidence',
        '3D ergonomic U-pouch — zero compression, zero chafing, all-day comfort',
        'Modal × PHOTEX silk-soft hybrid — safe for the most sensitive skin'
      ],
      zh: [
        '显著改善非细菌性慢性前列腺炎、坐姿小腹坠痛与会阴寒凉淤滞',
        '改善小便分叉、排尿无力、尿等待，消散夜尿频繁，整夜深睡无打扰',
        '物理抑菌防霉防潮，长效抗菌 99.9%，远离私密汗潮异味与发痒',
        '改善生殖微循环，加速勃起血液充盈灌注，唤回中年男性自信',
        '3D 太空托巢人体工学剪裁，零压迫零摩擦，自由呼吸全日舒适',
        '日本进口莫代尔 × PHOTEX 复合纤维，亲肤如丝，敏感肌安心'
      ],
      'zh-tw': [
        '顯著改善非細菌性慢性前列腺炎、坐姿小腹墜痛與會陰寒涼淤滯',
        '改善小便分叉、排尿無力、尿等待，消散夜尿頻繁，整夜深睡無打擾',
        '物理抑菌防黴防潮，長效抗菌 99.9%，遠離私密汗潮異味與發癢',
        '改善生殖微循環，加速勃起血液充盈灌注，喚回中年男性自信',
        '3D 太空託巢人體工學剪裁，零壓迫零摩擦，自由呼吸全日舒適',
        '日本進口莫代爾 × PHOTEX 複合纖維，親膚如絲，敏感肌安心'
      ]
    }
  },
  {
    id: 'no-women-underwear',
    category: 'underwear',
    priceUSD: 1110,
    priceCNY: 7990,
    sizes: ['M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Soft Cream', hex: '#FDFBF7' },
      { name: 'Warm Lilac', hex: '#D8B4FE' }
    ],
    name: {
      en: 'Therabo NO Women\'s Full-Coverage Uterine-Warm Briefs',
      zh: '通微宝一氧化氮全包覆暖宫女士内裤',
      'zh-tw': '通微寶一氧化氮全包覆暖宮女士內褲'
    },
    tagline: {
      en: 'Full 360° PHOTEX coverage — deep uterine warmth that ends period pain & cold-womb syndrome',
      zh: '全裤面 PHOTEX 360° 全包覆·深度暖宫·根治痛经与宫寒',
      'zh-tw': '全褲面 PHOTEX 360° 全包覆·深度暖宮·根治痛經與宮寒'
    },
    description: {
      en: 'Therabo\'s premium full-coverage women\'s line. Unlike standard versions with a localized front panel, every square centimeter of this brief is woven with PHOTEX bio-resonance silk — wrapping the uterus, ovaries, and pelvic lymphatic system in 360° therapeutic warmth. Targeted endogenous NO release through the pelvic microvasculature dissolves period cramping, cold-womb heaviness, and chronic leucorrhea irritation. The most comprehensive non-invasive reproductive-microecology care available.',
      zh: '通微宝高端全包覆暖宫内裤。区别于普通在前腹部局部贴片的款式，整条内裤面料 100% 融入 PHOTEX 生物谱能丝——对子宫、卵巢、盆腔淋巴系统形成 360° 环抱式温通养护。利用太赫兹波激发盆腔毛细血管 NO 释放，化解经期痛经瘀堵、宫寒坠胀、白带异味等女性高发困扰，深度调养生殖微生态。',
      'zh-tw': '通微寶高端全包覆暖宮內褲。區別於普通在前腹部局部貼片的款式，整條內褲面料 100% 融入 PHOTEX 生物譜能絲——對子宮、卵巢、盆腔淋巴系統形成 360° 環抱式溫通養護。利用太赫茲波激發盆腔毛細血管 NO 釋放，化解經期痛經瘀堵、宮寒墜脹、白帶異味等女性高發困擾，深度調養生殖微生態。'
    },
    recommendedUse: {
      en: 'Wear daily as your standard underwear. Highly recommended throughout menstruation, and as a pre-conception conditioning essential. Anti-static, low-friction — safe for the entire life cycle.',
      zh: '日常温宫贴身穿戴，经期强烈推荐，备孕前调理与产后恢复期首选。无静电、低摩擦面料，全生命周期可穿戴。',
      'zh-tw': '日常溫宮貼身穿戴，經期強烈推薦，備孕前調理與產後恢復期首選。無靜電、低摩擦面料，全生命週期可穿戴。'
    },
    details: {
      en: [
        '360° full-fabric uterine warmth — period cramps dissolve from the inside',
        'Accelerates pelvic floor & lymphatic detox — improves leucorrhea, odor & mucosal irritation',
        'Activates intimate-area immune defense, preventing recurrent itch & bacterial overgrowth',
        'Reverses cold-womb syndrome, cold hands & feet — dual-purpose for conception & post-partum',
        'Seamless lace × Lycra ultra-elastic waistband — second-skin fit, zero thigh compression',
        'Hormone-free, fragrance-free, dye-free — gynecologist-safe for sensitive women'
      ],
      zh: [
        '全裤面 360° 暖宫，深层缓解经期下腹冷痛、宫寒坠胀与腰骶酸困',
        '加速盆底淋巴与骨盆血液排毒循环，改善白带异味、粘膜不适与反复瘙痒',
        '激发外阴及阴道粘膜防御力，长效呵护私密部位免受菌群红痒',
        '改善小腹冰凉、宫寒手脚冷——备孕调理与产后恢复双效适用',
        '无痕蕾丝 × 莱卡高回弹腰带，第二层肌肤般贴合，不勒大腿、不卷边',
        '零激素、无香料、无染色，妇科敏感人群可放心长期穿戴'
      ],
      'zh-tw': [
        '全褲面 360° 暖宮，深層緩解經期下腹冷痛、宮寒墜脹與腰骶酸困',
        '加速盆底淋巴與骨盆血液排毒循環，改善白帶異味、粘膜不適與反覆瘙癢',
        '激發外陰及陰道粘膜防禦力，長效呵護私密部位免受菌群紅癢',
        '改善小腹冰涼、宮寒手腳冷——備孕調理與產後恢復雙效適用',
        '無痕蕾絲 × 萊卡高回彈腰帶，第二層肌膚般貼合，不勒大腿、不卷邊',
        '零激素、無香料、無染色，婦科敏感人群可放心長期穿戴'
      ]
    }
  },
  {
    id: 'no-men-sleeve',
    category: 'underwear',
    priceUSD: 1110,
    priceCNY: 7990,
    sizes: ['M', 'L', 'XL', '2XL', '3XL'],
    colors: [
      { name: 'Infinite Black', hex: '#0F172A' },
      { name: 'Deep Charcoal', hex: '#334155' }
    ],
    name: {
      en: 'Therabo NO Men\'s Cardio-Pulmonary Bio-Tee',
      zh: '通微宝一氧化氮男士心肺养护短袖',
      'zh-tw': '通微寶一氧化氮男士心肺養護短袖'
    },
    tagline: {
      en: 'Strengthen lungs, calm the gut, deepen sleep — the high-performer\'s daily reset',
      zh: '强韧心肺·调养脾胃·改善睡眠——高压男士的日常修复',
      'zh-tw': '強韌心肺·調養脾胃·改善睡眠——高壓男士的日常修復'
    },
    description: {
      en: 'A premium bio-resonance tee crafted for high-stress executives, founders, and chronic-fatigue corporate warriors. Triple-density PHOTEX panels cover the heart-lung field, epigastric region, and upper-back GV14 zone — driving NO synthesis across the entire torso microcirculation. The result: deeper respiration, calmer digestion, and a parasympathetic reset that finally lets the always-on mind sink into real sleep.',
      zh: '专为高压男士、企业管理者及慢性疲劳人群研制的高端能谱内衣。胸前心肺、腹部脾胃、背部大椎三重满铺 PHOTEX 生物谱能反应核心——太赫兹波激活全身躯干微血管内皮 NO 合成，强力推动心肺微氧循环、调理胃肠平滑肌、深度调节副交感神经。让多年慢性疲劳、胃胀气、入睡难的体质全面重启。',
      'zh-tw': '專為高壓男士、企業管理者及慢性疲勞人群研製的高端能譜內衣。胸前心肺、腹部脾胃、背部大椎三重滿鋪 PHOTEX 生物譜能反應核心——太赫茲波激活全身軀幹微血管內皮 NO 合成，強力推動心肺微氧循環、調理腸胃平滑肌、深度調節副交感神經。讓多年慢性疲勞、胃脹氣、入睡難的體質全面重啟。'
    },
    recommendedUse: {
      en: 'The go-to four-season base layer for men. Wear under a suit or dress shirt as your "personal energy charger" by day; sleep in it for measurably deeper sleep cycles.',
      zh: '男士四季打底首选。白天穿在西装、衬衫内作「随身充电器」；夜间穿着可缩短入睡时间，深睡周期延长 30% 以上。',
      'zh-tw': '男士四季打底首選。白天穿在西裝、襯衫內作「隨身充電器」；夜間穿著可縮短入睡時間，深睡週期延長 30% 以上。'
    },
    details: {
      en: [
        'Activates pulmonary eNOS pathway — deeper breaths, less out-of-breath',
        'Warms the spleen-stomach zone — relieves chronic gastritis, cold cramps, after-meal fatigue',
        'Calms autonomic nervous system — slow waves arrive faster, deep sleep extends',
        'Improves frozen-shoulder syndrome, chronic neck-shoulder tightness & cerebral hypoperfusion',
        'Premium Japanese Modal × PHOTEX yarn — 1000+ washes without deformation',
        'Antimicrobial, low-static, breathable — no need to switch with the seasons'
      ],
      zh: [
        '深度激活肺泡 eNOS 通路，增强呼吸深度与运动耐力，慢跑爬山不再气喘',
        '太赫兹波温通脾胃，化解多年慢性胃炎、胃寒胀痛、餐后困倦与晨起反酸',
        '调节自主神经平衡，松弛过紧的脑神经，深度睡眠时长显著增加 30%+',
        '改善肩周炎、慢性肩颈酸痛与脑供血不足，告别屏前 8 小时背肌僵硬',
        '日本进口超细莫代尔 × PHOTEX 纺成，洗千次不变形、不起球、永不松垮',
        '物理抑菌、低静电、四季透气——一件衣覆盖全年贴身打底需求'
      ],
      'zh-tw': [
        '深度激活肺泡 eNOS 通路，增強呼吸深度與運動耐力，慢跑爬山不再氣喘',
        '太赫茲波溫通脾胃，化解多年慢性胃炎、胃寒脹痛、餐後困倦與晨起反酸',
        '調節自主神經平衡，鬆弛過緊的腦神經，深度睡眠時長顯著增加 30%+',
        '改善肩周炎、慢性肩頸酸痛與腦供血不足，告別屏前 8 小時背肌殭硬',
        '日本進口超細莫代爾 × PHOTEX 紡成，洗千次不變形、不起球、永不鬆垮',
        '物理抑菌、低靜電、四季透氣——一件衣覆蓋全年貼身打底需求'
      ]
    }
  },
  {
    id: 'no-women-sleeve',
    category: 'underwear',
    priceUSD: 1110,
    priceCNY: 7990,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Crimson Arterial', hex: '#BE123C' },
      { name: 'Soft Cream', hex: '#FDFBF7' }
    ],
    name: {
      en: 'Therabo NO Women\'s Endocrine-Balance Vitality Tee',
      zh: '通微宝一氧化氮女士气血焕活短袖',
      'zh-tw': '通微寶一氧化氮女士氣血煥活短袖'
    },
    tagline: {
      en: 'Reset full-body circulation, end cold-syndrome fatigue, balance the endocrine system from within',
      zh: '激活女性气血大循环·告别虚寒体质·调养内分泌·睡出红润气色',
      'zh-tw': '激活女性氣血大循環·告別虛寒體質·調養內分泌·睡出紅潤氣色'
    },
    description: {
      en: 'A bio-resonance tee designed around modern women\'s endocrinology. High-activity PHOTEX panels target the upper back (GV14), epigastric region, and underarm-mammary lymphatic gateways. Targeted NO release dramatically improves peripheral blood supply to the torso, rebalances digestive smooth muscle, and reactivates parasympathetic recovery — directly addressing the cold hands, dull complexion, and qi-blood deficiency that plague modern white-collar women.',
      zh: '专为现代都市女性研发的能谱焕活短袖。高活性 PHOTEX 太赫兹转化面料精准贴合后背督脉、胃脘穴及腋下乳腺微循环入口——借助一氧化氮的微血管深层舒张，全面提升上身末梢血供，调和脾胃运化，激活内分泌大循环。告别多年虚寒手脚冷、面色暗沉与气血两亏，由内而外焕发红润气色。',
      'zh-tw': '專為現代都市女性研發的能譜煥活短袖。高活性 PHOTEX 太赫茲轉化面料精準貼合後背督脈、胃脘穴及腋下乳腺微循環入口——借助一氧化氮的微血管深層舒張，全面提升上身末梢血供，調和脾胃運化，激活內分泌大循環。告別多年虛寒手腳冷、面色暗沉與氣血兩虧，由內而外煥發紅潤氣色。'
    },
    recommendedUse: {
      en: 'Wear long-term next-to-skin. Especially recommended for: chronically cold-handed women, severe dysmenorrhea sufferers, post-partum mothers, and white-collar workers in over-air-conditioned offices.',
      zh: '建议长期贴身穿着。手脚冰凉、痛经体寒、产后虚弱、办公室冷气环境长时间停留人群效果尤佳。',
      'zh-tw': '建議長期貼身穿著。手腳冰涼、痛經體寒、產後虛弱、辦公室冷氣環境長時間停留人群效果尤佳。'
    },
    details: {
      en: [
        'Boosts upper-body & glandular peripheral blood flow — visible facial rosiness in 2 weeks',
        'Warms the GV-meridian (督脉风门) — blocks office air-con neck-chill at the source',
        'Activates gut-wall NO diffusion — soothes bloating, reflux & post-meal heaviness',
        'Cares for mammary lymphatic flow — supports breast & axillary nodule prevention',
        'Choice of elegant V-neck or classic crew — anti-pilling, anti-fade, baby-soft drape',
        'Hypoallergenic, fragrance-free, all-natural blend — safe for nursing & post-partum'
      ],
      zh: [
        '提升上半身腺体末梢微血管流量，气血充盈，两周内双颊展露红润气色',
        '太赫兹波温补督脉风门穴，强力阻绝办公室冷气直吹背冷与晨起背僵',
        '调和胃肠壁 NO 因子扩散，改善胀气、呕逆、餐后腹胀等慢性消化不良',
        '调节乳腺与腋下淋巴循环，预防小叶增生与生理期周期性胀痛',
        '典雅 V 领或修身圆领可选，抗起球、防霉脱水快，婴儿级丝润触感',
        '低敏无香料、纯净纤维配方，哺乳期与产后调理皆可放心穿戴'
      ],
      'zh-tw': [
        '提升上半身腺體末梢微血管流量，氣血充盈，兩週內雙頰展露紅潤氣色',
        '太赫茲波溫補督脈風門穴，強力阻絕辦公室冷氣直吹背冷與晨起背僵',
        '調和胃腸壁 NO 因子擴散，改善脹氣、嘔逆、餐後腹脹等慢性消化不良',
        '調節乳腺與腋下淋巴循環，預防小葉增生與生理期週期性脹痛',
        '典雅 V 領或修身圓領可選，抗起球、防霉脫水快，嬰兒級絲潤觸感',
        '低敏無香料、純淨纖維配方，哺乳期與產後調理皆可放心穿戴'
      ]
    }
  },

  // ════════════════════════════════════════════════════════════
  //  CATEGORY: DEDICATED SPECIALTIES (专用系列)
  // ════════════════════════════════════════════════════════════
  {
    id: 'no-multi-patch',
    category: 'special',
    priceUSD: 69,
    priceCNY: 499.5,
    sizes: ['5 patches per pack'],
    colors: [
      { name: 'Skin Beige', hex: '#F5DEB3' }
    ],
    name: {
      en: 'Therabo NO Multi-Function Therapeutic Patch (5 pcs)',
      zh: '通微宝一氧化氮多功能理疗贴（5贴/袋）',
      'zh-tw': '通微寶一氧化氮多功能理療貼（5貼/袋）'
    },
    tagline: {
      en: 'Apply anywhere it hurts — 3–5 day continuous bio-resonance relief, totally drug-free',
      zh: '哪里痛贴哪里·单贴 3–5 天持续起效·零药剂零依赖',
      'zh-tw': '哪裡痛貼哪裡·單貼 3–5 天持續起效·零藥劑零依賴'
    },
    description: {
      en: 'Therabo\'s entry-tier rapid-relief patch — every Chinese household\'s emergency kit essential. Each foil-sealed patch can be trimmed to fit any pain site: shoulder, neck, lumbar, knee, elbow, even abdominal cramps. PHOTEX 25–43 THz bio-resonance triggers local microvascular NO release, accelerating soft-tissue repair and circulation through the contact zone. Single patch stays active for 3–5 continuous days, washable, hypoallergenic — and absolutely zero pharmaceuticals.',
      zh: '通微宝品牌入门级急救理疗贴，每个中国家庭的常备品。每袋 5 贴独立铝箔密封，可裁剪定形贴附身体任何疼痛部位——肩颈、腰背、膝盖、痛经、腱鞘炎、网球肘、运动扭伤皆可用。PHOTEX 25–43 THz 太赫兹波激发贴附区毛细血管 NO 释放，加速局部微循环与软组织修复。单贴持续生效 3–5 天，可水洗、低敏、全程零药剂。',
      'zh-tw': '通微寶品牌入門級急救理療貼，每個家庭的常備品。每袋 5 貼獨立鋁箔密封，可裁剪定形貼附身體任何疼痛部位——肩頸、腰背、膝蓋、痛經、腱鞘炎、網球肘、運動扭傷皆可用。PHOTEX 25–43 THz 太赫茲波激發貼附區毛細血管 NO 釋放，加速局部微循環與軟組織修復。單貼持續生效 3–5 天，可水洗、低敏、全程零藥劑。'
    },
    recommendedUse: {
      en: 'Peel the release film and apply directly to clean skin over the painful area. Trim with scissors to fit knuckles, ankles, knee caps, etc. One patch stays active 3–5 days — showering, sweating and light exercise won\'t affect the effect.',
      zh: '撕开离型膜直接贴敷洁净皮肤，可裁剪适应指关节、脚踝、膝盖等不同部位。单贴持续生效 3–5 天，出汗、淋浴、轻度运动均不影响疗效。',
      'zh-tw': '撕開離型膜直接貼敷潔淨皮膚，可裁剪適應指關節、腳踝、膝蓋等不同部位。單貼持續生效 3–5 天，出汗、淋浴、輕度運動均不影響療效。'
    },
    details: {
      en: [
        'Soothes shoulder-neck stiffness, lumbar ache, knee weakness, cervical radiating pain',
        'Period cramps: apply to lower abdomen + GV4 (命门) for visible relief within hours',
        'Auxiliary therapy for tennis elbow, tendinitis, mouse-hand & sports sprain recovery',
        'Single patch lasts 3–5 days · trim-to-fit · works through clothing layers',
        'Zero pharmaceuticals, zero hormones — safe for sensitive skin, kids, elderly',
        '5 patches per pack — desk-drawer, travel kit & gym-bag essential'
      ],
      zh: [
        '缓解肩颈僵痛、腰背酸困、膝盖软痛、颈椎放射痛与运动后肌肉酸疼',
        '女性经期痛经贴在小腹、命门可显著缓解周期性下腹冷痛',
        '辅助加速腱鞘炎、网球肘、鼠标手、运动扭伤的软组织修复',
        '单贴生效 3–5 天，可裁剪适应不同部位（指关节、脚踝、膝盖等）',
        '零药剂零激素，敏感肌、儿童、孕妇外用咨询医师后均可放心',
        '一袋 5 贴轻便携带——办公室抽屉、差旅、运动包必备应急装备'
      ],
      'zh-tw': [
        '緩解肩頸僵痛、腰背酸困、膝蓋軟痛、頸椎放射痛與運動後肌肉酸疼',
        '女性經期痛經貼在小腹、命門可顯著緩解週期性下腹冷痛',
        '輔助加速腱鞘炎、網球肘、滑鼠手、運動扭傷的軟組織修復',
        '單貼生效 3–5 天，可裁剪適應不同部位（指關節、腳踝、膝蓋等）',
        '零藥劑零激素，敏感肌、兒童、孕婦外用諮詢醫師後均可放心',
        '一袋 5 貼輕便攜帶——辦公室抽屜、差旅、運動包必備應急裝備'
      ]
    }
  },
  {
    id: 'no-eye-mask',
    category: 'special',
    priceUSD: 276,
    priceCNY: 1990,
    sizes: ['Adjustable Band'],
    colors: [
      { name: 'Pitch Dark Night', hex: '#18181B' },
      { name: 'Warm Lilac', hex: '#D8B4FE' }
    ],
    name: {
      en: 'Therabo NO Eye-Revive Bio-Resonance Sleep Mask',
      zh: '通微宝一氧化氮舒缓促眠通眼罩',
      'zh-tw': '通微寶一氧化氮舒緩促眠通眼罩'
    },
    tagline: {
      en: 'The world\'s only zero-electricity "eye SPA" — resolves dry eyes, ocular pressure & insomnia in one wear',
      zh: '全球唯一无电「暖眼 SPA」·一戴入眠·根治干涩眼、眼压与失眠',
      'zh-tw': '全球唯一無電「暖眼 SPA」·一戴入眠·根治乾澀眼、眼壓與失眠'
    },
    description: {
      en: 'The only sleep mask that delivers therapeutic results from the moment it touches your forehead — no batteries, no heating coil, no attachments. The contact layer integrates dozens of nano-mineral activators with high-purity PHOTEX 25–43 THz fabric, triggering endogenous NO release across the orbital, ciliary, and sub-retinal microvasculature. Lubricates dry tear glands within minutes, relieves intraocular pressure, modulates pineal-gland melatonin release, and ushers you into baby-deep sleep.',
      zh: '全球唯一一款佩戴在额头或眼部就能即刻起效的能量眼罩——无需充电、无需配件、零热源。贴眼面铺设数十种纳米级矿物质活性点，配合 PHOTEX 高纯度太赫兹面料，激发眼眶、睫状肌及视网膜下毛细血管的内源性一氧化氮释放。秒润干涩泪腺，消除高眼压不适，调节松果体褪黑素分泌，进入婴儿级深睡眠。',
      'zh-tw': '全球唯一一款佩戴在額頭或眼部就能即刻起效的能量眼罩——無需充電、無需配件、零熱源。貼眼面鋪設數十種奈米級礦物質活性點，配合 PHOTEX 高純度太赫茲面料，激發眼眶、睫狀肌及視網膜下毛細血管的內源性一氧化氮釋放。秒潤乾澀淚腺，消除高眼壓不適，調節松果體褪黑素分泌，進入嬰兒級深睡眠。'
    },
    recommendedUse: {
      en: 'Wear at bedtime. For headaches or stress, flip up to wrap the forehead — instantly soothes the temples and 印堂 zone. Slim, portable for flights, naps, business trips.',
      zh: '睡前佩戴即可入眠。头痛压力大时翻起围在额头，畅通太阳穴与印堂，快速舒脑。轻薄便携，差旅、午休、长途飞行皆可作随身眼部 SPA。',
      'zh-tw': '睡前佩戴即可入眠。頭痛壓力大時翻起圍在額頭，暢通太陽穴與印堂，快速舒腦。輕薄便攜，差旅、午休、長途飛行皆可作隨身眼部 SPA。'
    },
    details: {
      en: [
        'Relieves long-screen eye dryness, irritation, tearing & elevated intraocular pressure',
        'Auxiliary care for early-stage cataracts, glaucoma & floaters discomfort',
        'Parasympathetic activation — shortens sleep latency, extends deep sleep phase',
        'Drains periorbital lymphatic stagnation — fades dark circles & morning puffy bags',
        '3D pressure-free orbital cut — full light-block without compressing eyelashes',
        '7-day no-reason trial · return shipping insurance · 100+ wash cycles tested'
      ],
      zh: [
        '秒解眼睫干红发酸、眼眶干刺、迎风流泪与用眼过度导致的眼压过高',
        '辅助改善早期白内障、青光眼、飞蚊症前期不适',
        '安神静气调节副交感神经，缩短入睡时间，深度睡眠周期显著延长',
        '改善眼周积液与黑色素沉积，大幅淡化黑眼圈与晨起沉重眼袋',
        '3D 眼窝立体不压眼眶剪裁，呼吸式鼻梁全遮光，洗后定型不松垮',
        '7 天无理由试戴 + 运费险全程覆盖 + 100 次水洗一氧化氮活性零衰减'
      ],
      'zh-tw': [
        '秒解眼睫乾紅發酸、眼眶乾刺、迎風流淚與用眼過度導致的眼壓過高',
        '輔助改善早期白內障、青光眼、飛蚊症前期不適',
        '安神靜氣調節副交感神經，縮短入睡時間，深度睡眠週期顯著延長',
        '改善眼周積液與黑色素沉積，大幅淡化黑眼圈與晨起沉重眼袋',
        '3D 眼窩立體不壓眼眶剪裁，呼吸式鼻樑全遮光，洗後定型不鬆垮',
        '7 天無理由試戴 + 運費險全程覆蓋 + 100 次水洗一氧化氮活性零衰減'
      ]
    }
  },
  {
    id: 'no-breast-patch',
    category: 'special',
    priceUSD: 485,
    priceCNY: 3490,
    sizes: ['Diameter 15cm (1 Pair)'],
    colors: [
      { name: 'Ultra-Soft White', hex: '#FFFFFF' }
    ],
    name: {
      en: 'Therabo NO Breast Comfort Bio-Patches (Pair)',
      zh: '通微宝一氧化氮多孔柔护乳贴',
      'zh-tw': '通微寶一氧化氮多孔柔護乳貼'
    },
    tagline: {
      en: 'Dissolve nodules, ease cyclic tenderness, clear blocked milk ducts — totally hormone-free',
      zh: '温通理气散结·化解乳腺结节、经期胀痛与哺乳期淤堵·零激素零药物',
      'zh-tw': '溫通理氣散結·化解乳腺結節、經期脹痛與哺乳期淤堵·零激素零藥物'
    },
    description: {
      en: 'Engineered for the growing epidemic of female breast discomfort. Anatomically curved honeycomb micro-sensing inserts house a high-density PHOTEX bio-resonance printed core that nests inside any standard bra cup. Activates targeted NO release in mammary microvasculature — accelerating lymphatic drainage and dissolving benign nodules, cyclic congestion, and blocked milk ducts. Hormone-free, drug-free, dye-free — one of the very few breast-care solutions safe for pregnancy and nursing.',
      zh: '为现代女性高发的乳腺不适倾力研制。圆弧蜂窝微感面料内置 PHOTEX 高密度太赫兹反应核心，完美配合文胸贴附胸部腺体——激活乳腺微血管 NO 释放，深层温通局部血流与淋巴通道，加速结节、囊肿、增生硬块的吸收化解。纯物理无激素无药剂，是市面少有的孕产期及哺乳期女性可放心使用的乳腺养护方案。',
      'zh-tw': '為現代女性高發的乳腺不適傾力研製。圓弧蜂窩微感面料內置 PHOTEX 高密度太赫茲反應核心，完美配合文胸貼附胸部腺體——激活乳腺微血管 NO 釋放，深層溫通局部血流與淋巴通道，加速結節、囊腫、增生硬塊的吸收化解。純物理無激素無藥劑，是市面少有的孕產期及哺乳期女性可放心使用的乳腺養護方案。'
    },
    recommendedUse: {
      en: 'Insert the mesh side toward skin into any standard bra cup. Wear up to 24 hours/day for invisible continuous therapy. Machine washable; single pair lasts up to 6 months of daily use.',
      zh: '将乳贴网状面朝内插入日常文胸内垫，享 24 小时隐形理疗。支持多次水洗循环使用，单对最长可使用 6 个月。',
      'zh-tw': '將乳貼網狀面朝內插入日常文胸內墊，享 24 小時隱形理療。支持多次水洗循環使用，單對最長可使用 6 個月。'
    },
    details: {
      en: [
        'Rapidly dissolves cyclical pre-menstrual breast tenderness, swelling & hot-cold flushes',
        'Opens mammary lymphatic channels — accelerates benign cyst & nodule resorption',
        'Lactation lifesaver: clears blocked milk ducts, prevents mastitis fever & engorgement',
        '100% molecular physics — zero hormones, fragrance or pharmaceutical residues',
        'Beijing Zhongke clinical partnership product — infant-grade safety certification',
        'Hypoallergenic for post-cosmetic-surgery & ultra-sensitive skin'
      ],
      zh: [
        '极速疏泄胸部组织瘀塞，消除大姨妈前的周期性乳房胀硬冷痛',
        '打通腺体毛细通道，加速良性囊肿积液吸收，软化结节硬块',
        '哺乳妈妈开奶神器！强效疏通乳管，避免堵奶发烧与乳腺炎',
        '纯物理太赫兹转化，零激素、零香料、零药物残留，孕产期可放心用',
        '北京中科医用材料临床合作产品，达婴童级安全标准',
        '医美术后修复期、敏感肌人群均可放心贴敷使用'
      ],
      'zh-tw': [
        '極速疏洩胸部組織瘀塞，消除大姨媽前的週期性乳房脹硬冷痛',
        '打通腺體毛細通道，加速良性囊腫積液吸收，軟化結節硬塊',
        '哺乳媽媽開奶神器！強效疏通乳管，避免堵奶發燒與乳腺炎',
        '純物理太赫茲轉化，零激素、零香料、零藥物殘留，孕產期可放心用',
        '北京中科醫用材料臨床合作產品，達嬰童級安全標準',
        '醫美術後修復期、敏感肌人群均可放心貼敷使用'
      ]
    }
  },
  {
    id: 'no-face-mask',
    category: 'special',
    priceUSD: 901,
    priceCNY: 6490,
    sizes: ['Comfort One-Size'],
    colors: [
      { name: 'Ultra-Soft White', hex: '#FFFFFF' }
    ],
    name: {
      en: 'Therabo Zhenyan Collagen-Revive NO Face Mask',
      zh: '通微宝臻颜焕活一氧化氮面罩',
      'zh-tw': '通微寶臻顏煥活一氧化氮面罩'
    },
    tagline: {
      en: 'From micro-circulation roots — boost collagen, fade scars, control acne, restore luminosity',
      zh: '从微循环底层焕活胶原·淡斑祛痘·抗衰修护·恢复素颜光泽',
      'zh-tw': '從微循環底層煥活膠原·淡斑祛痘·抗衰修護·恢復素顏光澤'
    },
    description: {
      en: 'A new-generation beauty solution that breaks the old "topical-only" cosmetic paradigm. The Zhenyan mask\'s contact layer is fully embedded with PHOTEX bio-resonance print zones — driving NO release across facial capillaries, supercharging dermal oxygenation, stimulating fibroblast collagen synthesis, suppressing melanin formation, and metabolizing scars from beneath the dermis. The result: a luminous, even-toned complexion built from the inside.',
      zh: '打破传统化妆品只停留在表皮的局限，从「微循环底层」开始的新次元美容方案。臻颜焕活面罩贴合层全面铺装 PHOTEX 太赫兹科技印层，激活面部毛细血管内皮 NO 释放——提升皮下含氧灌流量，刺激成纤维细胞合成胶原蛋白，抑制黑色素生成，从根源代谢痘印瑕疵，恢复素颜光泽。',
      'zh-tw': '打破傳統化妝品只停留在表皮的侷限，從「微循環底層」開始的新次元美容方案。臻顏煥活面罩貼合層全面鋪裝 PHOTEX 太赫茲科技印層，激活面部毛細血管內皮 NO 釋放——提升皮下含氧灌流量，刺激成纖維細胞合成膠原蛋白，抑制黑色素生成，從根源代謝痘印瑕疵，恢復素顏光澤。'
    },
    recommendedUse: {
      en: 'After cleansing and toning, wear for 30–60 minutes — or sleep in it overnight for maximum overnight repair. Wake to refined, non-oily, glowing skin.',
      zh: '洁面爽肤后贴面佩戴 30–60 分钟，或夜间直接佩戴入睡。第二日起床面部细腻无油，气色充盈，肌肤如新生。',
      'zh-tw': '潔面爽膚後貼面佩戴 30–60 分鐘，或夜間直接佩戴入睡。第二日起床面部細膩無油，氣色充盈，肌膚如新生。'
    },
    details: {
      en: [
        'Elevates capillary oxygen perfusion — fades dark acne scars, stubborn spots & pitted scars',
        'Activates collagen synthesis pathways — tightens jawline, lifts smile lines & eye contours',
        'Stabilizes sebum secretion at the root — improves sensitive, oily, acne-prone skin',
        'Accelerates post-cosmetic recovery — safe for use after acid peels & laser treatments',
        'Aerospace-grade silk fiber — breathable, hypoallergenic, four-season comfort',
        'Adolescent acne phase: relieves cystic acne, marks & scarring with zero chemicals'
      ],
      zh: [
        '提升面部毛细血管含氧灌流量，淡化黑色痘印、顽固斑点与凹坑凹疤',
        '激发胶原蛋白合成通路，提拉松弛轮廓，紧致法令纹与眼角细纹',
        '从底层调节皮脂分泌，改善敏感肌、出油、爆痘、红血丝',
        '加速医美术后修复，刷酸、激光、光子嫩肤后舒缓修复期可放心使用',
        '太空丝亲肤透氧面料，敏感肌一年四季可贴敷',
        '青春期可缓解囊肿型青春痘、痘印、痘疤，零化学零激素'
      ],
      'zh-tw': [
        '提升面部毛細血管含氧灌流量，淡化黑色痘印、頑固斑點與凹坑凹疤',
        '激發膠原蛋白合成通路，提拉鬆弛輪廓，緊緻法令紋與眼角細紋',
        '從底層調節皮脂分泌，改善敏感肌、出油、爆痘、紅血絲',
        '加速醫美術後修復，刷酸、激光、光子嫩膚後舒緩修復期可放心使用',
        '太空絲親膚透氧面料，敏感肌一年四季可貼敷',
        '青春期可緩解囊腫型青春痘、痘印、痘疤，零化學零激素'
      ]
    }
  },
  {
    id: 'no-gloves',
    category: 'special',
    priceUSD: 901,
    priceCNY: 6490,
    sizes: ['Unisex Elastic Free Size'],
    colors: [
      { name: 'Cosmic Slate', hex: '#1F2937' },
      { name: 'Calming Taupe', hex: '#78716C' }
    ],
    name: {
      en: 'Therabo NO Hand-Care Therapeutic Gloves',
      zh: '通微宝一氧化氮多效理疗手套',
      'zh-tw': '通微寶一氧化氮多效理療手套'
    },
    tagline: {
      en: 'Heal mouse-hand, tendinitis & winter-cold fingers — touchscreen-friendly, wear-anywhere',
      zh: '松解鼠标手·改善手指冰麻·深层滋养手部肌肤·触屏无障碍',
      'zh-tw': '鬆解滑鼠手·改善手指冰麻·深層滋養手部肌膚·觸屏無障礙'
    },
    description: {
      en: 'A daily therapeutic glove for keyboard warriors, gamers, and hand-arthritis sufferers. Palm and finger zones are knit with PHOTEX bio-resonance threads that continuously trigger NO release in finger microvasculature — restoring warmth, easing tendon overuse, and aiding micro-injury repair. Touchscreen-compatible fingertips mean you never need to take them off.',
      zh: '专为键盘族、电子竞技党及手部腱鞘不适人群打造。手掌及手指全面编织 PHOTEX 太赫兹微循环能量因子——利用一氧化氮微管扩张特性，深度温暖发红发紫的手指关节，松解腕部过度损耗。指尖支持电容屏触控，办公游戏无需脱戴。',
      'zh-tw': '專為鍵盤族、電子競技黨及手部腱鞘不適人群打造。手掌及手指全面編織 PHOTEX 太赫茲微循環能量因子——利用一氧化氮微管擴張特性，深度溫暖發紅發紫的手指關節，鬆解腕部過度損耗。指尖支持電容屏觸控，辦公遊戲無需脫戴。'
    },
    recommendedUse: {
      en: 'Wear while computing, gaming, scrolling, or overnight for deep hand restoration. Capacitive touchscreen ready — no need to remove.',
      zh: '日常办公、打字游戏、刷手机时穿戴；夜间睡眠穿戴进行深层手部修护。指尖电容触屏，使用不脱戴。',
      'zh-tw': '日常辦公、打字遊戲、刷手機時穿戴；夜間睡眠穿戴進行深層手部修護。指尖電容觸屏，使用不脫戴。'
    },
    details: {
      en: [
        'Restores high-velocity blood flow to finger extremities — ends winter cold-fingers',
        'Improves carpal tunnel syndrome, tendon pain & thumb-fatigue from gripping',
        'Strengthens skin moisture barrier — softens cracked, aging or pigmented hands',
        'All-finger capacitive touchscreen support — uninterrupted phone & device use',
        'Lightweight elastic yarn — universally fits both men\'s & women\'s hands'
      ],
      zh: [
        '畅通手指末梢极细血管，瞬间暖手，告别冬天手指冰麻、握拳不灵活',
        '改善「鼠标手」「键盘手」与腱鞘粘连，松弛紧握肌肉造成的酸抽疼痛',
        '加强指间组织代谢，淡化老年暗沉斑，防止手部倒刺与皮肤粗糙皴裂',
        '十指全触屏织造——不耽误电脑、设备与手机操作',
        '轻感高回弹纱线，男女通用弹性均码，柔软不勒紧'
      ],
      'zh-tw': [
        '暢通手指末梢極細血管，瞬間暖手，告別冬天手指冰麻、握拳不靈活',
        '改善「滑鼠手」「鍵盤手」與腱鞘粘連，鬆弛緊握肌肉造成的酸抽疼痛',
        '加強指間組織代謝，淡化老年暗沈斑，防止手部倒刺與皮膚粗糙皸裂',
        '十指全觸屏織造——不耽誤電腦、設備與手機操作',
        '輕感高回彈紗線，男女通用彈性均碼，柔軟不勒緊'
      ]
    }
  },
  {
    id: 'therabo-therapy-boots',
    category: 'special',
    priceUSD: 9014,
    priceCNY: 64900,
    sizes: ['M (Fits 35-40)', 'L (Fits 41-45)'],
    colors: [
      { name: 'Pure Alabaster', hex: '#F3F4F6' }
    ],
    name: {
      en: 'Therabo NO Whole-Body Microcirculation Therapy Boots',
      zh: '通微宝一氧化氮全身微循环理疗靴',
      'zh-tw': '通微寶一氧化氮全身微循環理療靴'
    },
    tagline: {
      en: 'The feet are the master switch of full-body microcirculation — 1 hour to wake decades-dormant peripheral flow',
      zh: '双足是全身微循环的总开关·1 小时唤醒沉睡多年的末梢气血',
      'zh-tw': '雙足是全身微循環的總開關·1 小時喚醒沉睡多年的末梢氣血'
    },
    description: {
      en: 'The flagship of Therabo bio-wellness technology. Traditional medicine teaches that "when the feet flow, a hundred ailments dissolve" — the feet host the meeting points of 12 major meridians and are the first frontier where microvascular blockage manifests. The therapy boot is 360° densely lined with the highest-grade PHOTEX 25–43 THz fibers, harnessing NO\'s vasodilatory power to restart systemic microcirculation from the soles up. Clinically inspired solution for severe hypertension/diabetes, diabetic foot, gout, varicose veins and treatment-resistant insomnia rooted in microvascular dysfunction.',
      zh: '通微宝大健康科技的旗舰之作。中医云「足部畅，百病消」——双足汇聚足三阳、足三阴等 12 条经络起止点，更是全身微血管栓塞最早受害的末梢禁区。理疗靴内 360° 密铺最高规格 PHOTEX 太赫兹科技纤维，利用一氧化氮卓越的血管舒张力，从足底激发全身微循环重启——破解严重三高、糖尿病足、痛风、静脉曲张、严重失眠等顽固体质病的微循环根源。',
      'zh-tw': '通微寶大健康科技的旗艦之作。中醫云「足部暢，百病消」——雙足匯聚足三陽、足三陰等 12 條經絡起止點，更是全身微血管栓塞最早受害的末梢禁區。理療靴內 360° 密鋪最高規格 PHOTEX 太赫茲科技纖維，利用一氧化氮卓越的血管舒張力，從足底激發全身微循環重啟——破解嚴重三高、糖尿病足、痛風、靜脈曲張、嚴重失眠等頑固體質病的微循環根源。'
    },
    recommendedUse: {
      en: 'Wear for 1–2 hours daily — during midday rest, reading, watching TV, or overnight sleep. Cold-prone individuals report feeling deep warmth radiating from feet up through the lower back within the first hour.',
      zh: '每日午休、看电视或夜间睡眠穿戴 1–2 小时即可。全身畏寒人群佩戴 1 小时后，双脚乃至腰背可感受到由内而外的滚烫温暖。',
      'zh-tw': '每日午休、看電視或夜間睡眠穿戴 1–2 小時即可。全身畏寒人群佩戴 1 小時後，雙腳乃至腰背可感受到由內而外的滾燙溫暖。'
    },
    details: {
      en: [
        'Bone-deep warmth penetrating to KI1 (涌泉) — ends cold-leg syndrome & calf cramps',
        'Physically pumps lower-limb venous return — dissolves varicose stagnation visibly',
        'Restores diabetic-foot peripheral perfusion — recovers tactile sensitivity & skin nourishment',
        'Strengthens venous detox — flushes uric-acid deposits, relieves gout & ankle deformity',
        'Resets full-body autonomic nervous system — boosts sleep depth & immune function',
        'National invention patent · clinical trial partnerships with multiple Class III hospitals'
      ],
      zh: [
        '暖阳入骨直达涌泉穴，彻底化解双腿冰硬酸沉与冬晨小腿抽筋',
        '物理泵动下肢血管流速，舒张毛细血管，肉眼可见消通静脉曲张瘀滞',
        '改善糖尿病足末梢微循环闭阻，恢复足部触觉灵敏与皮肤润泽',
        '强化静脉排毒功能，冲刷高尿酸盐堆积，深度缓解痛风及足踝变形',
        '调节全身植物神经，激活副交感修复模式，提升睡眠深度与免疫力',
        '国家发明专利核心技术，与多家三甲医院开展临床合作验证'
      ],
      'zh-tw': [
        '暖陽入骨直達湧泉穴，徹底化解雙腿冰硬酸沉與冬晨小腿抽筋',
        '物理泵動下肢血管流速，舒張毛細血管，肉眼可見消通靜脈曲張瘀滯',
        '改善糖尿病足末梢微循環閉阻，恢復足部觸覺靈敏與皮膚潤澤',
        '強化靜脈排毒功能，沖刷高尿酸鹽堆積，深度緩解痛風及足踝變形',
        '調節全身植物神經，激活副交感修復模式，提升睡眠深度與免疫力',
        '國家發明專利核心技術，與多家三甲醫院開展臨床合作驗證'
      ]
    }
  },
  {
    id: 'therabo-energy-chamber',
    category: 'special',
    priceUSD: 138750,
    priceCNY: 999000,
    sizes: ['Professional Installation (Full Set)'],
    colors: [
      { name: 'Medical Star-White', hex: '#FFFFFF' }
    ],
    name: {
      en: 'Therabo NO Whole-Body Energy Chamber (Ultra-Luxury)',
      zh: '通微宝一氧化氮全身能量舱（顶奢专属）',
      'zh-tw': '通微寶一氧化氮全身能量艙（頂奢專屬）'
    },
    tagline: {
      en: 'The pinnacle of non-invasive NO therapy — for elite wellness clubs, VIP spas & ultra-high-net-worth homes',
      zh: '一氧化氮内源无创释放的全球顶峰·顶级养生会所、高净值私家康养专属',
      'zh-tw': '一氧化氮內源無創釋放的全球頂峰·頂級養生會所、高淨值私家康養專屬'
    },
    description: {
      en: 'The crown jewel of Therabo bio-tech. A full-body capsule enveloping the wearer in a luxury bio-resonance field of aerospace-grade PHOTEX fabric, augmented by multi-dimensional micro-current orchestration. Just 30 minutes inside triggers a multi-fold systemic NO surge through every skin pore, sweeping the 12 major meridians and reconditioning whole-body mitochondrial output. Operated by hospital and 5-star wellness clientele globally.',
      zh: '通微宝大健康科技的巅峰集大成。代表着全球一氧化氮内源无创释放的顶峰水平。上下舱室内衬铺设极大规模太赫兹能谱纤维床，配合多维气血共振微电流——仅需躺入 30 分钟，通过全皮肤毛孔激发体内 NO 指数呈数倍飙升，气吞万里般温通全身十二经脉，全面重启线粒体能量输出。',
      'zh-tw': '通微寶大健康科技的巔峰集大成。代表著全球一氧化氮內源無創釋放的頂峰水平。上下艙室內襯鋪設極大規模太赫茲能譜纖維床，配合多維氣血共振微電流——僅需躺入 30 分鐘，通過全皮膚毛孔激發體內 NO 指數呈數倍飆升，氣吞萬里般溫通全身十二經脈，全面重啟粒線體能量輸出。'
    },
    recommendedUse: {
      en: 'Rest in the chamber for 30–45 minutes per session, every 1–2 days. Ideal for premium wellness centers, top-tier golf-club VIP recovery rooms, or executive private domestic installations.',
      zh: '每日或每二日躺舱调养 30–45 分钟。非常适合高端美容养生会所、顶级高尔夫 VIP 室理疗引流，或高净值领袖私家居家康养。',
      'zh-tw': '每日或每二日躺艙調養 30–45 分鐘。非常適合高端美容養生會所、頂級高爾夫 VIP 室理療引流，或高淨值領袖私家居家康養。'
    },
    details: {
      en: [
        'Whole-organ capillary oxygen perfusion + deep parasympathetic reset',
        'Eradicates decade-deep meridian stagnation, chronic dampness & high-stress insomnia',
        'Clinically measured: 1-hour chamber session boosts microcirculation perfusion by 271%+',
        'Aerospace-grade composite outer shell · multi-zone temperature precision · touchless control panel',
        'Includes professional installation, on-site training & 3-year premium warranty',
        'White-glove concierge service · annual maintenance program · custom branding for clinics'
      ],
      zh: [
        '物理级全脏器毛细微血管带氧灌流泵动，深层副交感神经植物放松',
        '彻底扫清长年经络停滞冷颤、体内陈旧性湿邪、高压力脑细胞亢奋失眠',
        '实证测算：1 小时舱内调养使血液微循环灌流量飙升 271% 以上',
        '纯白航天科技流线复合外舱，多段温度精控，微电脑无感触控面板',
        '配套专业安装、现场培训与 3 年高端保修服务',
        '白手套尊享售后 + 年度维护方案 + 临床机构可定制品牌联名'
      ],
      'zh-tw': [
        '物理級全臟器毛細微血管帶氧灌流泵動，深層副交感神經植物放鬆',
        '徹底掃清長年經絡停滯冷顫、體內陳舊性濕邪、高壓力腦細胞亢奮失眠',
        '實證測算：1 小時艙內調養使血液微循環灌流量飆升 271% 以上',
        '純白航太科技流線複合外艙，多段溫度精控，微電腦無感觸控面板',
        '配套專業安裝、現場培訓與 3 年高端保修服務',
        '白手套尊享售後 + 年度維護方案 + 臨床機構可訂製品牌聯名'
      ]
    }
  }
];
