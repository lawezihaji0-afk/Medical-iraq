// ========================
//   نظام التسجيل والدخول
// ========================

let selectedAvatar = '😊';

// عرض نموذج التسجيل
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// عرض نموذج تسجيل الدخول
function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// اختيار الصورة الرمزية
function selectAvatar(el) {
    document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.avatar;
}

// التسجيل
function register() {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const email = document.getElementById('regEmail').value.trim();
    const code = document.getElementById('regCode').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    // التحقق من البيانات
    if (!fullName || !username || !email || !code || !password) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }

    if (username.length < 3) {
        showToast('اسم المستخدم يجب أن يكون 3 أحرف على الأقل', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showToast('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط', 'error');
        return;
    }

    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
        showToast('الرمز السري يجب أن يكون 4 أرقام', 'error');
        return;
    }

    if (password.length < 4) {
        showToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showToast('كلمات المرور غير متطابقة', 'error');
        return;
    }

    // التحقق من عدم وجود المستخدم
    let users = JSON.parse(localStorage.getItem('students_users') || '[]');
    
    if (users.find(u => u.username === username)) {
        showToast('اسم المستخدم مستخدم مسبقاً', 'error');
        return;
    }

    if (users.find(u => u.email === email)) {
        showToast('البريد الإلكتروني مستخدم مسبقاً', 'error');
        return;
    }

    // إنشاء المستخدم
    const newUser = {
        id: generateId(),
        fullName: fullName,
        username: username,
        email: email,
        code: code,
        password: password,
        avatar: selectedAvatar,
        bio: '',
        location: '',
        website: '',
        coverColor: 'linear-gradient(135deg, #667eea, #764ba2)',
        joinDate: new Date().toISOString(),
        followers: [],
        following: [],
        savedPosts: [],
        notifications: [],
        isOnline: false
    };

    users.push(newUser);
    localStorage.setItem('students_users', JSON.stringify(users));

    showToast('تم التسجيل بنجاح! سجّل دخولك الآن', 'success');
    showLogin();

    // تنظيف الحقول
    document.getElementById('regFullName').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regCode').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPasswordConfirm').value = '';
}

// تسجيل الدخول
function login() {
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const code = document.getElementById('loginCode').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !code || !password) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }

    let users = JSON.parse(localStorage.getItem('students_users') || '[]');
    const user = users.find(u => u.username === username);

    if (!user) {
        showToast('اسم المستخدم غير موجود', 'error');
        return;
    }

    if (user.code !== code) {
        showToast('الرمز السري غير صحيح', 'error');
        return;
    }

    if (user.password !== password) {
        showToast('كلمة المرور غير صحيحة', 'error');
        return;
    }

    // تسجيل الدخول
    user.isOnline = true;
    localStorage.setItem('students_users', JSON.stringify(users));
    localStorage.setItem('students_current_user', user.id);

    showToast(`مرحباً ${user.fullName}! 🎉`, 'success');

    setTimeout(() => {
        window.location.href = 'home.html';
    }, 800);
}

// توليد معرف فريد
function generateId() {
    return 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// عرض رسالة تنبيه
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// التحقق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const currentUserId = localStorage.getItem('students_current_user');
    if (currentUserId) {
        const users = JSON.parse(localStorage.getItem('students_users') || '[]');
        const user = users.find(u => u.id === currentUserId);
        if (user) {
            window.location.href = 'home.html';
        }
    }

    // إضافة مستخدمين تجريبيين إذا لم يوجد أحد
    addDemoUsers();
});

// إضافة مستخدمين تجريبيين
function addDemoUsers() {
    let users = JSON.parse(localStorage.getItem('students_users') || '[]');
    
    if (users.length === 0) {
        const demoUsers = [
            {
                id: 'demo_1',
                fullName: 'أحمد الطالب',
                username: 'ahmed',
                email: 'ahmed@test.com',
                code: '1234',
                password: '1234',
                avatar: '😎',
                bio: 'طالب هندسة حاسوب | أحب البرمجة والتكنولوجيا',
                location: 'بغداد',
                website: '',
                coverColor: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                joinDate: new Date(Date.now() - 86400000 * 30).toISOString(),
                followers: [],
                following: [],
                savedPosts: [],
                notifications: [],
                isOnline: true
            },
            {
                id: 'demo_2',
                fullName: 'سارة المهندسة',
                username: 'sara',
                email: 'sara@test.com',
                code: '5678',
                password: '5678',
                avatar: '👩‍🎓',
                bio: 'مهندسة برمجيات | أشارك محتوى تعليمي',
                location: 'البصرة',
                website: '',
                coverColor: 'linear-gradient(135deg, #f093fb, #f5576c)',
                joinDate: new Date(Date.now() - 86400000 * 20).toISOString(),
                followers: [],
                following: [],
                savedPosts: [],
                notifications: [],
                isOnline: true
            },
            {
                id: 'demo_3',
                fullName: 'محمد المصمم',
                username: 'mohammed',
                email: 'mohammed@test.com',
                code: '9012',
                password: '9012',
                avatar: '👨‍💻',
                bio: 'مصمم جرافيك | أحب الإبداع والفن الرقمي',
                location: 'أربيل',
                website: '',
                coverColor: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                joinDate: new Date(Date.now() - 86400000 * 15).toISOString(),
                followers: [],
                following: [],
                savedPosts: [],
                notifications: [],
                isOnline: false
            },
            {
                id: 'demo_4',
                fullName: 'فاطمة العلوية',
                username: 'fatima',
                email: 'fatima@test.com',
                code: '3456',
                password: '3456',
                avatar: '🧑‍🎓',
                bio: 'طالبة طب | أحب مشاركة المعرفة',
                location: 'النجف',
                website: '',
                coverColor: 'linear-gradient(135deg, #fa709a, #fee140)',
                joinDate: new Date(Date.now() - 86400000 * 10).toISOString(),
                followers: [],
                following: [],
                savedPosts: [],
                notifications: [],
                isOnline: true
            }
        ];

        // ربط المتابعات بين المستخدمين التجريبيين
        demoUsers[0].followers = ['demo_2', 'demo_4'];
        demoUsers[0].following = ['demo_2', 'demo_3'];
        demoUsers[1].followers = ['demo_1', 'demo_3'];
        demoUsers[1].following = ['demo_1', 'demo_4'];
        demoUsers[2].followers = ['demo_1'];
        demoUsers[2].following = ['demo_1', 'demo_2'];
        demoUsers[3].followers = ['demo_2'];
        demoUsers[3].following = ['demo_1'];

        localStorage.setItem('students_users', JSON.stringify(demoUsers));

        // إضافة منشورات تجريبية
        addDemoPosts();
    }
}

function addDemoPosts() {
    const demoPosts = [
        {
            id: 'post_1',
            userId: 'demo_1',
            text: 'مرحباً بالجميع في شبكة الطلاب! 🎉\nهذا المكان مخصص لمشاركة الأفكار والخبرات بيننا كطلاب.\nخلونا نتعلم سوا ونساعد بعض! 💪',
            bgColor: 'linear-gradient(135deg, #667eea, #764ba2)',
            image: null,
            video: null,
            privacy: 'public',
            likes: ['demo_2', 'demo_3', 'demo_4'],
            shares: ['demo_2'],
            comments: [
                {
                    id: 'c1',
                    userId: 'demo_2',
                    text: 'فكرة رائعة أحمد! أنا مستعدة للمشاركة ✨',
                    time: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 'c2',
                    userId: 'demo_4',
                    text: 'ما شاء الله! منصة جميلة 👏',
                    time: new Date(Date.now() - 1800000).toISOString()
                }
            ],
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: 'post_2',
            userId: 'demo_2',
            text: 'نصيحة للطلاب: خصصوا وقت يومي للقراءة حتى لو 20 دقيقة.\nالقراءة المستمرة تصنع فرق كبير في مستواكم الأكاديمي 📚\n\n#نصائح_دراسية #تعلم',
            bgColor: null,
            image: null,
            video: null,
            privacy: 'public',
            likes: ['demo_1', 'demo_3'],
            shares: ['demo_4'],
            comments: [
                {
                    id: 'c3',
                    userId: 'demo_3',
                    text: 'نصيحة ذهبية! شكراً سارة 🙏',
                    time: new Date(Date.now() - 7200000).toISOString()
                }
            ],
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'post_3',
            userId: 'demo_3',
            text: 'شاركت اليوم في ورشة عمل عن التصميم الرقمي وكانت رائعة! 🎨\nتعلمت أشياء جديدة في برنامج Figma',
            bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)',
            image: null,
            video: null,
            privacy: 'public',
            likes: ['demo_1', 'demo_2', 'demo_4'],
            shares: [],
            comments: [],
            createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
            id: 'post_4',
            userId: 'demo_4',
            text: 'الامتحانات اقتربت! 😰\nخلوني أسمع خطتكم للدراسة؟\nأنا بديت من اليوم أراجع كل يوم مادتين.\n\nشاركوني خططكم! 📝',
            bgColor: null,
            image: null,
            video: null,
            privacy: 'public',
            likes: ['demo_1'],
            shares: ['demo_2'],
            comments: [
                {
                    id: 'c4',
                    userId: 'demo_1',
                    text: 'أنا بعد بديت! الله يوفقنا جميعاً 🤲',
                    time: new Date(Date.now() - 3600000 * 5).toISOString()
                },
                {
                    id: 'c5',
                    userId: 'demo_2',
                    text: 'نصيحة: اعملي جدول زمني ومن تخلصين كل مادة سوي لنفسج مكافأة صغيرة 🎁',
                    time: new Date(Date.now() - 3600000 * 4).toISOString()
                }
            ],
            createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
        }
    ];

    localStorage.setItem('students_posts', JSON.stringify(demoPosts));
      }
