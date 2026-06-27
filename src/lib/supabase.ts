import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Determine if we should use mock mode
const isMockMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isMockMode) {
  console.log(
    '⚠️ [ETRA Portal] Supabase keys not detected. Running in Offline Mock Mode with seeded local database.'
  );
}

// Helper to generate UUIDs safely
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Local storage database helpers
const getLocalData = (key: string): any[] => {
  const data = localStorage.getItem(`etra_db_${key}`);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (key: string, data: any[]) => {
  localStorage.setItem(`etra_db_${key}`, JSON.stringify(data));
};

// ── SEED DATA DEFINITIONS ─────────────────────────────────────────
const seedDatabase = () => {
  console.log('🌱 Seeding mock database in localStorage...');

  // 1. Users & Profiles
  const users = [
    { id: '00000000-0000-0000-0000-000000000001', email: 'rayan@etra.sa', password: 'Admin@ETRA2024', full_name: 'ريان البلاوي', role: 'admin' },
    { id: '00000000-0000-0000-0000-000000000002', email: 'laujeen@etra.sa', password: 'Trainee@2024', full_name: 'لوجين محمد', role: 'trainee' },
    { id: '00000000-0000-0000-0000-000000000003', email: 'shaza@etra.sa', password: 'Trainee@2024', full_name: 'شذى عبد الله', role: 'trainee' },
    { id: '00000000-0000-0000-0000-000000000004', email: 'raghad@etra.sa', password: 'Trainee@2024', full_name: 'رغد علي', role: 'trainee' },
  ];
  setLocalData('_users', users);

  const profiles = users.map(u => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  setLocalData('profiles', profiles);

  // 2. Training Weeks
  const weeks = [
    { id: '11111111-1111-1111-1111-111111111111', week_number: 1, title_ar: 'الأساسيّات ومفاهيم الدعم الفني العامّة', title_en: 'Week 1: Fundamentals of Technical Support', description_ar: 'تأسيس شامل في مفاهيم الدعم الفني، وعتاد الحاسوب وتجميعه والتعرف على الأعطال الشائعة.', is_locked: false, unlock_date: null, created_at: new Date().toISOString() },
    { id: '11111111-1111-1111-1111-111111111112', week_number: 2, title_ar: 'أنظمة التشغيل وتثبيت البرمجيات وإعدادها', title_en: 'Week 2: Operating Systems & Software Setup', description_ar: 'طريقة تثبيت وإعداد أنظمة التشغيل المختلفة وخصوصاً Windows 10/11 وإدارة الصلاحيات والمستخدمين.', is_locked: false, unlock_date: null, created_at: new Date().toISOString() },
    { id: '11111111-1111-1111-1111-111111111113', week_number: 3, title_ar: 'شبكات الحاسب وصيانتها واستكشاف مشكلاتها', title_en: 'Week 3: Computer Networks & Troubleshooting', description_ar: 'فهم بروتوكول TCP/IP، وإعداد العناوين ومعدات الشبكة، وكيفية استخدام أدوات الفحص وحل مشكلات الاتصال.', is_locked: false, unlock_date: null, created_at: new Date().toISOString() },
    { id: '11111111-1111-1111-1111-111111111114', week_number: 4, title_ar: 'نظام إدارة التذاكر والتعامل الاحترافي مع العملاء', title_en: 'Week 4: Helpdesk Ticket Management & Soft Skills', description_ar: 'التدريب على استقبال التذاكر وتحليلها وتصنيفها وحلها وفق اتفاقية مستوى الخدمة (SLA)، ومهارات التواصل الفعال.', is_locked: false, unlock_date: null, created_at: new Date().toISOString() }
  ];
  setLocalData('training_weeks', weeks);

  // 3. Modules
  const modules = [
    { id: '22222222-2222-2222-2222-222222222221', week_id: '11111111-1111-1111-1111-111111111111', title_ar: 'مفهوم الدعم الفني وأدوار الدعم التقني', title_en: 'Introduction & Support Roles', description_ar: 'دراسة أهمية الدعم الفني في الشركات وهيكل فريق الدعم.', order_index: 1, created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-222222222222', week_id: '11111111-1111-1111-1111-111111111111', title_ar: 'عتاد الحاسب الآلي والمكونات الداخلية للأجهزة', title_en: 'Computer Hardware & Core Assembly', description_ar: 'تحديد وفحص وتجميع القطع الداخلية وتحديثها.', order_index: 2, created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-222222222223', week_id: '11111111-1111-1111-1111-111111111112', title_ar: 'تثبيت وإعداد نظام Windows 10/11 وإدارته', title_en: 'Windows Installation & Admin Management', description_ar: 'تثبيت نظيف لويندوز، إعداد حسابات الموظفين وإدارة الصلاحيات وتفعيل جدار الحماية.', order_index: 1, created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-222222222224', week_id: '11111111-1111-1111-1111-111111111113', title_ar: 'مبادئ الشبكات وإعداد عناوين الـ IP وأدوات الفحص', title_en: 'Networking Principles & IP Tools', description_ar: 'تعلم تقسيم الشبكات وفهم الـ DNS والـ DHCP، واستخدام سطر الأوامر لتشخيص أعطال الشبكة.', order_index: 1, created_at: new Date().toISOString() },
    { id: '22222222-2222-2222-2222-222222222225', week_id: '11111111-1111-1111-1111-111111111114', title_ar: 'دورة حياة التذكرة الفنية والتعامل مع طلبات الموظفين', title_en: 'Ticket Lifecycle & User Support', description_ar: 'محاكاة كاملة لاستقبال التذاكر وتحديث حالتها وحلها وتقييم الرضا.', order_index: 1, created_at: new Date().toISOString() }
  ];
  setLocalData('modules', modules);

  // 4. Lessons
  const lessons = [
    // Module 1
    { id: '33333333-3333-3333-3333-333333333331', module_id: '22222222-2222-2222-2222-222222222221', title_ar: 'مفهوم الدعم الفني ومستوياته (L1, L2, L3)', title_en: 'Support Concepts & Levels', content_ar: 'يتناول هذا الدرس الهيكل التنظيمي لقسم الدعم التقني في المنشآت والفرق بين مستويات الدعم المختلفة:\n- الدعم من المستوى الأول (L1): استقبال البلاغات وتصنيفها وحل المشكلات البسيطة مثل إعادة تعيين كلمة المرور.\n- الدعم من المستوى الثاني (L2): حل المشكلات التقنية الأكثر تعقيداً مثل أعطال البرمجيات وتثبيت الأنظمة.\n- الدعم من المستوى الثالث (L3): يختص بالمشكلات البرمجية العميقة أو البنية التحتية ويتم بالتنسيق مع المطورين أو مهندسي الشبكات الكبار.', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 15, order_index: 1, is_published: true, objectives_ar: 'فهم أدوار مستويات الدعم وهيكلية الأقسام التقنية.', practical_activity_ar: 'قم برسم مخطط يوضح مسار تذكرة تبدأ من بلاغ مستخدم وتنتهي بحلها في المستوى الثاني.', created_at: new Date().toISOString() },
    { id: '33333333-3333-3333-3333-333333333332', module_id: '22222222-2222-2222-2222-222222222221', title_ar: 'المهارات الأساسية لأخصائي الدعم الفني التقني', title_en: 'Core Technical Support Skills', content_ar: 'يتعلم المتدرب في هذا الدرس المهارات التقنية وغير التقنية (Soft Skills) المطلوبة للنجاح في سوق العمل:\n- مهارات الاستماع الفعال وطرح الأسئلة الذكية لتشخيص العطل الفعلي.\n- كيفية توثيق الحلول وبناء قاعدة المعرفة (Knowledge Base).\n- إدارة الوقت وتحديد أولويات المشاكل بناءً على الأثر والسرعة المطلوبة للتجاوب.', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 20, order_index: 2, is_published: true, objectives_ar: 'اكتساب مهارة كتابة التقارير وتشخيص المشاكل بدقة.', practical_activity_ar: 'كتابة تقرير توثيقي لحل مشكلة توقف مفاجئ لجهاز موظف.', created_at: new Date().toISOString() },
    
    // Module 2
    { id: '33333333-3333-3333-3333-333333333333', module_id: '22222222-2222-2222-2222-222222222222', title_ar: 'مكونات اللوحة الأم (Motherboard) والمعالج (CPU)', title_en: 'Motherboard & CPU Analysis', content_ar: 'شرح مفصل لمكونات اللوحة الأم:\n- منافذ الذاكرة العشوائية (RAM Slots).\n- مقبس المعالج (CPU Socket).\n- موصلات الطاقة ومنافذ التوسعة (PCIe).\n- كيفية اختيار اللوحة الأم المتوافقة مع المعالج ونوع الذاكرة.', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 25, order_index: 1, is_published: true, objectives_ar: 'التعرف على اللوحة الأم وتوافق القطع الداخلية.', practical_activity_ar: 'باستخدام المحاكي، قم بتركيب المعالج في المقبس وتثبيت المبرد بشكل صحيح.', created_at: new Date().toISOString() },
    { id: '33333333-3333-3333-3333-333333333334', module_id: '22222222-2222-2222-2222-222222222222', title_ar: 'صيانة وفحص الذاكرة العشوائية (RAM) ووحدات التخزين', title_en: 'RAM & Storage Troubleshooting', content_ar: 'التعرف على أنواع وحدات التخزين (HDD vs SSD vs NVMe) والذاكرة العشوائية DDR4/DDR5 وكيفية تشخيص أعطالها:\n- أعراض تلف الذاكرة (صفارات الخطأ عند الإقلاع، الشاشة الزرقاء المتكررة).\n- استخدام أدوات فحص القرص الصلب وتحديد القطاعات التالفة (Bad Sectors).', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 30, order_index: 2, is_published: true, objectives_ar: 'تشخيص أعطال الرام والأقراص الصلبة وصيانتها.', practical_activity_ar: 'تشغيل أداة فحص الذاكرة لويندوز وتفسير النتائج.', created_at: new Date().toISOString() },
    
    // Module 3
    { id: '33333333-3333-3333-3333-333333333335', module_id: '22222222-2222-2222-2222-222222222223', title_ar: 'تثبيت نظام ويندوز 10/11 وإعداد حسابات الموظفين', title_en: 'Windows Installation & Accounts', content_ar: 'شرح طريقة إعداد فلاش ميموري للإقلاع وتثبيت ويندوز بشكل نظيف، بالإضافة إلى:\n- إنشاء حسابات مستخدمين محليين وأعضاء في المجموعات (Administrators vs Standard Users).\n- إعداد الصلاحيات على المجلدات وتأمين الملفات باستخدام نظام NTFS.', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 30, order_index: 1, is_published: true, objectives_ar: 'تثبيت نظام التشغيل وإدارة صلاحيات الموظفين بشكل آمن.', practical_activity_ar: 'إنشاء حساب مستخدم قياسي جديد باسم (EtraUser) ومنعه من الوصول لملفات النظام.', created_at: new Date().toISOString() },
    
    // Module 4
    { id: '33333333-3333-3333-3333-333333333336', module_id: '22222222-2222-2222-2222-222222222224', title_ar: 'بروتوكول TCP/IP وإعداد العناوين يدوياً وتلقائياً', title_en: 'TCP/IP & IP Addressing', content_ar: 'دراسة عناوين IP وقناع الشبكة (Subnet Mask) والبوابة الافتراضية (Default Gateway):\n- الفرق بين إعداد العنوان يدوياً (Static IP) وتلقائياً عبر الـ DHCP.\n- فهم دور الـ DNS في تحويل أسماء النطاقات إلى عناوين IP.', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 25, order_index: 1, is_published: true, objectives_ar: 'تكوين إعدادات اتصال الشبكة يدوياً وتلقائياً.', practical_activity_ar: 'تغيير إعدادات الشبكة لجهازك لتستقبل عنوان IP ثابت متوافق مع شبكة المكتب.', created_at: new Date().toISOString() },
    
    // Module 5
    { id: '33333333-3333-3333-3333-333333333337', module_id: '22222222-2222-2222-2222-222222222225', title_ar: 'إدارة دورة حياة التذاكر الفنية وحساب أوقات الـ SLA', title_en: 'Ticket Lifecycle & SLA Calculations', content_ar: 'يتناول هذا الدرس العملي طريقة استقبال البلاغات وتوثيقها بالتفصيل:\n- تصنيف التذاكر (برمجيات، عتاد، شبكات، حسابات).\n- تحديد الأولوية (حرجة، عالية، متوسطة، منخفضة) وفقاً للأثر على العمل.\n- حساب وقت الاستجابة ووقت الحل المعتمد في اتفاقية مستوى الخدمة (SLA).', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration_minutes: 20, order_index: 1, is_published: true, objectives_ar: 'العمل باحترافية وفق معايير الدعم الفني العالمية وحساب مؤشرات الأداء.', practical_activity_ar: 'معالجة تذكرة جديدة وإحالتها للمستوى الثاني وتحديث حالتها إلى (قيد التحليل).', created_at: new Date().toISOString() }
  ];
  setLocalData('lessons', lessons);

  // 5. Lesson Progress (Empty initially)
  setLocalData('lesson_progress', []);

  // 6. Quizzes
  const quizzes = [
    { id: '44444444-4444-4444-4444-444444444441', module_id: '22222222-2222-2222-2222-222222222221', title_ar: 'اختبار مفاهيم الدعم الفني ومستوياته', passing_score: 70, time_limit_minutes: 10, max_attempts: 3, is_randomized: false, show_feedback: true, is_published: true },
    { id: '44444444-4444-4444-4444-444444444442', module_id: '22222222-2222-2222-2222-222222222222', title_ar: 'اختبار تجميع وصيانة عتاد الحاسب الآلي', passing_score: 80, time_limit_minutes: 15, max_attempts: 3, is_randomized: false, show_feedback: true, is_published: true },
    { id: '44444444-4444-4444-4444-444444444443', module_id: '22222222-2222-2222-2222-222222222223', title_ar: 'اختبار تثبيت ويندوز وإدارة الصلاحيات', passing_score: 70, time_limit_minutes: 10, max_attempts: 3, is_randomized: false, show_feedback: true, is_published: true },
    { id: '44444444-4444-4444-4444-444444444444', module_id: '22222222-2222-2222-2222-222222222224', title_ar: 'اختبار إعدادات الشبكة وتشخيص الأعطال', passing_score: 80, time_limit_minutes: 15, max_attempts: 3, is_randomized: false, show_feedback: true, is_published: true },
  ];
  setLocalData('quizzes', quizzes);

  // 7. Quiz Questions
  const questions = [
    // Quiz 1 (Intro)
    { id: '55555555-5555-5555-5555-555555555511', quiz_id: '44444444-4444-4444-4444-444444444441', question_text_ar: 'موظف يواجه مشكلة في نسيان كلمة المرور الخاصة بجهازه. أي من مستويات الدعم الفني يجب أن يتولى هذه التذكرة بشكل رئيسي؟', question_type: 'scenario', scenario_context_ar: 'سيناريو: استقبال مكالمة عاجلة من موظف الإدارة المالية يطلب إعادة تعيين كلمة المرور فوراً لبدء الرواتب.', points: 10, order_index: 1 },
    { id: '55555555-5555-5555-5555-555555555512', quiz_id: '44444444-4444-4444-4444-444444444441', question_text_ar: 'يتكون الدعم الفني L2 من خبراء الشبكات ومطوري النظام الأصليين فقط.', question_type: 'truefalse', scenario_context_ar: null, points: 5, order_index: 2 },
    { id: '55555555-5555-5555-5555-555555555513', quiz_id: '44444444-4444-4444-4444-444444444441', question_text_ar: 'رتب خطوات تشخيص عطل فني بشكل منطقي من البداية إلى الحل والتوثيق:', question_type: 'ordering', scenario_context_ar: 'ترتيب الخطوات الصحيحة لحل المشاكل التقنية.', points: 10, order_index: 3 },

    // Quiz 2 (Hardware)
    { id: '55555555-5555-5555-5555-555555555521', quiz_id: '44444444-4444-4444-4444-444444444442', question_text_ar: 'عند تشغيل جهاز حاسب آلي، تسمع صفارات متقطعة سريعة ولا تظهر أي صورة على الشاشة. ما هو المكون الداخلي المرجح تسببه في هذه المشكلة؟', question_type: 'scenario', scenario_context_ar: 'سيناريو: جهاز مكتب تم نقله لمكتب جديد، وعند التشغيل تظهر صفارات إنذار متكررة مع شاشة سوداء.', points: 10, order_index: 1 }
  ];
  setLocalData('quiz_questions', questions);

  // 8. Quiz Options
  const options = [
    // Quiz 1 Question 1 (L1)
    { id: '66666666-6666-6666-6666-666666666111', question_id: '55555555-5555-5555-5555-555555555511', option_text_ar: 'الدعم من المستوى الأول (L1)', is_correct: true, explanation_ar: 'إعادة تعيين كلمات المرور هي مهمة روتينية وتصنف كدعم مستوى أول L1.', order_index: 1 },
    { id: '66666666-6666-6666-6666-666666666112', question_id: '55555555-5555-5555-5555-555555555511', option_text_ar: 'الدعم من المستوى الثاني (L2)', is_correct: false, explanation_ar: 'المستوى الثاني يختص بالأعطال البرمجية والعتادية التي تتطلب زيارة أو فحص أعمق.', order_index: 2 },
    { id: '66666666-6666-6666-6666-666666666113', question_id: '55555555-5555-5555-5555-555555555511', option_text_ar: 'الدعم من المستوى الثالث (L3)', is_correct: false, explanation_ar: 'المستوى الثالث يختص بأعطال السيرفرات والتعديل البرمجي على الأنظمة.', order_index: 3 },
    
    // Quiz 1 Question 2 (True/False)
    { id: '66666666-6666-6666-6666-666666666121', question_id: '55555555-5555-5555-5555-555555555512', option_text_ar: 'خطأ', is_correct: true, explanation_ar: 'الدعم L2 يضم فنيين مختصين بالدعم الميداني وصيانة القطع وتثبيت البرمجيات، بينما L3 هو الذي يضم المطورين ومهندسي البنية التحتية.', order_index: 1 },
    { id: '66666666-6666-6666-6666-666666666122', question_id: '55555555-5555-5555-5555-555555555512', option_text_ar: 'صح', is_correct: false, explanation_ar: 'الدعم L3 هو الذي يحتوي على مهندسي السيرفرات والمطورين.', order_index: 2 },

    // Quiz 1 Question 3 (Ordering Options)
    { id: '66666666-6666-6666-6666-666666666131', question_id: '55555555-5555-5555-5555-555555555513', option_text_ar: '1. جمع المعلومات وسؤال المستخدم وتحديد المشكلة بدقة', is_correct: true, explanation_ar: null, order_index: 1 },
    { id: '66666666-6666-6666-6666-666666666132', question_id: '55555555-5555-5555-5555-555555555513', option_text_ar: '2. صياغة فرضيات حول سبب المشكلة واختبارها تدريجياً', is_correct: true, explanation_ar: null, order_index: 2 },
    { id: '66666666-6666-6666-6666-666666666133', question_id: '55555555-5555-5555-5555-555555555513', option_text_ar: '3. تطبيق الحل المناسب للفرضية الناجحة والتحقق من زوال العطل', is_correct: true, explanation_ar: null, order_index: 3 },
    { id: '66666666-6666-6666-6666-666666666134', question_id: '55555555-5555-5555-5555-555555555513', option_text_ar: '4. توثيق المشكلة وحلها في قاعدة البيانات الفنية لتسريع حلها مستقبلاً', is_correct: true, explanation_ar: null, order_index: 4 },

    // Quiz 2 Question 1 (Hardware problem)
    { id: '66666666-6666-6666-6666-666666666211', question_id: '55555555-5555-5555-5555-555555555521', option_text_ar: 'الذاكرة العشوائية (RAM) — قد تكون تحركت من مكانها أو تالفة', is_correct: true, explanation_ar: 'الصفارات المتقطعة المتكررة والشاشة السوداء تشير في الغالب إلى مشكلة في فحص الذاكرة (RAM Check) أثناء عملية الإقلاع الذاتي الـ POST.', order_index: 1 },
    { id: '66666666-6666-6666-6666-666666666212', question_id: '55555555-5555-5555-5555-555555555521', option_text_ar: 'القرص الصلب (HDD/SSD)', is_correct: false, explanation_ar: 'مشاكل القرص الصلب تظهر رسالة على الشاشة مثل No Boot Device found ولا تعطي صفارات متواصلة.', order_index: 2 },
    { id: '66666666-6666-6666-6666-666666666213', question_id: '55555555-5555-5555-5555-555555555521', option_text_ar: 'مزود الطاقة (Power Supply)', is_correct: false, explanation_ar: 'عطل مزود الطاقة يجعل الجهاز لا يقلع ولا يصدر أي صوت أو إضاءة إطلاقاً.', order_index: 3 }
  ];
  setLocalData('quiz_options', options);

  // 9. Quiz Attempts (Empty initially)
  setLocalData('quiz_attempts', []);
  setLocalData('quiz_answers', []);

  // 10. Assignments
  const assignments = [
    { id: '77777777-7777-7777-7777-777777777771', week_id: '11111111-1111-1111-1111-111111111111', title_ar: 'الواجب الأول: تحديد عتاد جهاز مكتب وتوثيق الأعطال', instructions_ar: 'المطلوب في هذا الواجب هو كتابة تقرير فني من صفحتين يتناول:\n1. مواصفات جهاز مكتبي متكامل مناسب لموظف خدمة عملاء (المعالج، الرام، التخزين، المذربرد).\n2. تحديد 3 أعراض مختلفة تشير إلى تلف الرام أو مزود الطاقة أو ارتفاع حرارة المعالج، وكيفية التعامل مع كل حالة.\nيرجى تسليم التقرير بصيغة نصية أو إرفاق ملف PDF.', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), max_score: 100, submission_type: 'both', is_published: true, created_at: new Date().toISOString() },
    { id: '77777777-7777-7777-7777-777777777772', week_id: '11111111-1111-1111-1111-111111111112', title_ar: 'الواجب الثاني: إعداد صلاحيات نظام ويندوز وخطة النسخ الاحتياطي', instructions_ar: 'قم بوصف الخطوات التفصيلية بالصور لإنشاء مستخدم محلي وإضافة الصلاحيات للمجلدات في نظام Windows باستخدام نظام الملفات NTFS. حدد ما هو المجلد المشترك وكيفية تشفير ملفات المستخدم.', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), max_score: 100, submission_type: 'text', is_published: true, created_at: new Date().toISOString() }
  ];
  setLocalData('assignments', assignments);
  setLocalData('assignment_submissions', []);

  // 11. Tickets (Real practice tickets)
  const tickets = [
    { id: '88888888-8888-8888-8888-888888888881', ticket_number: 101, title_ar: 'شاشة زرقاء متكررة (BSOD) عند تشغيل التطبيقات الثقيلة', description_ar: 'السلام عليكم، يظهر لي شريط خطأ أزرق برمز WHEA_UNCORRECTABLE_ERROR ويعيد الجهاز التشغيل فجأة أثناء العمل على برامج التصميم. هذا يعطل عملي اليومي بشكل كامل.', requester_name: 'سارة خالد', requester_department: 'التصميم الجرافيكي', device_name: 'ETRA-DSG-05', category: 'hardware', priority: 'critical', status: 'assigned', assigned_to: '00000000-0000-0000-0000-000000000002', created_by: '00000000-0000-0000-0000-000000000002', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: null, expected_diagnosis_ar: 'ارتفاع درجة حرارة المعالج بسبب تلف المبرد أو عطل في الذاكرة العشوائية (RAM).', expected_steps_ar: '1. فتح الجهاز وتنظيف المروحة.\n2. تغيير المعجون الحراري للمعالج.\n3. إجراء فحص للذاكرة بأداة Windows Memory Diagnostic.', expected_resolution_ar: 'تنظيف المبرد وتغيير المعجون الحراري يحل مشكلة ارتفاع الحرارة نهائياً.', grading_rubric_ar: 'تشخيص الحرارة: 30 درجة، خطوات الفحص: 40 درجة، طريقة الحل والتوثيق: 30 درجة.', created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    { id: '88888888-8888-8888-8888-888888888882', ticket_number: 102, title_ar: 'تعذر الاتصال بالطابعة الشبكية المشتركة في القسم', description_ar: 'نحاول طباعة العقود والمستندات اليومية ولكن تظهر رسالة خطأ بأن الطابعة غير متصلة بالشبكة، رغم أن اللمبة خضراء في جهاز الطابعة نفسه.', requester_name: 'عبد الرحمن النجار', requester_department: 'الموارد البشرية', device_name: 'HP-LJ-M402DN', category: 'printer', priority: 'medium', status: 'new', assigned_to: null, created_by: null, due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: null, expected_diagnosis_ar: 'تغير عنوان IP الخاص بالطابعة أو تعطل خادم الـ DHCP في إعطاء عنوان صحيح.', expected_steps_ar: '1. طباعة صفحة معلومات الطابعة لمعرفة عنوان الـ IP الحالي.\n2. عمل Ping للعنوان للتأكد من وصول الشبكة له.\n3. إعادة إضافة الطابعة في أجهزة الموظفين بالعنوان الجديد.', expected_resolution_ar: 'تثبيت عنوان IP ثابت (Static IP) للطابعة في الشبكة لتفادي تغيره مستقبلاً.', grading_rubric_ar: 'فحص IP الطابعة: 40 درجة، اختبار الاتصال Ping: 30 درجة، تثبيت الـ IP: 30 درجة.', created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: '88888888-8888-8888-8888-888888888883', ticket_number: 103, title_ar: 'انقطاع تام للإنترنت والوصول للمجلد المشترك في قسم المحاسبة', description_ar: 'توقف الاتصال فجأة بالإنترنت ولا نستطيع الوصول لنظام السيرفر المشترك لعرض القيود، تظهر علامة تعجب صفراء على أيقونة الشبكة أسفل الشاشة.', requester_name: 'سهام الشمراني', requester_department: 'المالية والمحاسبة', device_name: 'ETRA-ACC-11', category: 'network', priority: 'high', status: 'analyzing', assigned_to: '00000000-0000-0000-0000-000000000003', created_by: '00000000-0000-0000-0000-000000000003', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: null, expected_diagnosis_ar: 'عدم حصول الجهاز على إعدادات IP صحيحة من الـ DHCP (عنوان 169.254.x.x - APIPA) أو فصل كابل الشبكة.', expected_steps_ar: '1. فحص الكابل والتأكد من إضاءة منفذ الشبكة.\n2. استخدام ipconfig لمعرفة العنوان الحالي.\n3. تشغيل الأوامر ipconfig /release ثم ipconfig /renew لتجديد العنوان.', expected_resolution_ar: 'توصيل الكيبل وإعادة تجديد عنوان IP يحل مشكلة الاتصال فوراً.', grading_rubric_ar: 'فحص الكيبل و ipconfig: 40 درجة، تجديد الـ IP بالأوامر: 40 درجة، توثيق الحل: 20 درجة.', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '88888888-8888-8888-8888-888888888884', ticket_number: 104, title_ar: 'تحديث ويندوز 11 معلق منذ 3 أيام ويظهر رمز الخطأ 0x800f081f', description_ar: 'أحاول تحديث جهازي للحصول على الميزات الأمنية الجديدة ولكن التحديث يقف عند 25% دائماً ثم يفشل ويعرض رمز خطأ.', requester_name: 'مها الحربي', requester_department: 'إدارة العمليات', device_name: 'ETRA-OPS-03', category: 'windows', priority: 'low', status: 'resolved', assigned_to: '00000000-0000-0000-0000-000000000002', created_by: '00000000-0000-0000-0000-000000000002', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: new Date().toISOString(), expected_diagnosis_ar: 'تلف في ملفات مخزن تحديثات الويندوز (SoftwareDistribution folder) أو ملفات النظام.', expected_steps_ar: '1. تشغيل أداة مستكشف أخطاء Windows Update ومصلحها.\n2. إيقاف خدمات التحديث وحذف محتويات مجلد SoftwareDistribution ثم إعادة تشغيلها.\n3. تشغيل الفحص SFC /scannow و DISM.', expected_resolution_ar: 'تصفير مجلد التحديثات وتنظيف ملفات النظام يحل مشكلة تعليق التحديث تماماً.', grading_rubric_ar: 'استخدام أداة الإصلاح: 30 درجة، تصفير المجلد: 40 درجة، تشغيل sfc/dism: 30 درجة.', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }
  ];
  setLocalData('tickets', tickets);

  const ticketUpdates = [
    { id: '99999999-9999-9999-9999-999999999801', ticket_id: '88888888-8888-8888-8888-888888888881', author_id: '00000000-0000-0000-0000-000000000001', update_type: 'assignment', content_ar: 'تم إسناد التذكرة للمتدربة لوجين محمد للبدء بالفحص الميداني للجهاز وتحديد العطل.', is_internal: false, old_status: 'new', new_status: 'assigned', created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString() },
    { id: '99999999-9999-9999-9999-999999999802', ticket_id: '88888888-8888-8888-8888-888888888883', author_id: '00000000-0000-0000-0000-000000000001', update_type: 'status_change', content_ar: 'بدأت المتدربة شذى بفحص إعدادات السويتش وفحص عنوان الـ IP للجهاز.', is_internal: false, old_status: 'new', new_status: 'analyzing', created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }
  ];
  setLocalData('ticket_updates', ticketUpdates);
  setLocalData('ticket_evaluations', []);

  // 12. Announcements
  const announcements = [
    { id: '99999999-9999-9999-9999-999999999901', title_ar: 'بدء البرنامج التدريبي التقني الميداني بمنصة إترا للتدريب التقني', content_ar: 'نرحب بجميع المتدربات في بداية البرنامج التدريبي التقني المكثف. سيغطي البرنامج المهارات الفنية الأكثر طلباً في سوق العمل في الدعم الفني وصيانة الأنظمة والشبكات وإدارة التذاكر.', type: 'normal', created_by: '00000000-0000-0000-0000-000000000001', published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), expires_at: null, is_published: true },
    { id: '99999999-9999-9999-9999-999999999902', title_ar: 'تمديد موعد تسليم واجب الأسبوع الأول', content_ar: 'نظراً لوجود بعض الاستفسارات حول تجميع عتاد الأجهزة وتوثيق الأعطال، فقد قررت إدارة التدريب تمديد فترة تسليم الواجب حتى يوم السبت القادم لمنح الجميع الفرصة الكافية للتطبيق العملي وتوثيق الخطوات بشكل ممتاز.', type: 'urgent', created_by: '00000000-0000-0000-0000-000000000001', published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), expires_at: null, is_published: true },
    { id: '99999999-9999-9999-9999-999999999903', title_ar: 'تنبيه هام بشأن الحضور والغياب اليومي', content_ar: 'نود تذكير جميع المتدربات بضرورة الالتزام بتسجيل الحضور اليومي في وقته المحدد، حيث يؤثر الانضباط مباشرة على تقييم الأداء النهائي للبرنامج.', type: 'important', created_by: '00000000-0000-0000-0000-000000000001', published_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), expires_at: null, is_published: true }
  ];
  setLocalData('announcements', announcements);

  // 13. Attendance
  const attendance = [
    // Laujeen
    { id: '99999999-9999-9999-9999-999999999701', trainee_id: '00000000-0000-0000-0000-000000000002', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999702', trainee_id: '00000000-0000-0000-0000-000000000002', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999703', trainee_id: '00000000-0000-0000-0000-000000000002', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'remote', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    
    // Shaza
    { id: '99999999-9999-9999-9999-999999999704', trainee_id: '00000000-0000-0000-0000-000000000003', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999705', trainee_id: '00000000-0000-0000-0000-000000000003', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'late', notes: 'تأخرت 10 دقائق بعذر مقنع', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999706', trainee_id: '00000000-0000-0000-0000-000000000003', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'remote', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },

    // Raghad
    { id: '99999999-9999-9999-9999-999999999707', trainee_id: '00000000-0000-0000-0000-000000000004', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999708', trainee_id: '00000000-0000-0000-0000-000000000004', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'inperson', status: 'present', notes: '', recorded_by: '00000000-0000-0000-0000-000000000001' },
    { id: '99999999-9999-9999-9999-999999999709', trainee_id: '00000000-0000-0000-0000-000000000004', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], week_number: 1, session_type: 'remote', status: 'absent', notes: 'غياب بدون عذر', recorded_by: '00000000-0000-0000-0000-000000000001' }
  ];
  setLocalData('attendance', attendance);

  // 14. Grades
  const grades = [
    { id: '99999999-9999-9999-9999-999999999601', trainee_id: '00000000-0000-0000-0000-000000000002', week_number: 1, lessons_score: 100, quizzes_score: 95, assignments_score: 0, tickets_score: 0, attendance_score: 100, total_score: 39, calculated_at: new Date().toISOString(), notes_ar: 'أداء متميز وتفاعل كبير في نقاش عتاد الأجهزة ومستويات الدعم.' },
    { id: '99999999-9999-9999-9999-999999999602', trainee_id: '00000000-0000-0000-0000-000000000003', week_number: 1, lessons_score: 50, quizzes_score: 80, assignments_score: 0, tickets_score: 0, attendance_score: 90, total_score: 36.5, calculated_at: new Date().toISOString(), notes_ar: 'تفاعل متوسط، يرجى استكمال مشاهدة بقية الدروس والالتزام بالحضور.' },
    { id: '99999999-9999-9999-9999-999999999603', trainee_id: '00000000-0000-0000-0000-000000000004', week_number: 1, lessons_score: 50, quizzes_score: 60, assignments_score: 0, tickets_score: 0, attendance_score: 66.6, total_score: 29.1, calculated_at: new Date().toISOString(), notes_ar: 'يرجى مراجعة إدارة التدريب لتوضيح غيابك المتكرر وتحسين درجات الكويز.' }
  ];
  setLocalData('grades', grades);
  setLocalData('notifications', []);

  console.log('✅ Mock database successfully seeded.');
};

// Check if seeding is needed
if (isMockMode) {
  const hasSeeded = localStorage.getItem('etra_db__users');
  if (!hasSeeded) {
    seedDatabase();
  }
}

// ── MOCK SUPABASE CLIENT IMPLEMENTATION ────────────────────────────
let authListeners: Array<(event: string, session: any) => void> = [];

const triggerAuthChange = (event: string, session: any) => {
  authListeners.forEach(listener => listener(event, session));
};

const mockAuth = {
  async signInWithPassword({ email, password }: any) {
    const users = getLocalData('_users');
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
      return { data: { session: null, user: null }, error: new Error('بيانات الدخول غير صحيحة') };
    }

    const session = {
      access_token: 'mock-access-token-' + generateUUID(),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-' + generateUUID(),
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      }
    };

    localStorage.setItem('etra_mock_session', JSON.stringify(session));
    triggerAuthChange('SIGNED_IN', session);

    return { data: { session, user: session.user }, error: null };
  },

  async getSession() {
    const sessionStr = localStorage.getItem('etra_mock_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    return { data: { session }, error: null };
  },

  async signOut() {
    localStorage.removeItem('etra_mock_session');
    triggerAuthChange('SIGNED_OUT', null);
    return { error: null };
  },

  async resetPasswordForEmail(email: string, options?: any) {
    console.log(`Password reset email simulated for: ${email}`);
    return { data: {}, error: null };
  },

  async updateUser(attributes: any) {
    const sessionStr = localStorage.getItem('etra_mock_session');
    if (!sessionStr) return { data: null, error: new Error('No active session') };

    const session = JSON.parse(sessionStr);
    const userId = session.user.id;

    // Update password in mock users
    const users = getLocalData('_users');
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, password: attributes.password };
      }
      return u;
    });
    setLocalData('_users', updatedUsers);

    return { data: { user: session.user }, error: null };
  },

  onAuthStateChange(callback: any) {
    authListeners.push(callback);
    
    // Immediately fire initial session event
    const sessionStr = localStorage.getItem('etra_mock_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    callback('INITIAL_SESSION', session);

    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners = authListeners.filter(l => l !== callback);
          }
        }
      }
    };
  }
};

class MockSupabaseQueryBuilder {
  table: string;
  filters: Array<(item: any) => boolean> = [];
  sortField: string | null = null;
  sortOrder: 'asc' | 'desc' = 'asc';
  limitCount: number | null = null;
  isSingle: boolean = false;
  isCountExact: boolean = false;

  constructor(table: string, options?: { count?: string }) {
    this.table = table;
    if (options?.count === 'exact') {
      this.isCountExact = true;
    }
  }

  select(columns: string, options?: { count?: string }) {
    if (options?.count === 'exact') {
      this.isCountExact = true;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(item => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(item => item[column] !== value);
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') {
      const values = value.replace(/[()"]/g, '').split(',');
      this.filters.push(item => !values.includes(item[column]));
    } else if (operator === 'is') {
      if (value === null) {
        this.filters.push(item => item[column] !== null && item[column] !== undefined);
      } else {
        this.filters.push(item => item[column] !== value);
      }
    } else {
      this.filters.push(item => item[column] !== value);
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortField = column;
    this.sortOrder = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  or(filters: string) {
    return this;
  }

  // Support thenable for async/await
  async then(resolve: (value: any) => void) {
    const data = getLocalData(this.table);
    let filtered = data.filter((item: any) => this.filters.every(f => f(item)));

    // Simulating deep relationships if queried
    // Specifically for LearningPathPage: training_weeks with modules and lessons
    if (this.table === 'training_weeks') {
      const modulesData = getLocalData('modules');
      const lessonsData = getLocalData('lessons');
      const progressData = getLocalData('lesson_progress');

      filtered = filtered.map(week => {
        const weekModules = modulesData
          .filter((m: any) => m.week_id === week.id)
          .map((m: any) => {
            const moduleLessons = lessonsData.filter((l: any) => l.module_id === m.id);
            return { ...m, lessons: moduleLessons };
          });
        return { ...week, modules: weekModules };
      });
    }

    if (this.sortField) {
      filtered.sort((a: any, b: any) => {
        const valA = a[this.sortField!];
        const valB = b[this.sortField!];
        if (typeof valA === 'string') {
          return this.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }

    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    const resultData = this.isSingle ? (filtered[0] || null) : filtered;
    const count = this.isCountExact ? filtered.length : undefined;

    resolve({
      data: resultData,
      error: null,
      count
    });
  }

  async insert(values: any | any[]) {
    const data = getLocalData(this.table);
    const inserts = Array.isArray(values) ? values : [values];
    
    const newItems = inserts.map(item => ({
      id: item.id || generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item
    }));

    // Generate ticket number for tickets
    if (this.table === 'tickets') {
      newItems.forEach((item, index) => {
        if (!item.ticket_number) {
          item.ticket_number = 100 + data.length + index + 1;
        }
      });
    }

    // Auto-profile creation simulation for profiles table on user sign-up
    const updatedData = [...data, ...newItems];
    setLocalData(this.table, updatedData);

    return {
      data: this.isSingle ? newItems[0] : newItems,
      error: null
    };
  }

  async update(values: any) {
    const data = getLocalData(this.table);
    const updatedItems: any[] = [];
    
    const updatedData = data.map((item: any) => {
      const match = this.filters.every(f => f(item));
      if (match) {
        const updated = {
          ...item,
          ...values,
          updated_at: new Date().toISOString()
        };
        updatedItems.push(updated);
        return updated;
      }
      return item;
    });

    setLocalData(this.table, updatedData);

    return {
      data: this.isSingle ? (updatedItems[0] || null) : updatedItems,
      error: null
    };
  }

  async delete() {
    const data = getLocalData(this.table);
    const remaining = data.filter((item: any) => !this.filters.every(f => f(item)));
    setLocalData(this.table, remaining);
    
    return {
      data: null,
      error: null
    };
  }
}

const mockSupabaseClient = {
  auth: mockAuth,
  from(table: string, options?: { count?: string }) {
    return new MockSupabaseQueryBuilder(table, options);
  }
};

// Export active client based on config
export const supabase = isMockMode
  ? (mockSupabaseClient as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'Accept-Language': 'ar',
        },
      },
    });

export default supabase;
