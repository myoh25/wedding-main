/* ───────── 상수 ───────── */
const SHARE_URL       = 'https://myoh25.github.io/wedding-card/';
const ROUGH_TIMESTAMP = '1753199064120';   // 약도 필요 시
const ROUGH_KEY       = 't9qyzkte6ci';

/* ───────── DOM 로드 후 ───────── */
document.addEventListener('DOMContentLoaded', () => {
  bindSaveButton();
  bindShareButton();
  initCopyButtons();
  initDDay();
  initPuzzle();        
  initKakaoMap();      
  initBgmAutoplay();   
});
/* ───────── 저장하기(히어로만) ───────── */
function bindSaveButton(){
  const btn  = document.getElementById('saveCard');
  const hero = document.getElementById('hero');
  if(!btn || !hero) return;

  const isKakao = /KAKAOTALK/i.test(navigator.userAgent);

  btn.addEventListener('click', async () => {
    try{
      const ratio = Math.min(2, 4096 / Math.max(hero.scrollWidth, hero.scrollHeight));
      const canvas = await html2canvas(hero, {useCORS:true, scale:ratio});

      /* ─── 카카오톡 인앱이면 바로 오버레이 ─── */
      if(isKakao){
        showOverlay(canvas.toDataURL('image/png'));   // ★ ①  dataURL 사용
        return;
      }

      /* ─── 일반 브라우저용 기존 로직 ─── */
      canvas.toBlob(async blob => {
        if(!blob) throw new Error('toBlob 실패');

        const file = new File([blob], 'wedding_hero.png', {type:'image/png'});
        const url  = URL.createObjectURL(blob);

        if (navigator.canShare?.({files:[file]})){
          await navigator.share({files:[file], title:'청첩장 히어로'});
          URL.revokeObjectURL(url);
          return;
        }

        const a = document.createElement('a');
        a.href = url; a.download = 'wedding_hero.png';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');

    }catch(e){
      alert('저장 실패 😢\n'+e.message);
      console.error(e);
    }
  });

  /* 오버레이 — DataURL 또는 Blob URL 모두 지원 */
  function showOverlay(src){
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;flex-direction:column;'
     +'align-items:center;justify-content:center;z-index:1000;';
    wrap.innerHTML = `
      <p style="color:#fff;font-size:1rem;margin-bottom:12px;text-align:center">
        길게 눌러 이미지를 저장하세요 😊
      </p>
      <img src="${src}" style="max-width:90%;height:auto;border:4px solid #fff">
    `;
    wrap.addEventListener('click', e=>{
      if(e.target===wrap) wrap.remove();
    });
    document.body.appendChild(wrap);
  }
}
/* ───────── 공유하기(URL 복사) ───────── */
function bindShareButton(){
  const btn = document.getElementById('shareUrl');    // 공유 버튼 id
  if(!btn) return;

  btn.addEventListener('click', () => {
    navigator.clipboard?.writeText(SHARE_URL)
      .then(() => showToast('모바일 청첩장 URL이 복사되었습니다 😊'))
      .catch(() => {                 // 옛 브라우저 폴백
        const ta=document.createElement('textarea');
        ta.value=SHARE_URL;document.body.appendChild(ta);
        ta.select();document.execCommand('copy');ta.remove();
        showToast('모바일 청첩장 URL이 복사되었습니다 😊');
      });
  });
}

/* ───────── 토스트 ───────── */
function showToast(msg){
  const d=document.createElement('div');
  d.textContent=msg;
  d.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%)'
                +';background:rgba(0,0,0,.8);color:#fff;padding:12px 18px;border-radius:24px'
                +';font-size:.9rem;z-index:999;';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2200);
}

/* ───────── 카카오 RoughMap(선택) ───────── */
function initKakaoMap(retry=0){
  if(!(window.daum && daum.roughmap)) {
    if(retry<20) return setTimeout(()=>initKakaoMap(retry+1),100);
    return;  // 실패
  }
  new daum.roughmap.Lander({
    timestamp:ROUGH_TIMESTAMP,
    key:ROUGH_KEY,
    mapWidth:'360',
    mapHeight:'240'
  }).render();
}

/******** D‑DAY ********/
function initDDay(){
  const el = document.getElementById('dText');
  if(!el) return;

  /* 한국시간 자정 기준으로 생성 (월은 0‑indexed) */
  const target = new Date(2025, 8, 20);       // 2025‑09‑20
  const today  = new Date();

  /* 시·분·초 제거 → 날짜만 비교 */
  target.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diff = Math.ceil((target - today) / 86400000);

  el.textContent =
    diff > 0  ? `민열♥️효정의 결혼식이 ${diff}일 남았습니다`
  : diff === 0 ? '오늘은 민열♥️효정의 결혼식 날입니다!'
               : '민열♥️효정의 결혼식이 지나갔습니다';
}

/******** 복사 토스트 ********/
function initCopyButtons(){
  document.addEventListener('click', e=>{
    const btn=e.target.closest('.copy-btn');
    if(!btn) return;
    navigator.clipboard?.writeText(btn.dataset.acc).then(showToast).catch(()=>{
      const ta=document.createElement('textarea');
      ta.value=btn.dataset.acc; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); showToast();
    });
  });
  function showToast(){
    const d=document.createElement('div');
    d.textContent='계좌번호가 복사되었습니다 😊';
    d.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:12px 18px;border-radius:24px;font-size:.9rem;z-index:999;';
    document.body.appendChild(d); setTimeout(()=>d.remove(),2200);
  }
}

/******** BGM ********/
function initBgmAutoplay(){
  const bgm = document.getElementById('bgm');
  const btn = document.getElementById('bgmToggle');
  if(!bgm || !btn) return;

  let playing = false;

  /* 첫 터치 후 자동 재생 */
  window.addEventListener('touchend', function once(){
    window.removeEventListener('touchend', once);
    bgm.play().then(()=>{
      playing = true;
      btn.innerHTML = '음악<br>끄기';     // ← textContent → innerHTML
    });
  }, { once:true, passive:true });

  /* 토글 버튼 */
  btn.addEventListener('click', () => {
    if(playing){
      bgm.pause();
      btn.innerHTML = '음악<br>켜기';      // 줄바꿈 유지
    }else{
      bgm.play();
      btn.innerHTML = '음악<br>끄기';
    }
    playing = !playing;
  });
}
/* --------------------------------------------------
   G. 라이트박스
   -------------------------------------------------- */
function openBox(img) {
  const src = img.src.replace(/=w\d+/, '=w2400');
  const lb  = document.getElementById('lb') || createLightbox();
  lb.querySelector('img').src = src;
  lb.style.display = 'flex';
}
function createLightbox() {
  const d = document.createElement('div');
  d.id = 'lb';
  d.innerHTML = '<img>';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.93);display:flex;'
                  + 'justify-content:center;align-items:center;z-index:1000;';
  d.addEventListener('click', e => {
    if (e.target.id === 'lb' || e.target.tagName === 'IMG') d.style.display = 'none';
  });
  document.body.appendChild(d);
  return d;
}

/* --------------------------------------------------
   H. 슬라이딩 퍼즐
   -------------------------------------------------- */
function initPuzzle(){
  const canvas = document.getElementById('puzzleCanvas');
  if(!canvas) return; // 퍼즐 섹션이 없으면 종료

  const ctx = canvas.getContext('2d');

  const img = new Image();
  // 필요에 따라 hi-res 이미지로 교체 가능
  img.src = 'https://cdn.jsdelivr.net/gh/myoh25/1/puzzle300.png';

  // CSS 표시 크기
  const displaySize = 300;
  const dpr  = window.devicePixelRatio || 1;
  const size = displaySize * dpr;

  canvas.style.width  = displaySize + 'px';
  canvas.style.height = displaySize + 'px';
  canvas.width  = size;
  canvas.height = size;
  ctx.scale(dpr, dpr);

  const rows = 3, cols = 3;
  const tileSize = displaySize / rows;
  let tiles = [];
  let empty = { row: rows - 1, col: cols - 1 };

  img.onload = () => {
    initTiles();
    shufflePuzzle();
    drawPuzzle();
  };

  function initTiles(){
    tiles = [];
    for(let r=0;r<rows;r++){
      tiles[r] = [];
      for(let c=0;c<cols;c++){
        tiles[r][c] = { row:r, col:c };
      }
    }
    tiles[empty.row][empty.col] = null; // 마지막 칸 비우기
  }

  function drawPuzzle(){
    ctx.clearRect(0,0,displaySize,displaySize);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const tile = tiles[r][c];
        if(tile){
          ctx.drawImage(
            img,
            tile.col*tileSize, tile.row*tileSize, tileSize, tileSize,
            c*tileSize,       r*tileSize,       tileSize, tileSize
          );
        }else{
          ctx.fillStyle = '#fff';
          ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
        }
      }
    }
  }

  function shufflePuzzle(){
    for(let i=0;i<1000;i++){
      const dirs = [
        {r:-1,c:0},{r:1,c:0},
        {r:0,c:-1},{r:0,c:1}
      ];
      const moves = dirs
        .map(d=>({row:empty.row+d.r,col:empty.col+d.c}))
        .filter(p=>p.row>=0 && p.row<rows && p.col>=0 && p.col<cols);
      const mv = moves[Math.floor(Math.random()*moves.length)];
      moveTile(mv.row,mv.col);
    }
    const msgEl = document.getElementById('message');
    if(msgEl) msgEl.textContent='';
    drawPuzzle();
  }

  function moveTile(r,c){
    if(
      (Math.abs(r-empty.row)===1 && c===empty.col) ||
      (Math.abs(c-empty.col)===1 && r===empty.row)
    ){
      tiles[empty.row][empty.col] = tiles[r][c];
      tiles[r][c] = null;
      empty = {row:r, col:c};
    }
  }

  canvas.addEventListener('click', e=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    moveTile(r,c);
    drawPuzzle();
    if(checkComplete()){
      const msgEl = document.getElementById('message');
      if(msgEl) msgEl.textContent = '🎉 성공!! 민열♥️효정의 사랑이 완성되었습니다 💍';
      
      revealReward();
    }
  });

  function checkComplete(){
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        if(r===empty.row && c===empty.col) continue;
        const tile = tiles[r][c];
        if(!tile || tile.row!==r || tile.col!==c) return false;
      }
    }
    return true;
  }

  // 퍼즐 섞기 버튼 전역
  window.shufflePuzzle = shufflePuzzle;
}
function revealReward(){
  const wrap   = document.getElementById('rewardWrap');
  const canvas = document.getElementById('puzzleCanvas');
  if(!wrap || wrap.classList.contains('show')) return;

  wrap.classList.add('show');
  canvas.style.pointerEvents = 'none';

  /* 닫은 뒤 자신을 제거하는 1회성 리스너 */
  const closeOnce = ()=>{
    wrap.classList.remove('show');
    canvas.style.pointerEvents = '';
    wrap.removeEventListener('click', closeOnce);
  };
  wrap.addEventListener('click', closeOnce, { once:true });
}
/* 메인 FAB 클릭 → 열기/닫기 토글 */
document.getElementById('fabMain')
        .addEventListener('click',()=>{
  document.getElementById('fab').classList.toggle('open');
});
// ===== 갤러리 스크립트 시작 (최종) =====

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const allImages = document.querySelectorAll('.gallery-grid img');
let currentImageIndex;

// 갤러리 열기
function openGallery(element, index) {
  history.pushState({ gallery: 'open' }, 'gallery', '#gallery');
  lightbox.classList.add('visible'); // visible 클래스 추가하여 보이기
  lightboxImg.src = element.src;
  currentImageIndex = index;
}

// 갤러리 닫기 (X 버튼 클릭 시)
function closeGallery() {
  if (history.state && history.state.gallery === 'open') {
    history.back();
  }
}

// 이전/다음 이미지로 변경
function changeImage(n, event) {
  event.stopPropagation();

  currentImageIndex += n;

  if (currentImageIndex >= allImages.length) {
    currentImageIndex = 0;
  }
  if (currentImageIndex < 0) {
    currentImageIndex = allImages.length - 1;
  }

  lightboxImg.src = allImages[currentImageIndex].src;
}

// 브라우저의 뒤로가기/앞으로가기 버튼 이벤트를 감지
window.addEventListener('popstate', function(event) {
  // lightbox에 visible 클래스가 있으면 제거하여 숨김
  if (lightbox.classList.contains('visible')) {
    lightbox.classList.remove('visible');
  }
});

// ===== 갤러리 스크립트 끝 =====
/* ==================== [추가] 스크롤 버튼 로직 ==================== */

// DOM 로드 후에 실행되도록 보장
document.addEventListener('DOMContentLoaded', () => {
  
  // HTML에서 버튼 요소들을 찾습니다.
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const scrollBottomBtn = document.getElementById('scrollBottomBtn');

  // 버튼이 페이지에 존재하는지 확인합니다.
  if (!scrollTopBtn || !scrollBottomBtn) {
    return;
  }

  // 페이지 스크롤 이벤트를 감지합니다.
  window.addEventListener('scroll', () => {
    // 만약 사용자가 조금이라도 스크롤을 내렸다면
    if (window.scrollY > 200) {
      scrollTopBtn.style.display = 'flex'; // '맨 위로' 버튼을 보여줍니다.
    } else {
      scrollTopBtn.style.display = 'none'; // '맨 위로' 버튼을 숨깁니다.
    }
  });

  // '맨 위로' 버튼 클릭 시
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0, // 페이지의 가장 위로
      behavior: 'smooth' // 부드럽게 스크롤
    });
  });

  // '맨 아래로' 버튼 클릭 시
  scrollBottomBtn.addEventListener('click', () => {
    window.scrollTo({
      top: document.body.scrollHeight, // 페이지의 가장 아래로
      behavior: 'smooth' // 부드럽게 스크롤
    });
  });

});
