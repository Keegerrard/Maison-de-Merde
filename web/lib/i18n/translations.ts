// Translation dictionary. "default" preserves the app's original mixed
// English/French editorial voice (Cercle, Distinctions, Photographie…);
// "en" is the same copy fully in English; su/ar/zh are separate languages.
//
// Coverage note: this covers navigation chrome, auth, and every
// chat/notification/profile/session-detail/share string added for the new
// social features. It does not reach every last piece of flavor copy
// scattered through older marketing/landing components — see the
// session wrap-up notes for what's out of scope and why.

export type LangCode = "default" | "en" | "su" | "ar" | "zh";

export const LANGUAGES: { code: LangCode; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "default", label: "Original", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "su", label: "Basa Sunda", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
];

type Dict = Record<LangCode, string>;

export const STRINGS: Record<string, Dict> = {
  "app.name": {
    default: "Maison de Merde",
    en: "Maison de Merde",
    su: "Maison de Merde",
    ar: "ميزون دو ميرد",
    zh: "粪府 Maison de Merde",
  },
  "app.established": {
    default: "Established 2026",
    en: "Established 2026",
    su: "Diadegkeun 2026",
    ar: "تأسست عام 2026",
    zh: "创立于 2026 年",
  },
  "app.tagline": {
    default: "Purveyors of Fine Digestive Distinction",
    en: "Purveyors of Fine Digestive Distinction",
    su: "Nu Nyadiakeun Kaunggulan Pencernaan Kelas Luhur",
    ar: "موردو التميز الهضمي الرفيع",
    zh: "精致消化荣誉供应商",
  },
  "nav.log": { default: "Journal", en: "Journal", su: "Catetan", ar: "السجل", zh: "日志" },
  "nav.log.sub": { default: "Log", en: "Log", su: "Log", ar: "تسجيل", zh: "记录" },
  "nav.dashboard": { default: "Analyse", en: "Analyse", su: "Analisis", ar: "التحليل", zh: "分析" },
  "nav.dashboard.sub": { default: "Dashboard", en: "Dashboard", su: "Dasbor", ar: "لوحة البيانات", zh: "仪表盘" },
  "nav.circle": { default: "Cercle", en: "Circle", su: "Lingkaran", ar: "الدائرة", zh: "圈子" },
  "nav.circle.sub": { default: "Circle", en: "Circle", su: "Lingkaran", ar: "الدائرة", zh: "圈子" },
  "nav.achievements": { default: "Distinctions", en: "Achievements", su: "Prestasi", ar: "الأوسمة", zh: "成就" },
  "nav.achievements.sub": { default: "Achievements", en: "Achievements", su: "Prestasi", ar: "الإنجازات", zh: "成就" },

  "auth.ledgerOpen": {
    default: "The ledger is open.",
    en: "The ledger is open.",
    su: "Buku catetan geus dibuka.",
    ar: "السجل مفتوح.",
    zh: "账本已开启。",
  },
  "auth.disclaimer": {
    default: "Maison de Merde is a tracking and pattern-recognition tool. It is not a medical device and does not diagnose any condition.",
    en: "Maison de Merde is a tracking and pattern-recognition tool. It is not a medical device and does not diagnose any condition.",
    su: "Maison de Merde mangrupa alat palacak jeung pengenalan pola. Ieu lain alat médis sarta teu ngadiagnosis kaayaan naon waé.",
    ar: "ميزون دو ميرد أداة لتتبع الأنماط. إنها ليست جهازًا طبيًا ولا تشخّص أي حالة صحية.",
    zh: "Maison de Merde 是一款追踪与规律识别工具,并非医疗器械,不对任何病症进行诊断。",
  },
  "auth.login": { default: "Log In", en: "Log In", su: "Asup", ar: "تسجيل الدخول", zh: "登录" },
  "auth.signup": { default: "Create Account", en: "Create Account", su: "Jieun Akun", ar: "إنشاء حساب", zh: "创建账户" },
  "auth.usernameOrEmail": { default: "Username or Email", en: "Username or Email", su: "Nami Pamaké atawa Email", ar: "اسم المستخدم أو البريد الإلكتروني", zh: "用户名或邮箱" },
  "auth.password": { default: "Password", en: "Password", su: "Kecap Sandi", ar: "كلمة المرور", zh: "密码" },
  "auth.remember": { default: "Remember me on this device", en: "Remember me on this device", su: "Émut kuring dina alat ieu", ar: "تذكرني على هذا الجهاز", zh: "在此设备上记住我" },
  "auth.username": { default: "Username", en: "Username", su: "Nami Pamaké", ar: "اسم المستخدم", zh: "用户名" },
  "auth.email": { default: "Email", en: "Email", su: "Email", ar: "البريد الإلكتروني", zh: "邮箱" },

  "common.logout": { default: "Log Out", en: "Log Out", su: "Kaluar", ar: "تسجيل الخروج", zh: "退出登录" },
  "common.close": { default: "Close", en: "Close", su: "Tutup", ar: "إغلاق", zh: "关闭" },
  "common.cancel": { default: "Cancel", en: "Cancel", su: "Bolay", ar: "إلغاء", zh: "取消" },
  "common.send": { default: "Send", en: "Send", su: "Kirim", ar: "إرسال", zh: "发送" },
  "common.share": { default: "Share", en: "Share", su: "Bagikeun", ar: "مشاركة", zh: "分享" },
  "common.save": { default: "Save", en: "Save", su: "Simpen", ar: "حفظ", zh: "保存" },
  "common.loading": { default: "Loading…", en: "Loading…", su: "Ngamuat…", ar: "جارٍ التحميل…", zh: "加载中…" },
  "common.print": { default: "Print", en: "Print", su: "Cithak", ar: "طباعة", zh: "打印" },
  "common.download": { default: "Download", en: "Download", su: "Unduh", ar: "تنزيل", zh: "下载" },
  "common.edit": { default: "Edit", en: "Edit", su: "Ropéa", ar: "تعديل", zh: "编辑" },
  "common.back": { default: "Back", en: "Back", su: "Balik", ar: "رجوع", zh: "返回" },
  "common.yes": { default: "Yes", en: "Yes", su: "Enya", ar: "نعم", zh: "是" },

  "circle.eyebrow": { default: "THE CIRCLE", en: "THE CIRCLE", su: "LINGKARAN", ar: "الدائرة", zh: "圈子" },
  "circle.title": { default: "Ranked on consistency.", en: "Ranked on consistency.", su: "Diranking dumasar konsistensi.", ar: "مرتَّبون حسب الانتظام.", zh: "按坚持程度排名。" },
  "circle.lede": {
    default: "Never on volume. Rewarding volume here would be irresponsible.",
    en: "Never on volume. Rewarding volume here would be irresponsible.",
    su: "Sanés dumasar volume. Mikeun ganjaran pikeun volume di dieu moal tanggung jawab.",
    ar: "أبدًا حسب الكمّ. مكافأة الكمّ هنا ستكون تصرفًا غير مسؤول.",
    zh: "从不以数量论英雄。以数量作为奖励标准是不负责任的。",
  },
  "circle.empty": {
    default: "A circle of one is still a circle. Add someone by name above.",
    en: "A circle of one is still a circle. Add someone by name above.",
    su: "Lingkaran nu ngan hiji tetep disebut lingkaran. Tambihkeun batur dina inputan di luhur.",
    ar: "دائرة من شخص واحد تبقى دائرة. أضف شخصًا بالاسم أعلاه.",
    zh: "一个人也算一个圈子。请在上方按用户名添加好友。",
  },
  "circle.sharedWithYou": { default: "Shared with you", en: "Shared with you", su: "Dibagikeun ka anjeun", ar: "تمت مشاركتها معك", zh: "分享给你的内容" },
  "circle.sharedEmpty": {
    default: "Nothing's been shared with you yet.",
    en: "Nothing's been shared with you yet.",
    su: "Can aya nu dibagikeun ka anjeun.",
    ar: "لم يشارك معك أحد شيئًا بعد.",
    zh: "还没有人和你分享内容。",
  },

  "session.emptyList": {
    default: "Nothing recorded yet. The first entry is the hard one.",
    en: "Nothing recorded yet. The first entry is the hard one.",
    su: "Can aya nu kacatet. Catetan munggaran mémang nu pangsusahna.",
    ar: "لا يوجد أي تسجيل بعد. أول تسجيل هو الأصعب دائمًا.",
    zh: "还没有任何记录。第一次记录总是最难的。",
  },
  "session.detailTitle": { default: "Session detail", en: "Session detail", su: "Rincian Sési", ar: "تفاصيل الجلسة", zh: "记录详情" },
  "session.quickLog": { default: "quick log", en: "quick log", su: "catetan gancang", ar: "تسجيل سريع", zh: "快速记录" },
  "session.bloodFlagged": { default: "blood flagged", en: "blood flagged", su: "ditandaan getih", ar: "تم رصد دم", zh: "标记为有血迹" },
  "session.notes": { default: "Notes", en: "Notes", su: "Catetan", ar: "ملاحظات", zh: "备注" },
  "session.symptoms": { default: "Symptoms", en: "Symptoms", su: "Gejala", ar: "الأعراض", zh: "症状" },
  "session.photo": { default: "Photo", en: "Photo", su: "Poto", ar: "صورة", zh: "照片" },
  "session.sharedBy": { default: "Shared by", en: "Shared by", su: "Dibagikeun ku", ar: "شارَكها", zh: "分享者" },
  "session.viewDetails": { default: "View details", en: "View details", su: "Tingali Rincian", ar: "عرض التفاصيل", zh: "查看详情" },
  "session.bristolType": { default: "Bristol type", en: "Bristol type", su: "Tipe Bristol", ar: "نوع بريستول", zh: "布里斯托类型" },
  "session.color": { default: "Colour", en: "Colour", su: "Warna", ar: "اللون", zh: "颜色" },
  "session.odor": { default: "Odour", en: "Odour", su: "Bau", ar: "الرائحة", zh: "气味" },
  "session.pain": { default: "Pain", en: "Pain", su: "Nyeri", ar: "الألم", zh: "疼痛" },
  "session.visibleFood": { default: "Visible undigested food", en: "Visible undigested food", su: "Katingali tuangeun anu can dicerna", ar: "طعام غير مهضوم ظاهر", zh: "可见未消化食物" },

  "share.title": { default: "Share this session", en: "Share this session", su: "Bagikeun Sési Ieu", ar: "شارك هذه الجلسة", zh: "分享此记录" },
  "share.caption": { default: "Caption (optional)", en: "Caption (optional)", su: "Katerangan (opsional)", ar: "تعليق (اختياري)", zh: "配文(选填)" },
  "share.includePhoto": { default: "Include the photo", en: "Include the photo", su: "Sertakeun poto", ar: "تضمين الصورة", zh: "包含照片" },
  "share.recipient": { default: "Share with", en: "Share with", su: "Bagikeun ka", ar: "شارك مع", zh: "分享给" },
  "share.button": { default: "Share", en: "Share", su: "Bagikeun", ar: "مشاركة", zh: "分享" },
  "share.success": { default: "Shared.", en: "Shared.", su: "Parantos dibagikeun.", ar: "تمت المشاركة.", zh: "已分享。" },
  "share.noFriends": {
    default: "Add someone to your Circle before you can share with them.",
    en: "Add someone to your Circle before you can share with them.",
    su: "Tambihkeun batur kana Lingkaran anjeun samemeh tiasa dibagikeun.",
    ar: "أضف شخصًا إلى دائرتك أولًا حتى تتمكن من المشاركة معه.",
    zh: "先将好友添加到你的圈子,才能与其分享。",
  },

  "chat.title": { default: "Chat", en: "Chat", su: "Obrolan", ar: "الدردشة", zh: "聊天" },
  "chat.placeholder": { default: "Write a message…", en: "Write a message…", su: "Tulis pesen…", ar: "اكتب رسالة…", zh: "输入消息…" },
  "chat.empty": { default: "No messages yet. Say hello.", en: "No messages yet. Say hello.", su: "Can aya pesen. Cobian sapa heula.", ar: "لا رسائل بعد. ابدأ بالتحية.", zh: "还没有消息,先打个招呼吧。" },

  "notif.title": { default: "Notifications", en: "Notifications", su: "Pamberitahuan", ar: "الإشعارات", zh: "通知" },
  "notif.empty": { default: "Nothing yet.", en: "Nothing yet.", su: "Can aya naon-naon.", ar: "لا يوجد شيء بعد.", zh: "暂无通知。" },
  "notif.markAllRead": { default: "Mark all read", en: "Mark all read", su: "Tandaan sadayana geus dibaca", ar: "تعليم الكل كمقروء", zh: "全部标记为已读" },
  "notif.friendRequest": { default: "wants to join your circle", en: "wants to join your circle", su: "hoyong gabung ka lingkaran anjeun", ar: "يريد الانضمام إلى دائرتك", zh: "想要加入你的圈子" },
  "notif.friendAccept": { default: "accepted your circle request", en: "accepted your circle request", su: "nampi pamundut lingkaran anjeun", ar: "قبل طلبك للانضمام", zh: "接受了你的圈子邀请" },
  "notif.message": { default: "sent you a message", en: "sent you a message", su: "ngirim pesen ka anjeun", ar: "أرسل لك رسالة", zh: "给你发了一条消息" },
  "notif.sessionShared": { default: "shared a session with you", en: "shared a session with you", su: "ngabagikeun sési ka anjeun", ar: "شارك جلسة معك", zh: "与你分享了一条记录" },

  "profile.title": { default: "Your profile", en: "Your profile", su: "Profil Anjeun", ar: "ملفك الشخصي", zh: "个人主页" },
  "profile.nickname": { default: "Display name", en: "Display name", su: "Nami Tampilan", ar: "الاسم المعروض", zh: "显示名称" },
  "profile.banner": { default: "Banner", en: "Banner", su: "Spanduk", ar: "الشعار", zh: "横幅" },
  "profile.trait": { default: "Displayed distinction", en: "Displayed distinction", su: "Prestasi anu Ditembongkeun", ar: "الوسام المعروض", zh: "展示的成就" },
  "profile.traitNone": { default: "None", en: "None", su: "Euweuh", ar: "لا شيء", zh: "无" },
  "profile.visibility": { default: "Profile visibility", en: "Profile visibility", su: "Visibilitas Profil", ar: "خصوصية الملف الشخصي", zh: "主页可见性" },
  "profile.public": { default: "Public — visible to anyone", en: "Public — visible to anyone", su: "Umum — katingali ku sasaha", ar: "عام — يظهر للجميع", zh: "公开 — 任何人可见" },
  "profile.private": { default: "Private — visible to your circle only", en: "Private — visible to your circle only", su: "Pribadi — ngan katingali ku lingkaran anjeun", ar: "خاص — يظهر لدائرتك فقط", zh: "私密 — 仅圈内好友可见" },
  "profile.exportCard": { default: "Export as image", en: "Export as image", su: "Ekspor jadi Gambar", ar: "تصدير كصورة", zh: "导出为图片" },
  "profile.printCard": { default: "Print card", en: "Print card", su: "Cithak Kartu", ar: "طباعة البطاقة", zh: "打印卡片" },
  "profile.stats.sessions": { default: "Sessions logged", en: "Sessions logged", su: "Sési Kacatet", ar: "عدد الجلسات المسجّلة", zh: "已记录次数" },
  "profile.stats.streak": { default: "Current streak", en: "Current streak", su: "Runtuyan Ayeuna", ar: "التتابع الحالي", zh: "当前连续天数" },
  "profile.stats.longest": { default: "Longest streak", en: "Longest streak", su: "Runtuyan Panglila", ar: "أطول تتابع", zh: "最长连续天数" },
  "profile.stats.badges": { default: "Distinctions", en: "Achievements", su: "Prestasi", ar: "الأوسمة", zh: "成就" },
  "profile.joined": { default: "Est.", en: "Est.", su: "Diadegkeun", ar: "منذ", zh: "创建于" },
  "profile.cardSubtitle": {
    default: "Purveyor of Fine Digestive Distinction",
    en: "Purveyor of Fine Digestive Distinction",
    su: "Nu Nyadiakeun Kaunggulan Pencernaan Kelas Luhur",
    ar: "من موردي التميز الهضمي الرفيع",
    zh: "精致消化荣誉持有者",
  },

  "lang.label": { default: "Language", en: "Language", su: "Basa", ar: "اللغة", zh: "语言" },

  "achievements.eyebrow": { default: "Les distinctions", en: "Achievements", su: "Prestasi", ar: "الأوسمة", zh: "成就" },
  "achievements.title": { default: "Nine distinctions.", en: "Nine achievements.", su: "Salapan prestasi.", ar: "تسعة أوسمة.", zh: "九项成就。" },
  "achievements.progress": {
    default: "{n} sur {total} obtenues",
    en: "{n} of {total} unlocked",
    su: "{n} tina {total} kahontal",
    ar: "{n} من أصل {total} تم الحصول عليها",
    zh: "已解锁 {n}/{total}",
  },
  "achievements.error": {
    default: "Could not load your distinctions. Try again shortly.",
    en: "Could not load your achievements. Try again shortly.",
    su: "Teu tiasa ngamuat prestasi anjeun. Cobian deui sakedap deui.",
    ar: "تعذّر تحميل أوسمتك. حاول مرة أخرى بعد قليل.",
    zh: "无法加载你的成就,请稍后重试。",
  },
};

export function translate(
  lang: LangCode,
  key: string,
  replacements?: Record<string, string | number>
): string {
  const entry = STRINGS[key];
  let str = entry ? entry[lang] ?? entry.default ?? key : key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
