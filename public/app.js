// ================= МЕНЮ =================
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
menuBtn.onclick = () => { menuBtn.classList.toggle('active'); sideMenu.classList.toggle('open'); };

const homeLink = document.getElementById('homeLink');
homeLink.onclick = (e) => {
  e.preventDefault();
  menuBtn.classList.remove('active');
  sideMenu.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================= ТРЕКИ + ПЛЕЕР =================
const audio = document.getElementById('audio');
const playerBar = document.getElementById('playerBar');
const barCover = document.getElementById('barCover');
const barTitle = document.getElementById('barTitle');
const barArtist = document.getElementById('barArtist');
const playIcon = document.getElementById('playIcon');
const playPauseBtn = document.getElementById('playPauseBtn');
const seek = document.getElementById('seek');
const timeEl = document.getElementById('time');
const trackListEl = document.getElementById('trackList');

let tracks = [];
let currentIndex = -1;

function fmtTime(sec){
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderTracks(){
  trackListEl.innerHTML = '';
  tracks.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'track';
    el.innerHTML = `
      <div class="track-index">${String(i+1).padStart(2,'0')}</div>
      <div class="play-icon"></div>
      <div class="cover" style="background:${t.cover}"></div>
      <div class="track-info">
        <div class="track-title">${t.title}</div>
        <div class="track-artist">${t.artist}</div>
      </div>
      <div class="track-duration">${t.duration}</div>
    `;
    el.onclick = () => playTrack(i);
    trackListEl.appendChild(el);
  });
}

function playTrack(i){
  currentIndex = i;
  const t = tracks[i];
  audio.src = t.audioUrl;
  audio.play();
  barCover.style.background = t.cover;
  barTitle.textContent = t.title;
  barArtist.textContent = t.artist;
  playerBar.classList.add('show');
  updatePlayIcon(true);
  highlightPlaying();
}

function highlightPlaying(){
  [...trackListEl.children].forEach((el, i) => {
    el.classList.toggle('playing', i === currentIndex);
  });
}

function updatePlayIcon(isPlaying){
  playIcon.className = isPlaying ? 'icon-pause' : 'icon-play';
  playIcon.innerHTML = isPlaying ? '<span></span><span></span>' : '';
}

playPauseBtn.onclick = () => {
  if (currentIndex === -1) return;
  if (audio.paused) { audio.play(); updatePlayIcon(true); }
  else { audio.pause(); updatePlayIcon(false); }
};

document.getElementById('nextBtn').onclick = () => {
  if (currentIndex === -1) return;
  playTrack((currentIndex + 1) % tracks.length);
};
document.getElementById('prevBtn').onclick = () => {
  if (currentIndex === -1) return;
  playTrack((currentIndex - 1 + tracks.length) % tracks.length);
};

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  seek.value = (audio.currentTime / audio.duration) * 100;
  timeEl.textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
});
audio.addEventListener('ended', () => {
  document.getElementById('nextBtn').onclick();
});
seek.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
});

// загрузка треков с бэкенда
fetch('/api/tracks')
  .then(res => res.json())
  .then(data => { tracks = data; renderTracks(); })
  .catch(() => { trackListEl.innerHTML = '<div class="section-label">Не удалось загрузить треки</div>'; });
