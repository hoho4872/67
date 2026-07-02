// --- 1. 음식 데이터 ---
const foods = [
    // 밥·죽·면
    { id: 1, category: 'rice', name: '쌀밥', icon: '🍚', co2: 0.8 },
    { id: 2, category: 'rice', name: '잡곡밥', icon: '🍛', co2: 0.9 },
    { id: 3, category: 'rice', name: '김치볶음밥', icon: '🍳', co2: 1.5 },
    { id: 4, category: 'rice', name: '물냉면', icon: '🍜', co2: 1.2 },
    { id: 15, category: 'rice', name: '라면', icon: '🍥', co2: 1.1 },
    { id: 16, category: 'rice', name: '잔치국수', icon: '🥢', co2: 0.9 },
    { id: 17, category: 'rice', name: '칼국수', icon: '🍲', co2: 1.0 },

    // 국·탕·찌개
    { id: 5, category: 'soup', name: '김치찌개', icon: '🥘', co2: 1.3 },
    { id: 6, category: 'soup', name: '된장찌개', icon: '🫕', co2: 1.0 },
    { id: 7, category: 'soup', name: '미역국', icon: '🥣', co2: 0.7 },
    { id: 18, category: 'soup', name: '순두부찌개', icon: '🍲', co2: 1.1 },

    // 반찬·고기
    { id: 8, category: 'side', name: '불고기', icon: '🥩', co2: 5.5 },
    { id: 9, category: 'side', name: '생선구이', icon: '🐟', co2: 2.1 },
    { id: 10, category: 'side', name: '두부부침', icon: '🧈', co2: 0.6 },
    { id: 11, category: 'side', name: '계란말이', icon: '🥚', co2: 0.8 },
    { id: 19, category: 'side', name: '치킨', icon: '🍗', co2: 3.5 },
    { id: 20, category: 'side', name: '삼겹살', icon: '🥓', co2: 4.8 },

    // 기타·분식·후식
    { id: 12, category: 'etc', name: '김밥', icon: '🍙', co2: 1.1 },
    { id: 21, category: 'etc', name: '떡볶이', icon: '🍢', co2: 1.4 },
    { id: 22, category: 'etc', name: '돈까스', icon: '🍘', co2: 3.2 },
    { id: 13, category: 'etc', name: '아메리카노', icon: '☕', co2: 0.3 },
    { id: 14, category: 'etc', name: '사과', icon: '🍎', co2: 0.1 }
];

let selectedFoods = []; 
let supabaseClient = null;
let activeSession = null;

// Supabase 연결 설정 (사용자 설정 UI 제거에 따라, MCP 등에서 직접 소스 코드로 설정하여 연동할 수 있도록 변수로 제공합니다)
const SUPABASE_URL = "https://sqgimboizbtcqftbgdfr.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ2ltYm9pemJ0Y3FmdGJnZGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDYxMzYsImV4cCI6MjA5ODUyMjEzNn0.ktUN1RbWAqVx4xKkOQ5Zn7DE6rpmRQ7RGI0dg8E-UBI";

// 전역 변수 선언
let foodGrid, tabBtns, diningTable, periodSelect, btnReset, btnSaveCloud;

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // HTML이 다 로드된 후 요소를 찾음
    foodGrid = document.getElementById('food-grid');
    tabBtns = document.querySelectorAll('.tab-btn');
    diningTable = document.getElementById('dining-table');
    periodSelect = document.getElementById('period-select');
    btnReset = document.getElementById('btn-reset');
    btnSaveCloud = document.getElementById('btn-save-cloud');

    // 요소들이 제대로 존재하는지 확인 (에러 방지)
    if(!foodGrid || !diningTable) {
        console.error("HTML 요소를 찾을 수 없습니다. index.html의 id를 확인해주세요.");
        return;
    }

    init();
    initSupabase();
});

function init() {
    renderFoods('all');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category || 'all';
            renderFoods(category);
        });
    });

    periodSelect.addEventListener('change', calculateResult);
    btnReset.addEventListener('click', () => {
        selectedFoods = [];
        const activeTab = document.querySelector('.tab-btn.active');
        renderFoods(activeTab ? activeTab.dataset.category : 'all');
        updateTable();
    });

    // Supabase에 밥상 저장 버튼 이벤트 연결
    if (btnSaveCloud) {
        btnSaveCloud.addEventListener('click', saveMealToCloud);
    }
}

function renderFoods(category) {
    foodGrid.innerHTML = '';
    
    const filtered = category === 'all' ? foods : foods.filter(f => f.category === category);
    
    filtered.forEach(food => {
        const isSelected = selectedFoods.some(sf => sf.id === food.id);
        
        const card = document.createElement('div');
        card.className = `food-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="food-icon">${food.icon}</div>
            <div class="food-name">${food.name}</div>
        `;
        
        card.addEventListener('click', () => toggleFood(food, card));
        foodGrid.appendChild(card);
    });
}

function toggleFood(food, cardElement) {
    const index = selectedFoods.findIndex(sf => sf.id === food.id);
    if (index > -1) {
        selectedFoods.splice(index, 1);
        cardElement.classList.remove('selected');
    } else {
        selectedFoods.push(food);
        cardElement.classList.add('selected');
    }
    updateTable();
}

function updateTable() {
    const existingItems = diningTable.querySelectorAll('.table-item');
    existingItems.forEach(item => item.remove());

    const placeholder = document.getElementById('table-placeholder');
    if (placeholder) {
        if(selectedFoods.length > 0) {
            placeholder.classList.add('hidden'); 
        } else {
            placeholder.classList.remove('hidden'); 
        }
    }

    selectedFoods.forEach(food => {
        const item = document.createElement('div');
        item.className = 'table-item';
        item.innerHTML = food.icon; 
        diningTable.appendChild(item);
    });

    calculateResult(); 
}

function calculateResult() {
    const totalCo2 = selectedFoods.reduce((sum, food) => sum + food.co2, 0);
    
    const km = totalCo2 * 4.26;
    const tree = totalCo2 * 0.15;

    document.getElementById('co2-value').textContent = totalCo2.toFixed(1);
    document.getElementById('km-value').textContent = km.toFixed(1);
    document.getElementById('tree-value').textContent = tree.toFixed(1);

    const days = parseInt(periodSelect.value);
    document.getElementById('multi-km').textContent = (km * days).toFixed(1);
    document.getElementById('multi-tree').textContent = (tree * days).toFixed(1);

    const car = document.getElementById('car-icon');
    if (car) {
        let positionPercent = (km / 20) * 100; 
        if(positionPercent > 95) positionPercent = 95; 
        if(totalCo2 === 0) positionPercent = 0;
        car.style.left = `${positionPercent}%`;
    }

    const treeContainer = document.getElementById('tree-icons');
    if (treeContainer) {
        const treeCount = Math.min(Math.ceil(tree), 10); 
        treeContainer.innerHTML = '🌳'.repeat(treeCount);
    }
}

// --- 2. Supabase 설정 로드 & 초기화 ---


async function initSupabase() {
    const url = SUPABASE_URL;
    const key = SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.log('Supabase 설정 정보가 비어 있습니다. 필요시 script.js 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY를 설정해주세요.');
        return;
    }

    try {
        supabaseClient = supabase.createClient(url, key);

        // 세션 변화 이벤트 핸들링
        supabaseClient.auth.onAuthStateChange((event, session) => {
            activeSession = session;
            updateAuthUI();
        });

        // 현재 세션 즉시 점검
        const { data: { session } } = await supabaseClient.auth.getSession();
        activeSession = session;
        updateAuthUI();

        // 자동 세션 복구(로그인 상태)이고 이번 브라우저 세션에 로깅 안 했다면 로그인 이력 기록
        if (activeSession && activeSession.user && !sessionStorage.getItem('login_logged')) {
            await recordLoginLog(activeSession.user.id, activeSession.user.email);
        }

    } catch (err) {
        console.error('Supabase 초기화 오류:', err);
    }
}

// --- 3. UI 갱신 & 모달 제어 ---

// 로그인 모달 흔들림(Shake) 모션 효과
function triggerShakeEffect() {
    const modalContent = document.querySelector('#auth-modal .modal-content');
    if (modalContent) {
        modalContent.classList.add('shake');
        setTimeout(() => modalContent.classList.remove('shake'), 400);
    }
}

function updateAuthUI() {
    const authStatusArea = document.getElementById('auth-status-area');
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const btnCloseAuth = document.getElementById('btn-close-auth');

    if (activeSession && activeSession.user) {
        // 로그인 완료 상태
        if (btnOpenAuth) btnOpenAuth.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userEmail) userEmail.innerText = activeSession.user.email;
        if (btnSaveCloud) btnSaveCloud.disabled = false;
        
        // 로그인 완료 시 닫기 버튼 복구 및 모달 닫기
        if (btnCloseAuth) btnCloseAuth.classList.remove('hidden');
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
    } else {
        // 비로그인 상태
        if (btnOpenAuth) btnOpenAuth.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (btnSaveCloud) btnSaveCloud.disabled = true;
        
        // 로그인 필수 가드: 닫기 버튼 숨김 및 로그인 모달 강제 팝업
        if (btnCloseAuth) btnCloseAuth.classList.add('hidden');
        openModal('auth-modal');
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
}

// 인라인 에러 메시지 표시 도우미
function showError(elementId, message) {
    const errEl = document.getElementById(elementId);
    if (errEl) {
        errEl.textContent = message;
        errEl.classList.remove('hidden');
    }
}

// 모든 인라인 에러 메시지 숨김 초기화
function clearErrors() {
    const errMsgs = document.querySelectorAll('.error-msg');
    errMsgs.forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

function closeModal(id) {
    // 로그인 필수 가드 (비로그인 상태에서는 로그인 창 강제 닫기 금지)
    if (id === 'auth-modal' && (!activeSession || !activeSession.user)) {
        triggerShakeEffect();
        return;
    }
    // 창 닫을 때 이전 에러 메시지 모두 리셋
    clearErrors();
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
}

function switchModalTab(tab) {
    const tabLogin = document.getElementById('modal-tab-login');
    const tabRegister = document.getElementById('modal-tab-register');
    const loginForm = document.getElementById('modal-login-form');
    const registerForm = document.getElementById('modal-register-form');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// --- 4. Supabase 인증 및 데이터 연동 로직 ---

function checkSupaConnected() {
    if (!supabaseClient) {
        alert('Supabase 연동이 설정되지 않았습니다. 개발자(MCP)를 통해 연동 설정을 진행해 주세요.');
        return false;
    }
    return true;
}

// 힌트 데이터 저장 함수
async function saveUserHint(userId, email, question, answer) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('user_password_hints')
            .insert([{ user_id: userId, email: email, hint_question: question, hint_answer: answer }]);
        if (error) throw error;
    } catch (err) {
        console.error('힌트 정보 저장 실패:', err.message);
    }
}

// 회원가입
async function handleSignUp() {
    if (!checkSupaConnected()) return;
    clearErrors();

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    
    // 힌트 질문 및 답변 추출
    const hintQuestion = document.getElementById('registerHintQuestion').value;
    const hintAnswer = document.getElementById('registerHintAnswer').value.trim();

    if (!email || !password || !confirmPassword) {
        triggerShakeEffect();
        showError('register-error-msg', '모든 가입 필드를 빈칸 없이 적어주세요.');
        return;
    }
    if (password !== confirmPassword) {
        triggerShakeEffect();
        showError('register-error-msg', '비밀번호와 비밀번호 확인이 서로 맞지 않습니다.');
        return;
    }
    // 비밀번호 정책 강화: 영문, 숫자 조합 최소 8자 이상
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!pwRegex.test(password)) {
        triggerShakeEffect();
        showError('register-error-msg', '비밀번호는 영문과 숫자를 조합하여 최소 8자 이상이어야 합니다.');
        return;
    }
    if (!hintAnswer) {
        triggerShakeEffect();
        showError('register-error-msg', '비밀번호 분실 시 사용할 힌트 답변을 입력해 주세요.');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.session) {
            alert('회원가입이 완료되었으며 자동 로그인되었습니다!');
            // 힌트 정보 적재
            await saveUserHint(data.session.user.id, data.session.user.email, hintQuestion, hintAnswer);
            await recordSignupLog(data.session.user.id, data.session.user.email);
            await recordLoginLog(data.session.user.id, data.session.user.email);
            closeModal('auth-modal');
        } else {
            alert('회원가입 성공! 가입 처리되었습니다.');
            closeModal('auth-modal');
        }
    } catch (err) {
        triggerShakeEffect();
        showError('register-error-msg', `회원가입 실패: ${err.message}`);
    }
}

// 회원가입 성공 시 이력 저장 함수
async function recordSignupLog(userId, email) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('user_signup_logs')
            .insert([{ user_id: userId, email: email }]);
        if (error) throw error;
    } catch (err) {
        console.error('회원가입 기록 저장 실패:', err.message);
    }
}

// 로그인 성공 시 이력 저장 함수 (중복 로깅 방지를 위해 sessionStorage 활용)
async function recordLoginLog(userId, email) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('user_login_logs')
            .insert([{ user_id: userId, email: email }]);
        if (error) throw error;
        
        // 이번 브라우저 탭 세션 내 재기록 방지 플래그 설정
        sessionStorage.setItem('login_logged', 'true');
    } catch (err) {
        console.error('로그인 기록 저장 실패:', err.message);
    }
}

// 로그인
async function handleSignIn() {
    if (!checkSupaConnected()) return;
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        triggerShakeEffect();
        showError('login-error-msg', '이메일과 비밀번호를 입력해주세요.');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        
        // 로그인 기록 추가
        if (data && data.user) {
            await recordLoginLog(data.user.id, data.user.email);
        }
        
        alert('로그인에 성공했습니다! 🌿');
        closeModal('auth-modal');
    } catch (err) {
        // 로그인 실패 시 인라인 에러 빨간 글씨 출력 및 쉐이크 모션 적용
        triggerShakeEffect();
        if (err.message === 'Invalid login credentials') {
            showError('login-error-msg', '등록되지 않은 계정입니다. 회원가입을 해주세요.');
        } else {
            showError('login-error-msg', `로그인 실패: ${err.message}`);
        }
    }
}

// 로그아웃
async function handleSignOut() {
    if (!checkSupaConnected()) return;

    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        // 로그인 로깅 플래그 초기화
        sessionStorage.removeItem('login_logged');
        alert('안전하게 로그아웃되었습니다.');
    } catch (err) {
        alert(`로그아웃 실패: ${err.message}`);
    }
}

// 비밀번호 찾기 (힌트 기반 모달 팝업으로 변경)
function handleForgotPassword() {
    closeModal('auth-modal');
    
    // 모달 상태 초기화 (1단계 활성화, 2단계 숨김)
    document.getElementById('pw-find-step1').classList.remove('hidden');
    document.getElementById('pw-find-step2').classList.add('hidden');
    document.getElementById('findEmail').value = '';
    document.getElementById('findAnswer').value = '';
    document.getElementById('findNewPassword').value = '';
    
    openModal('pw-find-modal');
}

// 1단계: 이메일 기반 힌트 질문 조회
async function checkUserHint() {
    if (!checkSupaConnected()) return;
    clearErrors();
    
    const email = document.getElementById('findEmail').value.trim();
    if (!email) {
        // 쉐이크 효과 트리거용 엘리먼트 가져오기
        const findModalContent = document.querySelector('#pw-find-modal .modal-content');
        if (findModalContent) {
            findModalContent.classList.add('shake');
            setTimeout(() => findModalContent.classList.remove('shake'), 400);
        }
        showError('find-error-msg-step1', '가입하신 이메일 주소를 입력해 주세요.');
        return;
    }
    
    try {
        const { data: question, error } = await supabaseClient.rpc('get_user_hint_question', { p_email: email });
        if (error) throw error;
        
        if (!question) {
            const findModalContent = document.querySelector('#pw-find-modal .modal-content');
            if (findModalContent) {
                findModalContent.classList.add('shake');
                setTimeout(() => findModalContent.classList.remove('shake'), 400);
            }
            showError('find-error-msg-step1', '등록되지 않은 계정입니다. 회원가입을 해주세요.');
            return;
        }
        
        // 질문 표시 및 2단계 전환
        document.getElementById('hint-question-display').textContent = question;
        document.getElementById('pw-find-step1').classList.add('hidden');
        document.getElementById('pw-find-step2').classList.remove('hidden');
    } catch (err) {
        const findModalContent = document.querySelector('#pw-find-modal .modal-content');
        if (findModalContent) {
            findModalContent.classList.add('shake');
            setTimeout(() => findModalContent.classList.remove('shake'), 400);
        }
        showError('find-error-msg-step1', `조회 실패: ${err.message}`);
    }
}

// 2단계: 답변 검증 및 비밀번호 변경 완료
async function resetPasswordByHint() {
    if (!checkSupaConnected()) return;
    clearErrors();
    
    const email = document.getElementById('findEmail').value.trim();
    const answer = document.getElementById('findAnswer').value.trim();
    const newPassword = document.getElementById('findNewPassword').value;
    
    if (!answer) {
        const findModalContent = document.querySelector('#pw-find-modal .modal-content');
        if (findModalContent) {
            findModalContent.classList.add('shake');
            setTimeout(() => findModalContent.classList.remove('shake'), 400);
        }
        showError('find-error-msg-step2', '힌트 답변을 입력해 주세요.');
        return;
    }

    // 새 비밀번호 유효성 검사
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!newPassword || !pwRegex.test(newPassword)) {
        const findModalContent = document.querySelector('#pw-find-modal .modal-content');
        if (findModalContent) {
            findModalContent.classList.add('shake');
            setTimeout(() => findModalContent.classList.remove('shake'), 400);
        }
        showError('find-error-msg-step2', '새 비밀번호는 영문과 숫자를 조합하여 최소 8자 이상이어야 합니다.');
        return;
    }

    try {
        const { data: success, error } = await supabaseClient.rpc('verify_hint_and_reset_password', {
            p_email: email,
            p_answer: answer,
            p_new_password: newPassword
        });
        
        if (error) throw error;
        
        if (success) {
            alert('비밀번호가 성공적으로 재설정되었습니다! 새 비밀번호로 로그인해 주세요. 🌿');
            closeModal('pw-find-modal');
            openModal('auth-modal');
        } else {
            // 힌트 불일치 시 모달 흔들림 효과 트리거 및 빨간 글씨 에러 출력
            const findModalContent = document.querySelector('#pw-find-modal .modal-content');
            if (findModalContent) {
                findModalContent.classList.add('shake');
                setTimeout(() => findModalContent.classList.remove('shake'), 400);
            }
            showError('find-error-msg-step2', '힌트 답변이 일치하지 않습니다. 다시 입력해 주세요.');
        }
    } catch (err) {
        const findModalContent = document.querySelector('#pw-find-modal .modal-content');
        if (findModalContent) {
            findModalContent.classList.add('shake');
            setTimeout(() => findModalContent.classList.remove('shake'), 400);
        }
        showError('find-error-msg-step2', `비밀번호 재설정 실패: ${err.message}`);
    }
}

// 비밀번호 변경
async function handleChangePassword() {
    if (!checkSupaConnected()) return;

    const newPassword = document.getElementById('newPassword').value;
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!newPassword || !pwRegex.test(newPassword)) {
        alert('비밀번호는 영문과 숫자를 조합하여 최소 8자 이상이어야 합니다.');
        return;
    }

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        alert('비밀번호가 성공적으로 업데이트되었습니다.');
        document.getElementById('newPassword').value = '';
        closeModal('pw-change-modal');
    } catch (err) {
        alert(`비밀번호 변경 실패: ${err.message}`);
    }
}

// 회원탈퇴 확인 모달 띄우기
function handleDeleteAccount() {
    if (!checkSupaConnected()) return;
    openModal('delete-account-modal');
}

// 실제 회원탈퇴 실행 (RPC 함수 delete_user 호출)
async function confirmDeleteAccount() {
    closeModal('delete-account-modal');
    
    try {
        // RPC delete_user() 함수 호출을 통해 원격 Supabase Auth 유저 및 데이터 삭제
        const { error } = await supabaseClient.rpc('delete_user');
        
        if (error) throw error;

        // 로컬 클라이언트 로그아웃 처리 및 알림
        await supabaseClient.auth.signOut();
        
        // 로그인 로깅 플래그 초기화
        sessionStorage.removeItem('login_logged');
        
        alert('회원 탈퇴가 완료되었습니다. 그동안 서비스를 이용해주셔서 감사합니다.');
        window.location.reload(); // 세션 초기화 및 페이지 갱신
    } catch (err) {
        alert(`탈퇴 처리 중 오류가 발생했습니다:\n${err.message}`);
    }
}

// 식단 데이터를 Supabase 클라우드 데이터베이스에 저장
async function saveMealToCloud() {
    if (!checkSupaConnected()) return;
    if (!activeSession || !activeSession.user) {
        alert('클라우드에 저장하시려면 먼저 로그인을 진행해 주세요.');
        return;
    }
    if (selectedFoods.length === 0) {
        alert('식탁에 올린 음식이 없습니다! 음식을 먼저 식탁에 올려놓으세요.');
        return;
    }

    const totalCo2 = parseFloat(document.getElementById('co2-value').textContent);
    
    // 식단 유형 입력 받기
    const mealType = prompt('이 식사의 이름을 입력해주세요. (예: 아침, 점심, 저녁, 오늘의 밥상 등)', '점심');
    if (!mealType) return;

    try {
        const { data, error } = await supabaseClient
            .from('user_meals')
            .insert([
                {
                    user_id: activeSession.user.id,
                    meal_type: mealType,
                    items: selectedFoods, // 음식 배열 그대로 JSONB로 입력
                    total_carbon: totalCo2
                }
            ]);

        if (error) throw error;
        alert('오늘 차린 밥상 식단이 Supabase 클라우드에 성공적으로 박제/저장되었습니다! ☁️');
        
        // 밥상 초기화
        selectedFoods = [];
        const activeTab = document.querySelector('.tab-btn.active');
        renderFoods(activeTab ? activeTab.dataset.category : 'all');
        updateTable();
    } catch (err) {
        alert(`클라우드 저장 실패: ${err.message}`);
    }
}