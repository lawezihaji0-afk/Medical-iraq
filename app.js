// ========================
//   المتغيرات العامة
// ========================
let currentUser = null;
let allPosts = [];
let allUsers = [];
let currentPostBg = null;
let currentMediaData = null;
let currentMediaType = null;
let currentChatUserId = null;
let activeDropdown = null;

// ========================
//   تهيئة التطبيق
// ========================
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // التحقق من تسجيل الدخول
    const currentUserId = localStorage.getItem('students_current_user');
    if (!currentUserId) {
        window.location.href = 'index.html';
        return;
    }

    allUsers = JSON.parse(localStorage.getItem('students_users') || '[]');
    currentUser = allUsers.find(u => u.id === currentUserId);
    
    if (!currentUser) {
        localStorage.removeItem('students_current_user');
        window.location.href = 'index.html';
        return;
    }

    // تحديث حالة الاتصال
    currentUser.isOnline = true;
    saveUsers();

    // تحميل البيانات
    loadPosts();
    updateUserUI();
    loadOnlineUsers();
    loadSuggestions();
    loadTrending();
    updateNotificationBadge();

    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (activeDropdown && !e.target.closest('.post-menu-btn') && !e.target.closest('.post-dropdown')) {
            activeDropdown.remove();
            activeDropdown = null;
        }
    });
}

// ========================
//   تحديث واجهة المستخدم
// ========================
function updateUserUI() {
    // الشريط العلوي
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) navAvatar.textContent = currentUser.avatar;

    // الشريط الجانبي
    const sideAvatar = document.getElementById('sideAvatar');
    const sideFullName = document.getElementById('sideFullName');
    const sideUsername = document.getElementById('sideUsername');
    
    if (sideAvatar) sideAvatar.textContent = currentUser.avatar;
    if (sideFullName) sideFullName.textContent = currentUser.fullName;
    if (sideUsername) sideUsername.textContent = '@' + currentUser.username;

    // إنشاء المنشور
    const createAvatar = document.getElementById('createAvatar');
    if (createAvatar) createAvatar.textContent = currentUser.avatar;

    // الإحصائيات
    const userPosts = allPosts.filter(p => p.userId === currentUser.id);
    const postCount = document.getElementById('postCount');
    const followersCount = document.getElementById('followersCount');
    const followingCount = document.getElementById('followingCount');
    
    if (postCount) postCount.textContent = userPosts.length;
    if (followersCount) followersCount.textContent = (currentUser.followers || []).length;
    if (followingCount) followingCount.textContent = (currentUser.following || []).length;
}

// ========================
//   نظام المنشورات
// ========================
function loadPosts() {
    allPosts = JSON.parse(localStorage.getItem('students_posts') || '[]');
    renderPosts(allPosts);
}

function renderPosts(posts) {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (sortedPosts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
                <i class="fas fa-inbox" style="font-size: 60px; margin-bottom: 15px; color: var(--light-gray);"></i>
                <h3>لا توجد منشورات بعد</h3>
                <p>كن أول من ينشر شيئاً!</p>
            </div>
        `;
        return;
    }

    sortedPosts.forEach(post => {
        container.appendChild(createPostElement(post));
    });
}

function createPostElement(post) {
    const user = allUsers.find(u => u.id === post.userId);
    if (!user) return document.createElement('div');

    const isLiked = post.likes.includes(currentUser.id);
    const isShared = post.shares.includes(currentUser.id);
    const isSaved = (currentUser.savedPosts || []).includes(post.id);
    const isOwner = post.userId === currentUser.id;
    const timeAgo = getTimeAgo(post.createdAt);

    const div = document.createElement('div');
    div.className = 'post-card';
    div.id = `post-${post.id}`;

    let contentHTML = '';
    
    // نص مع خلفية ملونة
    if (post.bgColor && post.bgColor !== 'white' && post.text && !post.image && !post.video) {
        contentHTML = `<div class="post-text-bg" style="background: ${post.bgColor}">${escapeHTML(post.text)}</div>`;
    } else {
        if (post.text) {
            contentHTML += `<p class="post-text">${formatPostText(post.text)}</p>`;
        }
        if (post.image) {
            contentHTML += `<img class="post-image" src="${post.image}" alt="صورة المنشور" onclick="openLightbox('${post.image}')">`;
        }
        if (post.video) {
            contentHTML += `<video class="post-video" controls><source src="${post.video}" type="video/mp4">المتصفح لا يدعم الفيديو</video>`;
        }
    }

    div.innerHTML = `
        <div class="post-header">
            <div class="post-avatar" onclick="viewUserProfile('${user.id}')">${user.avatar}</div>
            <div class="post-user-info">
                <strong onclick="viewUserProfile('${user.id}')">${user.fullName}</strong>
                <span>@${user.username} · ${timeAgo} · ${post.privacy === 'public' ? '🌍' : post.privacy === 'followers' ? '👥' : '🔒'}</span>
            </div>
            <button class="post-menu-btn" onclick="togglePostMenu(event, '${post.id}')">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
        <div class="post-content">
            ${contentHTML}
        </div>
        <div class="post-stats">
            <span onclick="showLikers('${post.id}')">
                ${post.likes.length > 0 ? `❤️ ${post.likes.length} إعجاب` : ''}
            </span>
            <span>
                ${post.comments.length > 0 ? `${post.comments.length} تعليق` : ''}
                ${post.shares.length > 0 ? ` · ${post.shares.length} مشاركة` : ''}
            </span>
        </div>
        <div class="post-actions">
            <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                <i class="fas fa-heart"></i>
                <span>${isLiked ? 'أعجبني' : 'إعجاب'}</span>
            </button>
            <button class="action-btn" onclick="focusComment('${post.id}')">
                <i class="fas fa-comment"></i>
                <span>تعليق</span>
            </button>
            <button class="action-btn ${isShared ? 'shared' : ''}" onclick="sharePost('${post.id}')">
                <i class="fas fa-share"></i>
                <span>مشاركة</span>
            </button>
            <button class="action-btn ${isSaved ? 'liked' : ''}" onclick="savePost('${post.id}')">
                <i class="fas fa-bookmark"></i>
                <span>${isSaved ? 'محفوظ' : 'حفظ'}</span>
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}">
            <div class="comment-input-area">
                <span style="font-size: 28px;">${currentUser.avatar}</span>
                <input type="text" id="comment-input-${post.id}" placeholder="اكتب تعليقاً..." 
                       onkeypress="handleCommentKey(event, '${post.id}')">
                <button onclick="addComment('${post.id}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div id="comments-list-${post.id}">
                ${renderComments(post.comments)}
            </div>
            ${post.comments.length > 2 ? `
                <button class="show-more-comments" onclick="showAllComments('${post.id}')" 
                        style="background:none;border:none;color:var(--gray);cursor:pointer;font-size:13px;padding:5px;font-family:inherit;">
                    عرض جميع التعليقات (${post.comments.length})
                </button>
            ` : ''}
        </div>
    `;

    return div;
}

function renderComments(comments, showAll = false) {
    const displayComments = showAll ? comments : comments.slice(-2);
    return displayComments.map(comment => {
        const commentUser = allUsers.find(u => u.id === comment.userId);
        if (!commentUser) return '';
        return `
            <div class="comment">
                <span class="comment-avatar">${commentUser.avatar}</span>
                <div>
                    <div class="comment-body">
                        <strong>${commentUser.fullName}</strong>
                        <p>${escapeHTML(comment.text)}</p>
                    </div>
                    <div class="comment-time">${getTimeAgo(comment.time)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================
//   إنشاء منشور جديد
// ========================
function openCreatePost(type) {
    document.getElementById('createPostModal').classList.remove('hidden');
    
    const modalAvatar = document.getElementById('modalAvatar');
    const modalFullName = document.getElementById('modalFullName');
    if (modalAvatar) modalAvatar.textContent = currentUser.avatar;
    if (modalFullName) modalFullName.textContent = currentUser.fullName;
    
    // تركيز على حقل النص
    setTimeout(() => {
        document.getElementById('postText').focus();
    }, 300);

    // إذا تم تحديد نوع معين
    if (type === 'photo') {
        document.getElementById('postImage').click();
    } else if (type === 'video') {
        document.getElementById('postVideo').click();
    }
}

function closeCreatePost() {
    document.getElementById('createPostModal').classList.add('hidden');
    document.getElementById('postText').value = '';
    removeMedia();
    currentPostBg = null;
    document.getElementById('emojiPicker').classList.add('hidden');
    document.getElementById('bgColors').classList.add('hidden');
}

function previewMedia(type) {
    const preview = document.getElementById('mediaPreview');
    const content = document.getElementById('mediaContent');
    let file;
    
    if (type === 'image') {
        file = document.getElementById('postImage').files[0];
    } else {
        file = document.getElementById('postVideo').files[0];
    }
    
    if (!file) return;

    // التحقق من الحجم (10MB كحد أقصى)
    if (file.size > 10 * 1024 * 1024) {
        showToast('حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentMediaData = e.target.result;
        currentMediaType = type;
        
        if (type === 'image') {
            content.innerHTML = `<img src="${e.target.result}" alt="معاينة">`;
        } else {
            content.innerHTML = `<video src="${e.target.result}" controls></video>`;
        }
        
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeMedia() {
    document.getElementById('mediaPreview').classList.add('hidden');
    document.getElementById('mediaContent').innerHTML = '';
    document.getElementById('postImage').value = '';
    document.getElementById('postVideo').value = '';
    currentMediaData = null;
    currentMediaType = null;
}

function toggleEmojiPicker() {
    document.getElementById('emojiPicker').classList.toggle('hidden');
    document.getElementById('bgColors').classList.add('hidden');
}

function addEmoji(emoji) {
    const textarea = document.getElementById('postText');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
}

function toggleBgColors() {
    document.getElementById('bgColors').classList.toggle('hidden');
    document.getElementById('emojiPicker').classList.add('hidden');
}

function setBgColor(color) {
    currentPostBg = color;
    showToast('تم اختيار لون الخلفية', 'success');
}

function publishPost() {
    const text = document.getElementById('postText').value.trim();
    const privacy = document.getElementById('postPrivacy').value;
    
    if (!text && !currentMediaData) {
        showToast('اكتب شيئاً أو أضف صورة/فيديو', 'warning');
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        userId: currentUser.id,
        text: text,
        bgColor: (!currentMediaData && currentPostBg) ? currentPostBg : null,
        image: currentMediaType === 'image' ? currentMediaData : null,
        video: currentMediaType === 'video' ? currentMediaData : null,
        privacy: privacy,
        likes: [],
        shares: [],
        comments: [],
        createdAt: new Date().toISOString()
    };

    allPosts.unshift(newPost);
    savePosts();
    
    closeCreatePost();
    renderPosts(allPosts);
    updateUserUI();
    
    showToast('تم نشر المنشور بنجاح! 🎉', 'success');

    // إرسال إشعار للمتابعين
    notifyFollowers('post', newPost.id);
}

// ========================
//   التفاعلات
// ========================
function toggleLike(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const index = post.likes.indexOf(currentUser.id);
    if (index === -1) {
        post.likes.push(currentUser.id);
        // إرسال إشعار
        if (post.userId !== currentUser.id) {
            addNotification(post.userId, 'like', `${currentUser.fullName} أعجب بمنشورك ❤️`, postId);
        }
    } else {
        post.likes.splice(index, 1);
    }

    savePosts();
    renderPosts(allPosts);
}

function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    
    if (!text) return;

    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
        id: 'c_' + Date.now(),
        userId: currentUser.id,
        text: text,
        time: new Date().toISOString()
    };

    post.comments.push(newComment);
    savePosts();
    
    // تحديث التعليقات
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (commentsList) {
        commentsList.innerHTML = renderComments(post.comments);
    }
    
    input.value = '';

    // إرسال إشعار
    if (post.userId !== currentUser.id) {
        addNotification(post.userId, 'comment', `${currentUser.fullName} علّق على منشورك 💬`, postId);
    }

    showToast('تم إضافة التعليق', 'success');
    renderPosts(allPosts);
}

function handleCommentKey(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
}

function focusComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function sharePost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const index = post.shares.indexOf(currentUser.id);
    if (index === -1) {
        post.shares.push(currentUser.id);
        
        // إرسال إشعار
        if (post.userId !== currentUser.id) {
            addNotification(post.userId, 'share', `${currentUser.fullName} شارك منشورك 🔄`, postId);
        }
        
        showToast('تم مشاركة المنشور ✅', 'success');
    } else {
        post.shares.splice(index, 1);
        showToast('تم إلغاء المشاركة', 'info');
    }

    savePosts();
    renderPosts(allPosts);
}

function savePost(postId) {
    if (!currentUser.savedPosts) currentUser.savedPosts = [];
    
    const index = currentUser.savedPosts.indexOf(postId);
    if (index === -1) {
        currentUser.savedPosts.push(postId);
        showToast('تم حفظ المنشور 📌', 'success');
    } else {
        currentUser.savedPosts.splice(index, 1);
        showToast('تم إلغاء الحفظ', 'info');
    }

    saveUsers();
    renderPosts(allPosts);
}

// قائمة المنشور
function togglePostMenu(event, postId) {
    event.stopPropagation();
    
    // إغلاق أي قائمة مفتوحة
    if (activeDropdown) {
        activeDropdown.remove();
        activeDropdown = null;
    }

    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const isOwner = post.userId === currentUser.id;
    const isSaved = (currentUser.savedPosts || []).includes(postId);

    const dropdown = document.createElement('div');
    dropdown.className = 'post-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = event.target.getBoundingClientRect().bottom + 5 + 'px';
    dropdown.style.right = (window.innerWidth - event.target.getBoundingClientRect().right) + 'px';

    dropdown.innerHTML = `
        <button onclick="savePost('${postId}'); this.parentElement.remove();">
            <i class="fas fa-bookmark"></i> ${isSaved ? 'إلغاء الحفظ' : 'حفظ المنشور'}
        </button>
        <button onclick="copyPostLink('${postId}'); this.parentElement.remove();">
            <i class="fas fa-link"></i> نسخ الرابط
        </button>
        ${isOwner ? `
            <button class="delete-btn" onclick="deletePost('${postId}'); this.parentElement.remove();">
                <i class="fas fa-trash"></i> حذف المنشور
            </button>
        ` : `
            <button onclick="reportPost('${postId}'); this.parentElement.remove();">
                <i class="fas fa-flag"></i> إبلاغ
            </button>
        `}
    `;

    document.body.appendChild(dropdown);
    activeDropdown = dropdown;
}

function deletePost(postId) {
    if (confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
        allPosts = allPosts.filter(p => p.id !== postId);
        savePosts();
        renderPosts(allPosts);
        updateUserUI();
        showToast('تم حذف المنشور', 'success');
    }
}

function copyPostLink(postId) {
    navigator.clipboard.writeText(window.location.origin + '/post/' + postId);
    showToast('تم نسخ الرابط 📋', 'success');
}

function reportPost(postId) {
    showToast('تم الإبلاغ عن المنشور. شكراً لك 🙏', 'info');
}

// ========================
//   فلترة المنشورات
// ========================
function filterPosts(type) {
    let filtered;
    switch(type) {
        case 'photos':
            filtered = allPosts.filter(p => p.image);
            break;
        case 'videos':
            filtered = allPosts.filter(p => p.video);
            break;
        case 'texts':
            filtered = allPosts.filter(p => p.text && !p.image && !p.video);
            break;
        default:
            filtered = allPosts;
    }
    renderPosts(filtered);
}

function showSavedPosts() {
    const savedIds = currentUser.savedPosts || [];
    const saved = allPosts.filter(p => savedIds.includes(p.id));
    if (saved.length === 0) {
        showToast('لا توجد منشورات محفوظة', 'info');
        return;
    }
    renderPosts(saved);
}

function searchPosts() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        renderPosts(allPosts);
        return;
    }
    
    const results = allPosts.filter(p => {
        const user = allUsers.find(u => u.id === p.userId);
        return (p.text && p.text.toLowerCase().includes(query)) ||
               (user && user.fullName.toLowerCase().includes(query)) ||
               (user && user.username.toLowerCase().includes(query));
    });
    
    renderPosts(results);
}

// ========================
//   نظام المتابعة
// ========================
function toggleFollow(userId) {
    if (userId === currentUser.id) return;
    
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return;

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [
