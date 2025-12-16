// --- KONFIGURASI PROYEK ---
// 🚨 PENTING: GANTI DENGAN URL RAW GIST JSON ANDA YANG SEBENARNYA!
const GIST_RAW_URL = 'https://gist.githubusercontent.com/vokepvarokah1-sudo/e19d30781bf904e4419135f16a35092e/raw/c50ab1e32f20e0e1ceca3f3451aab4d026acf0c3/'; 
// const PLAYER_ENGINE_BASE_URL = 'https://[username].github.io/player-engine/embed.html'; // PROYEK 2 (DINONAKTIFKAN SEMENTARA)

const CACHE_KEY = 'played_videos_cache';
const COOLDOWN_MS = 200; 

// --- ELEMEN DOM UNTUK OPERASI ---
const MAIN_CONTENT_WRAPPER = document.getElementById('main-content-wrapper');
const ADBLOCK_WARNING = document.getElementById('adblock-warning-layer');
const ADBLOCK_TEST_ELEMENT = document.getElementById('ad-banner-test-block');
const DOWNLOAD_BTN = document.getElementById('download-btn');
const NEXT_BTN = document.getElementById('next-btn');
const PLAYER_PLACEHOLDER = document.getElementById('player-engine-placeholder');

let videoList = [];

// =========================================================
// BAGIAN 1: MANAJEMEN DATA & CACHE
// =========================================================

function loadCache() {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : [];
    } catch (e) {
        console.error("Error loading cache:", e);
        return [];
    }
}

function saveCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Error saving cache:", e);
    }
}

function getRandomUnplayedVideo() {
    if (videoList.length === 0) return null;

    let playedIds = loadCache();
    let unplayedVideos = videoList.filter(video => !playedIds.includes(video.id));

    if (unplayedVideos.length === 0) {
        console.log("CACHE RESET: Memulai siklus baru.");
        playedIds = [];
        unplayedVideos = videoList;
    }

    const randomIndex = Math.floor(Math.random() * unplayedVideos.length);
    const selectedVideo = unplayedVideos[randomIndex];

    playedIds.push(selectedVideo.id);
    saveCache(playedIds);

    return selectedVideo;
}

async function fetchVideoData() {
    try {
        const response = await fetch(GIST_RAW_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        videoList = await response.json();
        console.log(`Data Gist dimuat: ${videoList.length} video.`);
        
        // Setelah data dimuat, kita bisa muat video acak jika AdBlock tidak aktif
        if (!checkAdBlockStatus()) {
            const videoData = getRandomUnplayedVideo();
            if(videoData) updateUI(videoData);
        }
        
    } catch (e) {
        console.error("Gagal memuat data dari Gist:", e);
        if (!checkAdBlockStatus()) {
             ADBLOCK_WARNING.querySelector('.message-box h1').textContent = '⚠️ Gagal Memuat Konten';
             ADBLOCK_WARNING.querySelector('.message-box p').textContent = 'Tidak dapat terhubung ke sumber data video. Cek Gist URL Anda.';
             ADBLOCK_WARNING.style.display = 'flex';
             MAIN_CONTENT_WRAPPER.style.display = 'none';
        }
    }
}

// =========================================================
// BAGIAN 2: LOGIKA DETEKSI ADBLOCK (Fix Final)
// =========================================================

function checkAdBlockStatus() {
    // Cek apakah elemen uji (yang dinamai seperti iklan) disembunyikan AdBlock
    const isHidden = getComputedStyle(ADBLOCK_TEST_ELEMENT).display === 'none' || 
                     ADBLOCK_TEST_ELEMENT.offsetHeight === 0 ||
                     ADBLOCK_TEST_ELEMENT.offsetWidth === 0;
    
    return isHidden;
}

function triggerAdBlockAction(loadNewVideo = false) {
    
    // Memberikan jeda waktu agar AdBlock sempat memblokir filter
    setTimeout(() => {
        const isAdBlockActive = checkAdBlockStatus();

        if (isAdBlockActive) {
            // --- ADBLOCK AKTIF ---
            MAIN_CONTENT_WRAPPER.style.display = 'none'; 
            ADBLOCK_WARNING.style.display = 'flex';     
            console.log("DETEKSI ADBLOCK: AKTIF. Konten disembunyikan.");
        } else {
            // --- ADBLOCK NON-AKTIF ---
            MAIN_CONTENT_WRAPPER.style.display = 'block'; 
            ADBLOCK_WARNING.style.display = 'none';      
            
            if (loadNewVideo || PLAYER_PLACEHOLDER.innerHTML === '') {
                 if (videoList.length > 0) {
                     const videoData = getRandomUnplayedVideo();
                     if(videoData) updateUI(videoData);
                 } else {
                     fetchVideoData(); 
                 }
            }
        }
    }, COOLDOWN_MS); 
}

// =========================================================
// BAGIAN 3: UPDATE UI & INISIALISASI
// =========================================================

function updateUI(videoObject) {
    // --- MODE PENGUJIAN VIDEO LANGSUNG (TANPA IFRAME PROYEK 2) ---
    // Pastikan #player-engine-placeholder ada di index.html!
    
    PLAYER_PLACEHOLDER.innerHTML = 
        `<video id="test-video-player" controls preload="auto" width="100%" height="100%" playsinline>
             <source src="${videoObject.play}" type="video/mp4">
             Maaf, browser Anda tidak mendukung tag video.
         </video>`;
         
    // Pastikan video memenuhi div responsif
    const videoElement = document.getElementById('test-video-player');
    if (videoElement) {
        videoElement.style.position = 'absolute'; // Style dari CSS responsif
        videoElement.style.top = '0';
        videoElement.style.left = '0';
    }

    // Sinkronisasi: Update tombol Download ke Safelink
    DOWNLOAD_BTN.href = videoObject.download;
    
    console.log(`Video ID: ${videoObject.id} dimuat LANGSUNG untuk TESTING.`);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data Gist dan cek AdBlock saat halaman dimuat
    fetchVideoData();

    // 2. Event Listener untuk Tombol Next
    NEXT_BTN.addEventListener('click', () => {
        triggerAdBlockAction(true); // Meminta muat video baru
    });
    
    // 3. Prevent Download jika AdBlock aktif
    DOWNLOAD_BTN.addEventListener('click', (e) => {
        if (checkAdBlockStatus()) {
             e.preventDefault();
             alert("Mohon matikan AdBlock Anda untuk melanjutkan ke proses Download.");
        }
    });
});
