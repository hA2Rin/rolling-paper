const SUPABASE_URL = 'https://ivxnjdmkqddkjoogxytk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2eG5qZG1rcWRka2pvb2d4eXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjQ1NzYsImV4cCI6MjA5MTA0MDU3Nn0.7J1nApGNM_UetESFTQYyqQQsjvMH_ITbc9WBPB0UjZs';

let _supabase;
const getEl = (id) => document.getElementById(id);
let myPosts = JSON.parse(localStorage.getItem('myRollingPapers')) || [];
const colors = ['#FFF9C4', '#F1F8E9', '#E3F2FD', '#FCE4EC', '#F3E5F5', '#E8F5E9'];

// [필수] 페이지 로드 시 엔진 초기화 및 이벤트 연결
window.onload = () => {
    if (typeof supabase !== 'undefined') {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase 준비 완료!");
        loadNotes();
        setupKeys(); // 엔터 키 설정 실행
    } else {
        alert("Supabase 라이브러리 로드 실패! 인터넷 연결이나 HTML 코드를 확인하세요.");
    }
};

// 엔터 키 확실하게 잡기
function setupKeys() {
    // 제목에서 엔터 치면 등록
    getEl('note-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNote();
        }
    });

    // 내용에서 그냥 엔터는 등록, Shift+Enter는 줄바꿈
    getEl('note-content').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
    });
}

async function loadNotes() {
    const { data } = await _supabase.from('rolling_paper').select('*').order('id', { ascending: true });
    if (data) {
        getEl('board').innerHTML = '';
        data.forEach(note => renderPostIt(note.post_id, note.title, note.content, note.img_src));
    }
}

function renderPostIt(id, title, content, imgSrc) {
    const board = getEl('board');
    const note = document.createElement('div');
    note.className = 'post-it';
    if (myPosts.includes(id)) note.classList.add('mine'); 
    note.id = id;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomRotate = Math.floor(Math.random() * 8) - 4;
    note.style.backgroundColor = randomColor;
    note.style.transform = `rotate(${randomRotate}deg)`;
    let html = `<button class="del-btn" onclick="openDeleteConfirm('${id}')">×</button>`;
    if (imgSrc) html += `<img src="${imgSrc}">`;
    if (title) html += `<h3>${title}</h3>`;
    if (content) html += `<p>${content}</p>`;
    note.innerHTML = html;
    board.appendChild(note);
}

function openModal() { getEl('modal').style.display = 'flex'; }
function closeModal() {
    getEl('modal').style.display = 'none';
    getEl('note-title').value = '';
    getEl('note-content').value = '';
    getEl('note-image').value = '';
    getEl('file-name').innerText = '';
}

function showAlert(msg) {
    getEl('alert-message').innerText = msg;
    getEl('alert-modal').style.display = 'flex';
}
function closeAlert() { getEl('alert-modal').style.display = 'none'; }

async function addNote() {
    const title = getEl('note-title').value.trim();
    const content = getEl('note-content').value.trim();
    const imageFile = getEl('note-image').files[0];

    if (!title) { showAlert("제목을 입력해주세요!"); return; }
    if (!content && !imageFile) { showAlert("내용을 입력하거나 사진을 첨부해주세요!"); return; }

    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "등록 중...";
    submitBtn.disabled = true;

    const postId = "post_" + Date.now();
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => saveToSupabase(postId, title, content, e.target.result);
        reader.readAsDataURL(imageFile);
    } else {
        saveToSupabase(postId, title, content, null);
    }
}

async function saveToSupabase(postId, title, content, imgSrc) {
    const { error } = await _supabase.from('rolling_paper').insert([
        { post_id: postId, title: title, content: content, img_src: imgSrc }
    ]);

    if (!error) {
        myPosts.push(postId);
        localStorage.setItem('myRollingPapers', JSON.stringify(myPosts));
        renderPostIt(postId, title, content, imgSrc);
        closeModal();
    } else {
        alert("저장 실패: " + error.message);
    }
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "완료";
    submitBtn.disabled = false;
}

// 삭제
function openDeleteConfirm(id) {
    deleteTargetId = id;
    getEl('delete-confirm-modal').style.display = 'flex';
}
function closeDeleteConfirm() { getEl('delete-confirm-modal').style.display = 'none'; }
async function confirmDelete() {
    const { error } = await _supabase.from('rolling_paper').delete().eq('post_id', deleteTargetId);
    if (!error) {
        const target = document.getElementById(deleteTargetId);
        if(target) target.remove();
        closeDeleteConfirm();
    }
}

document.addEventListener('change', (e) => {
    if(e.target.id === 'note-image') getEl('file-name').innerText = e.target.files[0] ? e.target.files[0].name : "";
});