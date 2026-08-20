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
  "circle.you": { default: "(you)", en: "(you)", su: "(anjeun)", ar: "(أنت)", zh: "(你)" },
  "circle.streakLine": {
    default: "{streak}d · {percent} consistency",
    en: "{streak}d · {percent} consistency",
    su: "{streak}p · {percent} konsistensi",
    ar: "{streak} يوم · {percent} انتظام",
    zh: "{streak} 天 · {percent} 坚持度",
  },
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

  // ---- Account: change username ----
  "account.title": { default: "Account", en: "Account", su: "Akun", ar: "الحساب", zh: "账户" },
  "account.username": { default: "Username", en: "Username", su: "Nami Pamaké", ar: "اسم المستخدم", zh: "用户名" },
  "account.changeUsername": { default: "Change username", en: "Change username", su: "Robih Nami Pamaké", ar: "تغيير اسم المستخدم", zh: "更改用户名" },
  "account.newUsername": { default: "New username", en: "New username", su: "Nami Pamaké Anyar", ar: "اسم مستخدم جديد", zh: "新用户名" },
  "account.currentPassword": { default: "Current password", en: "Current password", su: "Kecap Sandi Ayeuna", ar: "كلمة المرور الحالية", zh: "当前密码" },
  "account.usernameUpdated": { default: "Username updated.", en: "Username updated.", su: "Nami pamaké parantos dirobih.", ar: "تم تحديث اسم المستخدم.", zh: "用户名已更新。" },
  "account.genericError": { default: "Something went wrong. Try again.", en: "Something went wrong. Try again.", su: "Aya kasalahan. Cobian deui.", ar: "حدث خطأ ما. حاول مرة أخرى.", zh: "出错了,请重试。" },
  "account.cancel": { default: "Cancel", en: "Cancel", su: "Bolay", ar: "إلغاء", zh: "取消" },
  "account.save": { default: "Save", en: "Save", su: "Simpen", ar: "حفظ", zh: "保存" },

  // ---- Forgot / reset password ----
  "auth.forgotPassword": { default: "Forgot password?", en: "Forgot password?", su: "Poho kecap sandi?", ar: "نسيت كلمة المرور؟", zh: "忘记密码?" },
  "auth.forgotTitle": { default: "Reset your password", en: "Reset your password", su: "Setél Deui Kecap Sandi", ar: "إعادة تعيين كلمة المرور", zh: "重置密码" },
  "auth.forgotDesc": {
    default: "Enter your username or email. This app has no email service configured, so the reset link will be shown here directly instead of being sent to you.",
    en: "Enter your username or email. This app has no email service configured, so the reset link will be shown here directly instead of being sent to you.",
    su: "Lebetkeun nami pamaké atawa email anjeun. Aplikasi ieu teu ngagaduhan layanan email, ku kituna tautan setél deui bakal ditembongkeun langsung di dieu, sanés dikirim ka anjeun.",
    ar: "أدخل اسم المستخدم أو البريد الإلكتروني. لا يوجد لدى هذا التطبيق خدمة بريد إلكتروني مُهيأة، لذا سيظهر رابط إعادة التعيين هنا مباشرة بدلًا من إرساله إليك.",
    zh: "请输入用户名或邮箱。此应用未配置邮件服务,因此重置链接会直接显示在这里,而不会发送给你。",
  },
  "auth.sendResetLink": { default: "Show my reset link", en: "Show my reset link", su: "Témbongkeun Tautan Setél Deui", ar: "إظهار رابط إعادة التعيين", zh: "显示我的重置链接" },
  "auth.resetTokenReady": {
    default: "Here is your reset code. In a real deployment this would be emailed to you instead.",
    en: "Here is your reset code. In a real deployment this would be emailed to you instead.",
    su: "Ieu kodeu setél deui anjeun. Dina deployment nyata, ieu bakal dikirim ka email anjeun.",
    ar: "هذا رمز إعادة التعيين الخاص بك. في نشر حقيقي، كان سيُرسل إلى بريدك الإلكتروني بدلًا من ذلك.",
    zh: "这是你的重置代码。在真实部署中,这会通过邮件发送给你。",
  },
  "auth.resetTokenUnknown": {
    default: "If an account exists with that name, a reset code has been generated for it.",
    en: "If an account exists with that name, a reset code has been generated for it.",
    su: "Upami aya akun ku éta ngaran, kodeu setél deui parantos digenerate.",
    ar: "إذا كان هناك حساب بهذا الاسم، فقد تم إنشاء رمز إعادة تعيين له.",
    zh: "如果存在该名称对应的账户,系统已为其生成一个重置代码。",
  },
  "auth.continueToReset": { default: "Enter a new password", en: "Enter a new password", su: "Lebetkeun Kecap Sandi Anyar", ar: "أدخل كلمة مرور جديدة", zh: "输入新密码" },
  "auth.resetCode": { default: "Reset code", en: "Reset code", su: "Kodeu Setél Deui", ar: "رمز إعادة التعيين", zh: "重置代码" },
  "auth.newPassword": { default: "New password", en: "New password", su: "Kecap Sandi Anyar", ar: "كلمة مرور جديدة", zh: "新密码" },
  "auth.resetPassword": { default: "Reset Password", en: "Reset Password", su: "Setél Deui Kecap Sandi", ar: "إعادة تعيين كلمة المرور", zh: "重置密码" },
  "auth.resetSuccess": { default: "Password reset. You can log in now.", en: "Password reset. You can log in now.", su: "Kecap sandi parantos disetél deui. Anjeun tiasa asup ayeuna.", ar: "تمت إعادة تعيين كلمة المرور. يمكنك تسجيل الدخول الآن.", zh: "密码已重置,现在可以登录了。" },
  "auth.backToLogin": { default: "Back to log in", en: "Back to log in", su: "Balik ka Log In", ar: "الرجوع لتسجيل الدخول", zh: "返回登录" },
  "auth.passwordTooShort": { default: "At least 8 characters.", en: "At least 8 characters.", su: "Sahenteuna 8 karakter.", ar: "8 أحرف على الأقل.", zh: "至少8个字符。" },
  "auth.usernameHint": {
    default: "3–24 characters: letters, numbers, underscores.",
    en: "3–24 characters: letters, numbers, underscores.",
    su: "3–24 karakter: hurup, angka, garis handap.",
    ar: "3-24 حرفًا: أحرف وأرقام وشرطات سفلية.",
    zh: "3–24个字符:字母、数字、下划线。",
  },
  "auth.emailInvalid": { default: "Enter a valid email address.", en: "Enter a valid email address.", su: "Lebetkeun alamat email nu bener.", ar: "أدخل عنوان بريد إلكتروني صحيح.", zh: "请输入有效的电子邮箱地址。" },
  "auth.failedLogin": { default: "Failed to log in.", en: "Failed to log in.", su: "Gagal asup.", ar: "فشل تسجيل الدخول.", zh: "登录失败。" },
  "auth.failedSignup": { default: "Failed to create account.", en: "Failed to create account.", su: "Gagal ngadamel akun.", ar: "فشل إنشاء الحساب.", zh: "创建账户失败。" },

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
  "achievements.unlocked": { default: "Obtenue", en: "Unlocked", su: "Kahontal", ar: "تم الحصول عليه", zh: "已解锁" },

  // ---- Log tab ----
  "log.title": { default: "Log a session.", en: "Log a session.", su: "Catet hiji sési.", ar: "سجّل جلسة.", zh: "记录一次。" },
  "log.subtitle": {
    default: "One tap records it now. Details can follow, or not.",
    en: "One tap records it now. Details can follow, or not.",
    su: "Sakali toél langsung kacatet. Rincian tiasa disusulan, atawa henteu.",
    ar: "نقرة واحدة تسجّلها الآن. يمكنك إضافة التفاصيل لاحقًا، أو لا.",
    zh: "轻点一下即可立即记录。细节可以稍后补充,也可以不补。",
  },
  "log.saveNow": { default: "Save Now", en: "Save Now", su: "Simpen Ayeuna", ar: "حفظ الآن", zh: "立即保存" },
  "log.addDetails": { default: "Add Details", en: "Add Details", su: "Tambih Rincian", ar: "إضافة تفاصيل", zh: "添加细节" },
  "log.saveError": {
    default: "Could not save this session.",
    en: "Could not save this session.",
    su: "Teu tiasa nyimpen sési ieu.",
    ar: "تعذّر حفظ هذه الجلسة.",
    zh: "无法保存此记录。",
  },
  "log.bristolType": { default: "Type Bristol", en: "Bristol Type", su: "Tipe Bristol", ar: "نوع بريستول", zh: "布里斯托类型" },
  "log.pain": { default: "Douleur ou effort", en: "Pain or straining", su: "Nyeri atawa nyeuseul", ar: "الألم أو الإجهاد", zh: "疼痛或用力程度" },
  "log.notSet": { default: "Not set", en: "Not set", su: "Teu dieusian", ar: "غير محدد", zh: "未设置" },
  "log.bloodPresent": { default: "Blood present", en: "Blood present", su: "Aya getih", ar: "وجود دم", zh: "有血迹" },
  "log.bloodFlaggedNote": {
    default: "Flagged sessions appear in your doctor export.",
    en: "Flagged sessions appear in your doctor export.",
    su: "Sési anu ditandaan bakal muncul dina ékspor dokter anjeun.",
    ar: "الجلسات المرصودة تظهر في تصدير الطبيب الخاص بك.",
    zh: "被标记的记录会出现在医生导出报告中。",
  },
  "log.saving": { default: "Saving…", en: "Saving…", su: "Nyimpen…", ar: "جارٍ الحفظ…", zh: "保存中…" },
  "log.saveDetails": { default: "Save Details", en: "Save Details", su: "Simpen Rincian", ar: "حفظ التفاصيل", zh: "保存详情" },

  // ---- Add friend ----
  "friend.addByUsername": { default: "Ajouter par nom d'utilisateur", en: "Add by username", su: "Tambih dumasar nami pamaké", ar: "أضف باسم المستخدم", zh: "按用户名添加" },
  "friend.usernamePlaceholder": { default: "nom_utilisateur", en: "username", su: "nami_pamake", ar: "اسم_المستخدم", zh: "用户名" },
  "friend.addButton": { default: "Ajouter", en: "Add", su: "Tambih", ar: "إضافة", zh: "添加" },
  "friend.sent": { default: "Friend request sent.", en: "Friend request sent.", su: "Pamundut babaturan geus dikirim.", ar: "تم إرسال طلب الصداقة.", zh: "已发送好友请求。" },
  "friend.notFound": { default: "No account with that name.", en: "No account with that name.", su: "Euweuh akun ku eta ngaran.", ar: "لا يوجد حساب بهذا الاسم.", zh: "没有找到该用户名对应的账户。" },
  "friend.cannotAddSelf": { default: "You cannot add yourself.", en: "You cannot add yourself.", su: "Anjeun teu tiasa nambihan diri sorangan.", ar: "لا يمكنك إضافة نفسك.", zh: "不能添加自己。" },
  "friend.failed": { default: "Failed to send request.", en: "Failed to send request.", su: "Gagal ngirim pamundut.", ar: "فشل إرسال الطلب.", zh: "发送请求失败。" },

  // ---- Streak pill / stat triad ----
  "streak.days": { default: "days", en: "days", su: "poé", ar: "أيام", zh: "天" },
  "streak.current": { default: "Current Streak", en: "Current Streak", su: "Runtuyan Ayeuna", ar: "التتابع الحالي", zh: "当前连续天数" },
  "streak.record": { default: "Record", en: "Record", su: "Rékor", ar: "الرقم القياسي", zh: "最高纪录" },
  "streak.graceTokens": { default: "Grace Tokens", en: "Grace Tokens", su: "Token Karinganan", ar: "رموز السماح", zh: "宽限令牌" },
  "streak.frozenUntil": { default: "Frozen until {date}", en: "Frozen until {date}", su: "Diaping dugi {date}", ar: "مجمّد حتى {date}", zh: "冻结至 {date}" },

  // ---- Gold Circle actions ----
  "gold.reserved": { default: "Reserved for Gold Circle members", en: "Reserved for Gold Circle members", su: "Dipiceun pikeun anggota Gold Circle", ar: "حصري لأعضاء الدائرة الذهبية", zh: "仅限金圈会员" },
  "gold.freezeStreak": { default: "Freeze the Streak", en: "Freeze the Streak", su: "Aping Runtuyan", ar: "تجميد التتابع", zh: "冻结连续记录" },
  "gold.recoverDay": { default: "Recover a Missed Day", en: "Recover a Missed Day", su: "Pulihkeun Poé anu Kaliwat", ar: "استرجاع يوم فائت", zh: "恢复错过的一天" },
  "gold.tag": { default: "Gold", en: "Gold", su: "Emas", ar: "ذهبي", zh: "黄金" },
  "gold.freezeReason": {
    default: "Streak Freeze is a privilege of the Gold Circle.",
    en: "Streak Freeze is a privilege of the Gold Circle.",
    su: "Aping Runtuyan mangrupa hak husus Gold Circle.",
    ar: "تجميد التتابع امتياز خاص بأعضاء الدائرة الذهبية.",
    zh: "冻结连续记录是黄金圈的专属权益。",
  },
  "gold.recoverReason": {
    default: "Recovering a missed day is a privilege of the Gold Circle.",
    en: "Recovering a missed day is a privilege of the Gold Circle.",
    su: "Mulihkeun poé anu kaliwat mangrupa hak husus Gold Circle.",
    ar: "استرجاع يوم فائت امتياز خاص بأعضاء الدائرة الذهبية.",
    zh: "恢复错过的一天是黄金圈的专属权益。",
  },
  "gold.recoverToast": {
    default: "A member of our staff has been dispatched to discreetly recover your missed day.",
    en: "A member of our staff has been dispatched to discreetly recover your missed day.",
    su: "Salah saurang staf kami parantos dikirim pikeun mulihkeun poé anjeun anu kaliwat sacara diam-diam.",
    ar: "تم إيفاد أحد موظفينا لاسترجاع يومك الفائت بكل سرية.",
    zh: "我们已派出一名工作人员悄悄为您恢复错过的那一天。",
  },

  // ---- Consistency heatmap ----
  "heatmap.eyebrow": { default: "Consistency", en: "Consistency", su: "Konsistensi", ar: "الانتظام", zh: "坚持度" },
  "heatmap.title": { default: "The last 91 days.", en: "The last 91 days.", su: "91 poé pandeuri.", ar: "آخر 91 يومًا.", zh: "最近 91 天。" },
  "heatmap.less": { default: "Moins", en: "Less", su: "Kirang", ar: "أقل", zh: "较少" },
  "heatmap.more": { default: "Plus", en: "More", su: "Langkung", ar: "أكثر", zh: "较多" },

  // ---- Bristol distribution ----
  "bristol.eyebrow": { default: "Bristol Scale", en: "Bristol Scale", su: "Skala Bristol", ar: "مقياس بريستول", zh: "布里斯托量表" },
  "bristol.title": { default: "Type distribution.", en: "Type distribution.", su: "Sebaran tipe.", ar: "توزيع الأنواع.", zh: "类型分布。" },
  "bristol.typicalRange": { default: "Types 3-4, typical range", en: "Types 3-4, typical range", su: "Tipe 3-4, rentang normal", ar: "النوعان 3-4، النطاق الطبيعي", zh: "类型 3-4,正常范围" },
  "bristol.empty": { default: "No typed entries yet.", en: "No typed entries yet.", su: "Can aya catetan anu diétikeun.", ar: "لا توجد إدخالات مصنّفة بعد.", zh: "还没有已分类的记录。" },

  // ---- Doctor export ----
  "export.title": { default: "Doctor export.", en: "Doctor export.", su: "Ékspor Dokter.", ar: "تصدير للطبيب.", zh: "医生导出报告。" },
  "export.desc": {
    default: "Totals, Bristol distribution, and every session flagged for blood or severe straining. De-identified by default.",
    en: "Totals, Bristol distribution, and every session flagged for blood or severe straining. De-identified by default.",
    su: "Total, sebaran Bristol, sarta unggal sési anu ditandaan getih atawa nyeuseul parna. Sacara standar tanpa idéntitas.",
    ar: "الإجماليات، توزيع بريستول، وكل جلسة تم رصد دم أو إجهاد شديد فيها. مجهولة الهوية افتراضيًا.",
    zh: "总计、布里斯托分布,以及所有被标记为有血或严重用力的记录。默认去标识化。",
  },
  "export.button": { default: "Export the Summary (.txt)", en: "Export the Summary (.txt)", su: "Ékspor Ringkesan (.txt)", ar: "تصدير الملخص (.txt)", zh: "导出摘要(.txt)" },
  "export.footnote": {
    default: "Written to be handed over, not to be admired.",
    en: "Written to be handed over, not to be admired.",
    su: "Ditulis pikeun disérénkeun, sanés pikeun dipikagumbira.",
    ar: "كُتب لتسليمه، لا للإعجاب به.",
    zh: "写来是为了交给医生,不是用来欣赏的。",
  },

  // ---- Freeze dialog ----
  "freeze.title": { default: "Freeze the Streak", en: "Freeze the Streak", su: "Aping Runtuyan", ar: "تجميد التتابع", zh: "冻结连续记录" },
  "freeze.badge": { default: "Gold Circle", en: "Gold Circle", su: "Gold Circle", ar: "الدائرة الذهبية", zh: "黄金圈" },
  "freeze.description": {
    default: "Choose the number of days to freeze. The streak will not break while it's frozen.",
    en: "Choose the number of days to freeze. The streak will not break while it's frozen.",
    su: "Pilih jumlah poé anu bade diaping. Runtuyan moal ruksak salami diaping.",
    ar: "اختر عدد الأيام للتجميد. لن ينكسر التتابع أثناء التجميد.",
    zh: "选择要冻结的天数。冻结期间连续记录不会中断。",
  },
  "freeze.customLabel": { default: "Custom days (1–60)", en: "Custom days (1–60)", su: "Poé kustom (1–60)", ar: "عدد أيام مخصص (1–60)", zh: "自定义天数(1–60)" },
  "freeze.confirm": { default: "Confirm", en: "Confirm", su: "Konfirmasi", ar: "تأكيد", zh: "确认" },
  "freeze.success": { default: "Streak frozen for {days} day(s).", en: "Streak frozen for {days} day(s).", su: "Runtuyan diaping salami {days} poé.", ar: "تم تجميد التتابع لمدة {days} يوم/أيام.", zh: "连续记录已冻结 {days} 天。" },
  "freeze.error": { default: "Failed to freeze streak. Try again.", en: "Failed to freeze streak. Try again.", su: "Gagal ngaping runtuyan. Cobian deui.", ar: "فشل تجميد التتابع. حاول مرة أخرى.", zh: "冻结连续记录失败,请重试。" },
  "freeze.rangeError": { default: "Enter a number of days between 1 and 60.", en: "Enter a number of days between 1 and 60.", su: "Lebetkeun jumlah poé antawis 1 sareng 60.", ar: "أدخل عدد أيام بين 1 و 60.", zh: "请输入 1 到 60 之间的天数。" },
  "freeze.close": { default: "Close", en: "Close", su: "Tutup", ar: "إغلاق", zh: "关闭" },

  // ---- Photo field / AI suggestion ----
  "photo.label": { default: "Photographie (optionnelle)", en: "Photo (optional)", su: "Poto (opsional)", ar: "صورة (اختياري)", zh: "照片(选填)" },
  "photo.hint": {
    default: "Sent once for analysis. Not stored unless you tick keep.",
    en: "Sent once for analysis. Not stored unless you tick keep.",
    su: "Dikirim sakali pikeun dianalisis. Teu disimpen iwal anjeun nyontréng \"simpen\".",
    ar: "تُرسَل مرة واحدة للتحليل. لا تُخزَّن ما لم تحدد خيار الاحتفاظ بها.",
    zh: "仅发送一次用于分析,除非勾选保留,否则不会存储。",
  },
  "photo.keep": { default: "Keep this photo (off by default)", en: "Keep this photo (off by default)", su: "Simpen poto ieu (standar mati)", ar: "الاحتفاظ بهذه الصورة (متوقف افتراضيًا)", zh: "保留此照片(默认关闭)" },
  "ai.withheld": {
    default: "The model was not confident enough to call this one. Please set the fields yourself.",
    en: "The model was not confident enough to call this one. Please set the fields yourself.",
    su: "Modél teu cukup yakin pikeun nangtukeun ieu. Mangga setél sorangan kolom-kolomna.",
    ar: "لم يكن النموذج واثقًا بما يكفي لتحديد هذا. يرجى ضبط الحقول بنفسك.",
    zh: "模型对此把握不足,请自行填写各项字段。",
  },
  "ai.confidence": { default: "Confidence:", en: "Confidence:", su: "Kayakinan:", ar: "مستوى الثقة:", zh: "置信度:" },
  "ai.suggestsPrefix": { default: "Suggests", en: "Suggests", su: "Nyarankeun", ar: "يقترح", zh: "建议为" },
  "ai.noClearType": { default: "no clear Bristol type", en: "no clear Bristol type", su: "teu aya tipe Bristol anu jelas", ar: "لا يوجد نوع بريستول واضح", zh: "没有明确的布里斯托类型" },
  "ai.visibleFoodGuess": { default: ", visible undigested food", en: ", visible undigested food", su: ", katingali tuangeun anu can dicerna", ar: "، طعام غير مهضوم ظاهر", zh: ",可见未消化食物" },
  "ai.notDiagnosis": {
    default: "This is a pattern-recognition aid, not a diagnosis. Please confirm or correct the fields above.",
    en: "This is a pattern-recognition aid, not a diagnosis. Please confirm or correct the fields above.",
    su: "Ieu alat bantosan pengenalan pola, sanés diagnosis. Mangga konfirmasi atawa ropéa kolom di luhur.",
    ar: "هذه أداة مساعدة للتعرف على الأنماط، وليست تشخيصًا. يرجى تأكيد أو تصحيح الحقول أعلاه.",
    zh: "这只是一种规律识别辅助工具,并非诊断。请确认或更正上方字段。",
  },

  // ---- Celebration modal ----
  "celebration.title": { default: "Achievement unlocked", en: "Achievement unlocked", su: "Prestasi Kahontal", ar: "تم فتح وسام", zh: "解锁成就" },
  "celebration.unlocked": { default: "{name} obtenue", en: "{name} unlocked", su: "{name} kahontal", ar: "تم الحصول على {name}", zh: "已解锁 {name}" },
  "celebration.ok": { default: "Bien.", en: "Nice.", su: "Saé.", ar: "رائع.", zh: "好的。" },

  // ---- Fixed vocabularies: colors, odors, pain, symptoms ----
  "color.brown": { default: "Brown (typical)", en: "Brown (typical)", su: "Coklat (biasa)", ar: "بني (طبيعي)", zh: "棕色(正常)" },
  "color.dark-brown": { default: "Dark brown", en: "Dark brown", su: "Coklat Kolot", ar: "بني داكن", zh: "深棕色" },
  "color.green": { default: "Green", en: "Green", su: "Hejo", ar: "أخضر", zh: "绿色" },
  "color.yellow": { default: "Yellow", en: "Yellow", su: "Konéng", ar: "أصفر", zh: "黄色" },
  "color.pale": { default: "Pale / clay", en: "Pale / clay", su: "Pias / siga taneuh liat", ar: "شاحب / طيني", zh: "苍白 / 陶土色" },
  "color.black": { default: "Black", en: "Black", su: "Hideung", ar: "أسود", zh: "黑色" },
  "color.red": { default: "Red", en: "Red", su: "Beureum", ar: "أحمر", zh: "红色" },
  "odor.typical": { default: "Typical", en: "Typical", su: "Biasa", ar: "طبيعية", zh: "正常" },
  "odor.mild": { default: "Milder than usual", en: "Milder than usual", su: "Langkung lembut ti biasana", ar: "أخف من المعتاد", zh: "比平时轻" },
  "odor.strong": { default: "Stronger than usual", en: "Stronger than usual", su: "Langkung seungit ti biasana", ar: "أقوى من المعتاد", zh: "比平时重" },
  "odor.severe": { default: "Much stronger than usual", en: "Much stronger than usual", su: "Langkung seungit pisan ti biasana", ar: "أقوى بكثير من المعتاد", zh: "比平时重很多" },
  "pain.none": { default: "None", en: "None", su: "Euweuh", ar: "لا يوجد", zh: "无" },
  "pain.mild": { default: "Mild", en: "Mild", su: "Rada", ar: "خفيف", zh: "轻微" },
  "pain.moderate": { default: "Moderate", en: "Moderate", su: "Sedeng", ar: "متوسط", zh: "中度" },
  "pain.severe": { default: "Severe", en: "Severe", su: "Parah", ar: "شديد", zh: "严重" },
  "symptom.bloating": { default: "Bloating", en: "Bloating", su: "Kembung", ar: "انتفاخ", zh: "腹胀" },
  "symptom.urgency": { default: "Urgency", en: "Urgency", su: "Kabelet", ar: "إلحاح", zh: "急迫感" },
  "symptom.incomplete": { default: "Incomplete evacuation", en: "Incomplete evacuation", su: "Teu réngsé lengkep", ar: "إفراغ غير كامل", zh: "排便不尽" },
  "symptom.cramping": { default: "Cramping", en: "Cramping", su: "Mulesan", ar: "تشنّج", zh: "痉挛" },

  // ---- Badge names + descriptions (server sends fixed English strings;
  // these keys let the client re-render them per language by badge id) ----
  "badge.milestone_first.name": { default: "First Log", en: "First Log", su: "Catetan Munggaran", ar: "أول تسجيل", zh: "首次记录" },
  "badge.milestone_first.desc": { default: "Logged your first session.", en: "Logged your first session.", su: "Nyatet sési munggaran anjeun.", ar: "سجّلت جلستك الأولى.", zh: "记录了你的第一次。" },
  "badge.streak_7.name": { default: "Week Warrior", en: "Week Warrior", su: "Jawara Saminggu", ar: "محارب الأسبوع", zh: "一周勇士" },
  "badge.streak_7.desc": { default: "7-day streak.", en: "7-day streak.", su: "Runtuyan 7 poé.", ar: "تتابع 7 أيام.", zh: "连续 7 天。" },
  "badge.streak_30.name": { default: "Month Machine", en: "Month Machine", su: "Mesin Sabulan", ar: "آلة الشهر", zh: "月度机器" },
  "badge.streak_30.desc": { default: "30-day streak.", en: "30-day streak.", su: "Runtuyan 30 poé.", ar: "تتابع 30 يومًا.", zh: "连续 30 天。" },
  "badge.streak_100.name": { default: "Centurion", en: "Centurion", su: "Séntutrion", ar: "المئوي", zh: "百日勇士" },
  "badge.streak_100.desc": { default: "100-day streak.", en: "100-day streak.", su: "Runtuyan 100 poé.", ar: "تتابع 100 يوم.", zh: "连续 100 天。" },
  "badge.streak_365.name": { default: "Year One", en: "Year One", su: "Taun Kahiji", ar: "السنة الأولى", zh: "第一年" },
  "badge.streak_365.desc": { default: "365-day streak.", en: "365-day streak.", su: "Runtuyan 365 poé.", ar: "تتابع 365 يومًا.", zh: "连续 365 天。" },
  "badge.completeness_10.name": { default: "Thorough", en: "Thorough", su: "Taliti", ar: "دقيق", zh: "细致入微" },
  "badge.completeness_10.desc": { default: "10 full analyses logged.", en: "10 full analyses logged.", su: "10 analisis lengkep kacatet.", ar: "تم تسجيل 10 تحليلات كاملة.", zh: "已记录 10 次完整分析。" },
  "badge.completeness_50.name": { default: "Data Nerd", en: "Data Nerd", su: "Kutu Data", ar: "خبير البيانات", zh: "数据控" },
  "badge.completeness_50.desc": { default: "50 full analyses logged.", en: "50 full analyses logged.", su: "50 analisis lengkep kacatet.", ar: "تم تسجيل 50 تحليلًا كاملًا.", zh: "已记录 50 次完整分析。" },
  "badge.milestone_100_sessions.name": { default: "Triple Digits", en: "Triple Digits", su: "Tilu Digit", ar: "ثلاثة أرقام", zh: "三位数" },
  "badge.milestone_100_sessions.desc": { default: "100 sessions logged.", en: "100 sessions logged.", su: "100 sési kacatet.", ar: "تم تسجيل 100 جلسة.", zh: "已记录 100 次。" },
  "badge.milestone_first_photo.name": { default: "Say Cheese", en: "Say Cheese", su: "Bilang Cis", ar: "ابتسم للكاميرا", zh: "笑一个" },
  "badge.milestone_first_photo.desc": { default: "First AI-analyzed photo.", en: "First AI-analyzed photo.", su: "Poto munggaran anu dianalisis AI.", ar: "أول صورة تم تحليلها بالذكاء الاصطناعي.", zh: "第一张 AI 分析的照片。" },

  // ---- Gold Circle paywall (dummy) ----
  "paywall.title": { default: "The Gold Circle", en: "The Gold Circle", su: "Gold Circle", ar: "الدائرة الذهبية", zh: "黄金圈" },
  "paywall.monthly": { default: "Monthly", en: "Monthly", su: "Sabulanan", ar: "شهريًا", zh: "月付" },
  "paywall.annual": { default: "Annual", en: "Annual", su: "Sataunan", ar: "سنويًا", zh: "年付" },
  "paywall.bestValue": { default: "Best value", en: "Best value", su: "Paling untung", ar: "أفضل قيمة", zh: "最优惠" },
  "paywall.perk1": { default: "Unlimited streak freezes, for the travelling connoisseur", en: "Unlimited streak freezes, for the travelling connoisseur", su: "Aping runtuyan tanpa wates, pikeun anu sering lelana", ar: "تجميد غير محدود للتتابع، للمسافر المتذوق", zh: "无限次冻结连续记录,专为常旅行者设计" },
  "paywall.perk2": { default: "Missed-day recovery, discreetly arranged", en: "Missed-day recovery, discreetly arranged", su: "Pemulihan poé anu kaliwat, diatur sacara diam-diam", ar: "استرجاع الأيام الفائتة، بترتيب سرّي", zh: "错过的日子悄悄为你恢复" },
  "paywall.perk3": { default: "A mark beside your name, so the Circle knows", en: "A mark beside your name, so the Circle knows", su: "Tanda gigireun ngaran anjeun, sangkan Lingkaran nyaho", ar: "علامة بجانب اسمك، ليعرف الجميع في الدائرة", zh: "名字旁的专属标记,让圈子里的人都知道" },
  "paywall.cardNumber": { default: "Card number", en: "Card number", su: "Nomer Kartu", ar: "رقم البطاقة", zh: "卡号" },
  "paywall.expiry": { default: "Expiry", en: "Expiry", su: "Kadaluwarsa", ar: "تاريخ الانتهاء", zh: "有效期" },
  "paywall.cvc": { default: "CVC", en: "CVC", su: "CVC", ar: "رمز التحقق CVC", zh: "安全码" },
  "paywall.join": { default: "Join the Gold Circle: {price}", en: "Join the Gold Circle: {price}", su: "Gabung Gold Circle: {price}", ar: "انضم إلى الدائرة الذهبية: {price}", zh: "加入黄金圈:{price}" },
  "paywall.welcome": { default: "Welcome to the Gold Circle", en: "Welcome to the Gold Circle", su: "Wilujeng sumping di Gold Circle", ar: "مرحبًا بك في الدائرة الذهبية", zh: "欢迎加入黄金圈" },
  "paywall.disclaimer": {
    default: "This is a demo paywall for a satirical app. No card is real, no payment is processed, and nothing is charged. Any details entered here go nowhere.",
    en: "This is a demo paywall for a satirical app. No card is real, no payment is processed, and nothing is charged. Any details entered here go nowhere.",
    su: "Ieu paywall démo pikeun aplikasi satire. Euweuh kartu anu nyata, euweuh pambayaran anu diprosés, sarta euweuh anu dicaj. Rincian anu dilebetkeun di dieu teu kamana-mana.",
    ar: "هذه بوابة دفع تجريبية لتطبيق ساخر. لا توجد بطاقة حقيقية، ولا تتم معالجة أي دفعة، ولا يُخصم شيء. أي تفاصيل تُدخل هنا لا تذهب إلى أي مكان.",
    zh: "这是一款讽刺应用的演示付费墙。没有真实卡号,不处理任何付款,也不会产生任何扣费。此处输入的信息不会发送到任何地方。",
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

// Server-driven fixed vocabularies (colors/odors/pain/symptoms/badge ids)
// arrive as raw English-ish strings from the API. These helpers re-derive
// the display label from the id instead, so switching languages actually
// changes them. Falls back to the raw server value for any id not in the
// dictionary (keeps this forward-compatible with new badges etc.).
export function translateEnumLabel(
  lang: LangCode,
  category: "color" | "odor" | "pain" | "symptom",
  value: string,
  fallback: string
): string {
  const key = `${category}.${value}`;
  const entry = STRINGS[key];
  if (!entry) return fallback;
  return entry[lang] ?? entry.default ?? fallback;
}

export function translateBadgeText(
  lang: LangCode,
  badgeId: string,
  field: "name" | "desc",
  fallback: string
): string {
  const key = `badge.${badgeId}.${field}`;
  const entry = STRINGS[key];
  if (!entry) return fallback;
  return entry[lang] ?? entry.default ?? fallback;
}
