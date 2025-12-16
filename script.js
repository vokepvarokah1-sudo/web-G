// --- KONFIGURASI ---
// GANTI DENGAN URL RAW GIST JSON ANDA!
const GIST_RAW_URL = 'https://gist.githubusercontent.com/vokepvarokah1-sudo/e19d30781bf904e4419135f16a35092e/raw/c50ab1e32f20e0e1ceca3f3451aab4d026acf0c3';
const CACHE_KEY = 'played_videos_cache';
const PLAYER_PLACEHOLDER = document.getElementById('player-engine-placeholder');
const PLAYER_CONTAINER = document.getElementById('video-ad-container');
const ADBLOCK_WARNING = document.getElementById('adblock-warning-layer');
const DOWNLOAD_BTN = document.getElementById('download-btn');
const NEXT_BTN = document.getElementById('next-btn');

let videoList = [];

// --- 1. MANAJEMEN CACHE VIDEO (LocalStorage) ---

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

// --- 2. RANDOMIZER & SINKRONISASI ---

function getRandomUnplayedVideo() {
    let playedIds = loadCache();
    
    // Filter video yang belum dimainkan (berdasarkan 'id')
    let unplayedVideos = videoList.filter(video => !playedIds.includes(video.id));

    // Jika semua video sudah dimainkan (cache habis)
    if (unplayedVideos.length === 0) {
        console.log("CACHE RESET: Semua video telah dimainkan. Memulai siklus baru.");
        playedIds = []; // Reset cache
        unplayedVideos = videoList; // Gunakan seluruh list
    }

    // Pilih video secara acak dari yang tersisa
    const randomIndex = Math.floor(Math.random() * unplayedVideos.length);
    const selectedVideo = unplayedVideos[randomIndex];

    // Update cache
    playedIds.push(selectedVideo.id);
    saveCache(playedIds);

    return selectedVideo;
}

function updateUI(videoObject) {
    // Proyek 1: Hanya mengirim URL ke player placeholder
    PLAYER_PLACEHOLDER.src = videoObject.play;
    PLAYER_PLACEHOLDER.load();
    
    // Sinkronisasi: Update tombol Download ke Safelink
    DOWNLOAD_BTN.href = videoObject.download;
    
    console.log(`Video ID: ${videoObject.id} dimuat. Safelink disinkronkan.`);
}


// --- 3. DETEKSI ADBLOCK (Inti Logika) ---

function checkAdBlockAndLoad() {
    const adTestElement = document.getElementById('banner_ad_test');

    // Teknik Deteksi: Cek apakah AdBlock menyembunyikan elemen uji kita
    // Menggunakan timeout karena AdBlock butuh waktu singkat untuk memblokir
    setTimeout(() => {
        // Cek style display: none, visibility: hidden, atau ukuran 0
        const isHidden = getComputedStyle(adTestElement).display === 'none' || 
                         adTestElement.offsetHeight === 0;

        if (isHidden) {
            // --- ADBLOCK AKTIF (Iklan Dihilangkan) ---
            PLAYER_CONTAINER.style.display = 'none'; // Sembunyikan Player
            ADBLOCK_WARNING.style.display = 'flex'; // Tampilkan Pesan Warning (Layer Bawah)
            console.log("DETEKSI ADBLOCK: AKTIF. Player disembunyikan.");
        } else {
            // --- ADBLOCK NON-AKTIF (Player Tampil) ---
            PLAYER_CONTAINER.style.display = 'block'; // Tampilkan Player
            ADBLOCK_WARNING.style.display = 'none'; // Sembunyikan Pesan Warning
            
            if (videoList.length > 0) {
                 const videoData = getRandomUnplayedVideo();
                 updateUI(videoData);
            } else {
                console.error("Data video belum dimuat atau kosong.");
            }
        }
    }, 100); // Beri jeda 100ms agar AdBlock sempat memblokir
}

// --- 4. DATA FETCHING (Gist) ---

async function fetchVideoData() {
    try {
        const response = await fetch(GIST_RAW_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        videoList = await response.json();
        console.log(`Data dari Gist berhasil dimuat: ${videoList.length} video.`);
        
        // Setelah data dimuat, kita bisa menjalankan AdBlock check
        checkAdBlockAndLoad();
        
    } catch (e) {
        console.error("Gagal memuat data dari Gist:", e);
        ADBLOCK_WARNING.style.display = 'flex';
        ADBLOCK_WARNING.querySelector('.message-box h1').textContent = '⚠️ Gagal Memuat Konten';
        ADBLOCK_WARNING.querySelector('.message-box p').textContent = 'Tidak dapat terhubung ke sumber data video (Gist). Mohon coba lagi nanti.';
    }
}

// --- 5. INITIALISASI ---

document.addEventListener('DOMContentLoaded', () => {
    // Mulai dengan memuat data dan menjalankan AdBlock check
    fetchVideoData();

    // Event Listener untuk Tombol Next
    NEXT_BTN.addEventListener('click', () => {
        // Cek AdBlock lagi setiap kali Next diklik (opsional, tapi bagus untuk konsistensi)
        checkAdBlockAndLoad();
    });
});
