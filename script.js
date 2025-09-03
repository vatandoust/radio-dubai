const audio = new Audio('https://a10.asurahosting.com:7070/radio.mp3');
const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('play-icon');
const progress = document.getElementById('progress');
const currentTimeElement = document.getElementById('current-time');
const volumeButton = document.getElementById('volume-button');
const volumeSlider = document.getElementById('volume-slider');
const volumePercentage = document.getElementById('volume-percentage');
const volumeWave1 = document.getElementById('volume-wave-1');
const volumeWave2 = document.getElementById('volume-wave-2');

let isPlaying = false;
let isMuted = false;
let previousVolume = 100;
let radioInfoInterval = null;

function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

async function fetchRadioInfo() {
    try {
        const response = await fetch('https://radio.streamingcpanel.com/cp/get_info.php?p=8038');
        const data = await response.json();
        
        const trackInfoElement = document.querySelector('.track-info h3');
        const trackArtistElement = document.querySelector('.track-info p');
        
        if (data.title) {
            trackInfoElement.textContent = truncateText(data.title, 44);
        }
        
        if (data.artist) {
            trackArtistElement.textContent = data.artist;
        } else if (data.description) {
            trackArtistElement.textContent = data.description;
        }
        
        if (data.art && data.art !== '') {
            const albumArt = document.querySelector('.album-art');
            albumArt.src = data.art;
            albumArt.alt = `Portada de ${data.title || 'Radio Universal'}`;
        }
        
        const listenerCountElement = document.getElementById('listener-count');
        if (data.listeners) {
            listenerCountElement.textContent = `${data.listeners} oyentes`;
        } else {
            const randomListeners = Math.floor(Math.random() * 500) + 800;
            listenerCountElement.textContent = `${randomListeners.toLocaleString()} oyentes`;
        }
    } catch (error) {
        console.log('Error fetching radio info:', error);
    }
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        if (radioInfoInterval) {
            clearInterval(radioInfoInterval);
            radioInfoInterval = null;
        }
    } else {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            audio.src = 'https://radio.streamingcpanel.com/8038/stream';
        }
        
        audio.play().catch(error => {
            console.log('Playback error:', error);
            showPlayPrompt();
        });
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        fetchRadioInfo();
        radioInfoInterval = setInterval(fetchRadioInfo, 10000);
    }
    isPlaying = !isPlaying;
}

function updateProgress() {
    progress.style.width = `100%`;
}

function updateVolume() {
    const volume = volumeSlider.value / 100;
    audio.volume = volume;
    volumePercentage.textContent = `${volumeSlider.value}%`;

    if (volume === 0) {
        volumeButton.classList.add('muted');
        volumeWave1.setAttribute('opacity', '0');
        volumeWave2.setAttribute('opacity', '0');
    } else {
        volumeButton.classList.remove('muted');
        volumeWave1.setAttribute('opacity', volume > 0.3 ? '0.5' : '0');
        volumeWave2.setAttribute('opacity', volume > 0.6 ? '0.5' : '0');
    }
}

function toggleMute() {
    if (!isMuted) {
        previousVolume = volumeSlider.value;
        volumeSlider.value = 0;
        isMuted = true;
    } else {
        volumeSlider.value = previousVolume;
        isMuted = false;
    }
    updateVolume();
}

function showPlayPrompt() {
    const prompt = document.getElementById('play-instruction');
    if (prompt) prompt.style.display = 'block';
}

function hidePlayPrompt() {
    const prompt = document.getElementById('play-instruction');
    if (prompt) prompt.style.display = 'none';
}

async function checkStreamAvailability() {
    try {
        const response = await fetch('https://a10.asurahosting.com:7070/radio.mp3', { method: 'HEAD' });
        if (!response.ok) {
            throw new Error('Stream server not responding');
        }
        return true;
    } catch (error) {
        console.error('Error checking stream:', error);
        showErrorPrompt('Error de conexión al servidor de streaming. Por favor, intenta de nuevo.');
        return false;
    }
}

function showErrorPrompt(message) {
    const prompt = document.createElement('div');
    prompt.id = 'error-prompt';
    prompt.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.9); color: white; padding: 10px 20px;
        border-radius: 5px; z-index: 3000; font-size: 14px;
    `;
    prompt.textContent = message;
    document.body.appendChild(prompt);
    setTimeout(() => prompt.remove(), 5000);
}

function setupIOSAudio() {
    document.addEventListener('touchstart', initializeAudioForIOS, { once: true });
    
    function initializeAudioForIOS() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const silentBuffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed for iOS');
                attemptAutoplay();
            }).catch(err => console.error('Error resuming AudioContext:', err));
        } else {
            console.log('Audio initialized for iOS');
            attemptAutoplay();
        }
    }
}

function attemptAutoplay() {
    checkStreamAvailability().then(isAvailable => {
        if (!isAvailable) return;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
                fetchRadioInfo();
                radioInfoInterval = setInterval(fetchRadioInfo, 10000);
                hidePlayPrompt();
            }).catch(error => {
                console.log('Autoplay was prevented:', error);
                showPlayPrompt();
                playButton.addEventListener('click', () => {
                    audio.play().catch(console.error);
                    hidePlayPrompt();
                }, { once: true });
            });
        }
    });
}

playButton.addEventListener('click', togglePlay);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    isPlaying = false;
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    if (radioInfoInterval) {
        clearInterval(radioInfoInterval);
        radioInfoInterval = null;
    }
});

volumeSlider.addEventListener('input', updateVolume);
volumeButton.addEventListener('click', toggleMute);

updateVolume();

const heroDescriptionElement = document.getElementById('hero-description');
const descriptionsToType = [
    'Escucha aqui tus artistas favoritos.',
    'Descubra nuevos sonidos en radio Universo.',
    'Música sin límites, siempre a su alcance.',
    'La mejor experiencia musical en todo momento!'
];

let currentDescriptionIndex = 0;
let isDeleting = false;
let typingSpeed = 50;
let deletingSpeed = 30;

function typeDescription() {
    const currentDescription = descriptionsToType[currentDescriptionIndex];
    const currentText = heroDescriptionElement.textContent;

    if (!isDeleting) {
        if (currentText.length < currentDescription.length) {
            heroDescriptionElement.textContent = currentDescription.substring(0, currentText.length + 1);
            setTimeout(typeDescription, typingSpeed);
        } else {
            isDeleting = true;
            setTimeout(typeDescription, 2000);
        }
    } else {
        if (currentText.length > 0) {
            heroDescriptionElement.textContent = currentDescription.substring(0, currentText.length - 1);
            setTimeout(typeDescription, deletingSpeed);
        } else {
            isDeleting = false;
            currentDescriptionIndex = (currentDescriptionIndex + 1) % descriptionsToType.length;
            setTimeout(typeDescription, typingSpeed);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        setupIOSAudio();
        document.body.classList.add('ios-device');
    } else {
        attemptAutoplay();
    }
    
    typeDescription();
    fetchRadioInfo();

    function esDispositivoMovil() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function compartir() {
        fallbackShare();
    }

    window.compartir = compartir;

    const shareButton = document.querySelector('.btn-share');

    function fallbackShare() {
        const shareModal = createShareModal();
        shareModal.style.display = 'block';
    }

    function createShareModal() {
        let existingModal = document.getElementById('share-modal');
        if (existingModal) return existingModal;

        const modal = document.createElement('div');
        modal.id = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <span class="share-modal-close">&times;</span>
                <h3>Compartir Radio Universo</h3>
                <div class="share-options">
                    <button class="share-option" data-platform="copy">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copiar enlace
                    </button>
                    <button class="share-option" data-platform="whatsapp">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.669.15-.197.297-.768.966-.94 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.608.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612