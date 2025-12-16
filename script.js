// --- KONFIGURASI PROYEK ---
// 🚨 PENTING: GANTI DENGAN URL RAW GIST JSON ANDA YANG SEBENARNYA!
const GIST_RAW_URL = 'https://gist.githubusercontent.com/vokepvarokah1-sudo/e19d30781bf904e4419135f16a35092e/raw/c50ab1e32f20e0e1ceca3f3451aab4d026acf0c3'; 
const PLAYER_ENGINE_BASE_URL = 'https://[username].github.io/player-engine/embed.html'; // 🚨 ASUMSI URL PROYEK 2
const CACHE_KEY = 'played_videos_cache';
const COOLDOWN_MS = 200; // Jeda 200ms untuk deteksi AdBlock

// --- ELEMEN DOM UNTUK OPERASI ---
const MAIN_CONTENT_WRAPPER = document.getElementById('main-content-wrapper');
const ADBLOCK_WARNING = document.getElementById('adblock-warning-layer');
const ADBLOCK_TEST_ELEMENT = document.getElementById('ad-banner-test-block');
const DOWNLOAD_BTN = document.getElementById('download-btn');
const NEXT_BTN = document.getElementById('next-btn');
const PLAYER_PLACEHOLDER = document.getElementById('player-engine-placeholder');

let videoList = [];

// =========================================================
// BAGIAN 1: MANAJEMEN DATA & CACHE (GIST & Randomizer)
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
    let playedIds = loadCache();
    let unplayedVideos = videoList.filter(video => !playedIds.includes(video.id));

    // Jika semua video sudah dimainkan, reset cache
    if (unplayedVideos.length === 0) {
        console.log("CACHE RESET: Memulai siklus baru.");
        playedIds = [];
        unplayedVideos = videoList;
    }

    const randomIndex = Math.floor(Math.random() * unplayedVideos.length);
    const selectedVideo = unplayedVideos[randomIndex];

    // Update cache
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
        
        // Setelah data dimuat, kita bisa muat video acak
        if (!checkAdBlockStatus()) {
            const videoData = getRandomUnplayedVideo();
            updateUI(videoData);
        }
        
    } catch (e) {
        console.error("Gagal memuat data dari Gist:", e);
        // Tampilkan pesan gagal loading jika AdBlock tidak aktif
        if (!checkAdBlockStatus()) {
             ADBLOCK_WARNING.querySelector('.message-box h1').textContent = '⚠️ Gagal Memuat Konten';
             ADBLOCK_WARNING.querySelector('.message-box p').textContent = 'Tidak dapat terhubung ke sumber data video.';
             ADBLOCK_WARNING.style.display = 'flex';
             MAIN_CONTENT_WRAPPER.style.display = 'none';
        }
    }
}

// =========================================================
// BAGIAN 2: LOGIKA DETEKSI ADBLOCK (Inti Perbaikan)
// =========================================================

// Fungsi murni untuk memeriksa status AdBlock saat ini
function checkAdBlockStatus() {
    // Cek apakah elemen uji (yang dinamai seperti iklan) disembunyikan AdBlock
    const isHidden = getComputedStyle(ADBLOCK_TEST_ELEMENT).display === 'none' || 
                     ADBLOCK_TEST_ELEMENT.offsetHeight === 0 ||
                     ADBLOCK_TEST_ELEMENT.offsetWidth === 0;
    
    return isHidden;
}

// Fungsi yang memicu aksi berdasarkan status AdBlock
function triggerAdBlockAction(loadNewVideo = false) {
    
    // Memberikan jeda waktu agar AdBlock sempat memblokir elemen
    setTimeout(() => {
        const isAdBlockActive = checkAdBlockStatus();

        if (isAdBlockActive) {
            // --- ADBLOCK AKTIF (PLAYER DAN IKLAN DIHILANGKAN) ---
            MAIN_CONTENT_WRAPPER.style.display = 'none'; 
            ADBLOCK_WARNING.style.display = 'flex';     // Tampilkan pesan warning
            console.log("DETEKSI ADBLOCK: AKTIF. Konten disembunyikan.");
        } else {
            // --- ADBLOCK NON-AKTIF (PLAYER TAMPIL) ---
            MAIN_CONTENT_WRAPPER.style.display = 'block'; 
            ADBLOCK_WARNING.style.display = 'none';      // Sembunyikan pesan warning
            
            // Muat video jika diminta atau jika belum ada
            if (loadNewVideo || PLAYER_PLACEHOLDER.innerHTML === '') {
                 if (videoList.length > 0) {
                     const videoData = getRandomUnplayedVideo();
                     updateUI(videoData);
                 } else {
                     // Jika data belum dimuat, coba ambil data Gist
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
    // Membangun URL iframe ke Proyek 2 (Player Engine)
    // Menggunakan encodeURIComponent agar URL video aman dikirim
    const playerEngineUrl = `${PLAYER_ENGINE_BASE_URL}?v=${encodeURIComponent(videoObject.play)}`;
    
    // Ganti div placeholder dengan iframe Proyek 2
    PLAYER_PLACEHOLDER.innerHTML = 
        `<iframe src="${playerEngineUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    
    // Sinkronisasi: Update tombol Download ke Safelink
    DOWNLOAD_BTN.href = videoObject.download;
    
    console.log(`Video ID: ${videoObject.id} dimuat. Player disinkronkan ke Proyek 2.`);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data Gist terlebih dahulu
    fetchVideoData();

    // 2. Event Listener untuk Tombol Next
    NEXT_BTN.addEventListener('click', () => {
        // Panggil aksi AdBlock dan minta muat video baru (true)
        triggerAdBlockAction(true); 
    });
    
    // 3. Event listener untuk download
    DOWNLOAD_BTN.addEventListener('click', (e) => {
        // Cek AdBlock sebelum mengizinkan klik download
        if (checkAdBlockStatus()) {
             e.preventDefault();
             alert("Mohon matikan AdBlock Anda untuk melanjutkan ke proses Download.");
        }
    });
});
