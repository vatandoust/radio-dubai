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

// Function to fetch radio information from API
async function fetchRadioInfo() {
    try {
        const response = await fetch('https://radio.streamingcpanel.com/cp/get_info.php?p=8038');
        const data = await response.json();
        
        // Update track info
        const trackInfoElement = document.querySelector('.track-info h3');
        const trackArtistElement = document.querySelector('.track-info p');
        
        if (data.title) {
            // Truncate title if longer than 44 characters
            trackInfoElement.textContent = truncateText(data.title, 44);
        }
        
        if (data.artist) {
            trackArtistElement.textContent = data.artist;
        } else if (data.description) {
            trackArtistElement.textContent = data.description;
        }
        
        // Update album art if available
        if (data.art && data.art !== '') {
            const albumArt = document.querySelector('.album-art');
            albumArt.src = data.art;
            albumArt.alt = `Portada de ${data.title || 'Radio Universal'}`;
        }
        
        // Update listener count if available
        const listenerCountElement = document.getElementById('listener-count');
        if (data.listeners) {
            listenerCountElement.textContent = `${data.listeners} oyentes`;
        } else {
            // Generate a random listener count for demo purposes
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
        // Stop fetching radio info when paused
        if (radioInfoInterval) {
            clearInterval(radioInfoInterval);
            radioInfoInterval = null;
        }
    } else {
        // iOS specific handling
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            // Force reload the stream for iOS which sometimes has issues with resumed streams
            audio.src = 'https://radio.streamingcpanel.com/8038/stream';
        }
        
        audio.play().catch(error => {
            console.log('Autoplay was prevented:', error);
            // iOS specific error handling
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                alert('Toca el botón de reproducción para comenzar a escuchar la radio');
            }
        });
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        // Start fetching radio info when playing
        fetchRadioInfo(); // Immediate fetch
        radioInfoInterval = setInterval(fetchRadioInfo, 10000); // Update every 10 seconds
    }
    isPlaying = !isPlaying;
}

function updateProgress() {
    // Since it's a live stream, we'll just keep the progress bar static or remove it
    progress.style.width = `100%`;
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

// iOS specific audio handling
function setupIOSAudio() {
    // iOS requires user interaction to play audio
    document.addEventListener('touchstart', initializeAudioForIOS, { once: true });
    
    function initializeAudioForIOS() {
        // Create and play a silent buffer to unlock audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const silentBuffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        // Resume audio context if suspended (iOS requirement)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        console.log('Audio initialized for iOS');
    }
}

// Autoplay with user interaction fallback
function attemptAutoplay() {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Successful autoplay
            isPlaying = true;
            playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }).catch(error => {
            console.log('Autoplay was prevented:', error);
            // Add click listener to play when user interacts
            playButton.addEventListener('click', () => {
                audio.play().catch(console.error);
            }, { once: true });
        });
    }
}

playButton.addEventListener('click', togglePlay);
// timeupdate listener is kept but will not show meaningful progress for live stream
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    // Audio stream ended (might happen if stream is interrupted)
    isPlaying = false;
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    // Stop fetching radio info when stream ends
    if (radioInfoInterval) {
        clearInterval(radioInfoInterval);
        radioInfoInterval = null;
    }
});

volumeSlider.addEventListener('input', updateVolume);
volumeButton.addEventListener('click', toggleMute);

// Initialize volume and attempt autoplay when page loads
updateVolume();

// Typing effect for hero description
const heroDescriptionElement = document.getElementById('hero-description');
const descriptionsToType = [
    'Escucha aqui tus artistas favoritos.',
    'Descubra nuevos sonidos en radio Universo .',
    'Música sin límites, siempre a su alcance.',
    'La mejor experiencia musical en todo momento!.'
];

let currentDescriptionIndex = 0;
let isDeleting = false;
let typingSpeed = 50;
let deletingSpeed = 30;

function typeDescription() {
    const currentDescription = descriptionsToType[currentDescriptionIndex];
    const currentText = heroDescriptionElement.textContent;

    if (!isDeleting) {
        // Typing
        if (currentText.length < currentDescription.length) {
            heroDescriptionElement.textContent = currentDescription.substring(0, currentText.length + 1);
            setTimeout(typeDescription, typingSpeed);
        } else {
            isDeleting = true;
            setTimeout(typeDescription, 2000); // Pause before deleting
        }
    } else {
        // Deleting
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
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        setupIOSAudio();
        // Add iOS class to body for specific CSS targeting if needed
        document.body.classList.add('ios-device');
    }
    
    attemptAutoplay();
    typeDescription();
    // Initial fetch of radio info
    fetchRadioInfo();
    
    function esDispositivoMovil() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function compartir() {
        fallbackShare();
    }

    function shareContent() {
        compartir();
    }

    window.compartir = compartir;

    const shareButton = document.querySelector('.btn-share');

    function fallbackShare() {
        // Create a fallback sharing method
        const shareModal = createShareModal();
        shareModal.style.display = 'block';
    }

    function createShareModal() {
        // Check if modal already exists
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
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.669.15-.197.297-.768.966-.94 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.608.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.01-.371-.01-.57-.01-.198 0-.52.075-.792.371-.272.297-1.041 1.016-1.041 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.422 7.441h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.861 9.861 0 01-1.511-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.002 5.45-4.436 9.884-9.887 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.141 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                </button>
                <button class="share-option" data-platform="facebook">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    Facebook
                </button>
                <button class="share-option" data-platform="twitter">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.7 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21c7.88 0 12.21-6.54 12.21-12.21 0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
                    Twitter
                </button>
            </div>
        </div>
        <style>
            #share-modal {
                display: none;
                position: fixed;
                z-index: 2000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.5);
                backdrop-filter: blur(10px);
                animation: fadeIn 0.3s ease-in-out;
            }
            .share-modal-content {
                background-color: rgba(30, 10, 60, 0.9);
                margin: 15% auto;
                padding: 2rem;
                border-radius: 1rem;
                max-width: 500px;
                width: 90%;
                color: white;
                position: relative;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                transform: scale(0.9);
                animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
            }
            .share-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                position: absolute;
                top: 10px;
                right: 15px;
                transition: color 0.3s;
            }
            .share-modal-close:hover {
                color: white;
            }
            .share-modal-content h3 {
                text-align: center;
                margin-bottom: 1.5rem;
                background: linear-gradient(135deg, var(--pink-500), var(--blue-500));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
                width: 100%;
            }
            .share-options {
                display: flex;
                justify-content: space-around;
                margin-top: 1rem;
                gap: 1rem;
            }
            .share-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                padding: 1rem;
                border-radius: 0.75rem;
                transition: all 0.3s ease;
                width: 100%;
                max-width: 120px;
            }
            .share-option:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .share-option svg {
                width: 32px;
                height: 32px;
                margin-bottom: 0.5rem;
                color: var(--pink-500);
                transition: color 0.3s;
            }
            .share-option:hover svg {
                color: var(--blue-500);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes popIn {
                from { 
                    opacity: 0; 
                    transform: scale(0.6);
                }
                to { 
                    opacity: 1; 
                    transform: scale(1);
                }
            }

            @media (max-width: 480px) {
                .share-modal-content {
                    margin: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    border-radius: 0;
                }
                .share-options {
                    flex-direction: column;
                    align-items: center;
                }
                .share-option {
                    max-width: 250px;
                    margin-bottom: 1rem;
                }
            }
        </style>
    `;

    document.body.appendChild(modal);

    // Add event listeners to close the modal
    const closeBtn = modal.querySelector('.share-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Add event listeners to share options
    const shareOptions = modal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const platform = e.currentTarget.dataset.platform;
            handleShareOption(platform);
        });
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('share-modal');
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });

    return modal;
}

function handleShareOption(platform) {
    const shareData = {
        title: document.title,
        text: 'Escucha Radio Universal, tu universo de música en vivo.',
        url: window.location.href
    };

    switch (platform) {
        case 'copy':
            navigator.clipboard.writeText(shareData.url).then(() => {
                alert('Enlace copiado al portapapeles');
            });
            break;
        case 'whatsapp':
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
            window.open(whatsappUrl, '_blank');
            break;
        case 'facebook':
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
            window.open(facebookUrl, '_blank');
            break;
        case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
            window.open(twitterUrl, '_blank');
            break;
    }

    // Close modal after sharing
    document.getElementById('share-modal').style.display = 'none';
}

// Add click event to share button
shareButton.addEventListener('click', shareContent);

function openContactModal() {
    // Check if modal already exists
    let existingModal = document.getElementById('contact-modal');
    if (!existingModal) {
        const modal = document.createElement('div');
        modal.id = 'contact-modal';
        modal.innerHTML = `
            <style>
                #contact-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease-in-out;
                }
                .contact-modal-content {
                    background: rgba(30, 10, 60, 0.9);
                    border-radius: 1rem;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    color: white;
                    text-align: center;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    transform: scale(0.9);
                    animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
                }
                .contact-modal-close {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-size: 2rem;
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .contact-modal-close:hover {
                    color: white;
                }
                .contact-modal-content h3 {
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, var(--pink-500), var(--blue-500));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .contact-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .contact-option {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1rem;
                    border-radius: 0.75rem;
                    color: rgba(255,255,255,0.8);
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .contact-option:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    transform: scale(1.02);
                }
                .contact-option svg {
                    width: 24px;
                    height: 24px;
                    color: var(--pink-500);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.6);
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                }
            </style>
            <div class="contact-modal-content">
                <span class="contact-modal-close">&times;</span>
                <h3>Contacta con Radio Universal</h3>
                <p>Estamos aquí para escucharte. Elige una forma de contacto:</p>
                <div class="contact-options">
                    <a href="mailto:support@todoplayer.com" class="contact-option">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Enviar correo electrónico
                    </a>
                    <a href="#" class="contact-option" onclick="copyEmail(event)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copiar dirección de correo
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Close modal when clicking close button
        const closeBtn = modal.querySelector('.contact-modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    } else {
        document.body.appendChild(existingModal);
    }
}

function copyEmail(event) {
    event.preventDefault();
    const email = 'support@todoplayer.com';
    navigator.clipboard.writeText(email).then(() => {
        alert('Dirección de correo copiada al portapapeles');
        // Close the modal
        const modal = document.getElementById('contact-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }).catch(err => {
        console.error('Error copying email: ', err);
        alert('No se pudo copiar el correo electrónico');
    });
}

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      }
    
    const pwaModal = document.getElementById('pwa-install-modal');
    const pwaModalClose = document.querySelector('.pwa-modal-close');
    const pwaInstallButton = document.getElementById('pwa-install-button');
    const pwaModalMessage = document.querySelector('.pwa-modal-content p');
    let deferredPrompt = null;

    // Check if user is on mobile or desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set appropriate message based on device
    if (isMobile) {
        pwaModalMessage.textContent = 'Instala la app de Radio Universal en tu dispositivo móvil para escuchar en cualquier momento.';
    } else {
        pwaModalMessage.textContent = 'Instala Radio Universal en tu computadora para acceder rápidamente y disfrutar de la mejor música sin abrir el navegador.';
    }

    // Check if PWA is already installed
    const isPwaInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone || 
                          document.referrer.includes('android-app://');

    // Hide store buttons if PWA is installed
    if (isPwaInstalled) {
        const storeButtons = document.querySelector('.store-buttons');
        if (storeButtons) {
            storeButtons.style.display = 'none';
        }
    }

    // Show modal after a short delay, but only if not already installed
    setTimeout(() => {
        if (!isPwaInstalled) {
            pwaModal.style.display = 'block';
        }
    }, 2000);

    // Close modal when clicking 'x'
    pwaModalClose.addEventListener('click', () => {
        pwaModal.style.display = 'none';
    });

    // Capture the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    // Handle PWA installation
    pwaInstallButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                
                if (result.outcome === 'accepted') {
                    console.log('PWA installed successfully');
                } else {
                    console.log('PWA installation declined');
                }
                
                deferredPrompt = null;
                pwaModal.style.display = 'none';
            } catch (error) {
                console.error('Installation failed', error);
            }
        } else {
            alert('La instalación de la aplicación no está disponible en este momento.');
        }
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === pwaModal) {
            pwaModal.style.display = 'none';
        }
    });

    // Initial update
    updateSchedule();
    
    // Start rotation
    setInterval(updateSchedule, 4000);
});

// Programming schedule rotation with artwork
const scheduleList = document.querySelector('.footer-column:nth-child(3) ul');
const schedules = [
    {
        time: "Lunes a Viernes: 06h - 12h",
        art: "assets/programming/radio1.png",
        title: "Despertar Musical"
    },
    {
        time: "Mañana Musical: 12h - 14h",
        art: "assets/programming/radio2.png",
        title: "Éxitos del Momento"
    },
    {
        time: "Tarde de Clásicos: 14h - 18h",
        art: "assets/programming/radio3.png",
        title: "Clásicos Inmortales"
    },
    {
        time: "Atardecer Latino: 18h - 20h",
        art: "assets/programming/radio4.png",
        title: "Ritmo Latino"
    },
    {
        time: "Noche de Rock: 20h - 22h",
        art: "assets/programming/radio5.png",
        title: "Rock sin Límites"
    },
    {
        time: "After Hours Mix: 22h - 06h",
        art: "assets/programming/radio6.png",
        title: "Música Non-Stop"
    }
];

let currentScheduleIndex = 0;

function updateSchedule() {
    const li = scheduleList.querySelector('li:first-child');
    const currentProgram = schedules[currentScheduleIndex];
    
    // Add fade out class
    li.classList.add('fade-out');
    
    setTimeout(() => {
        // Update content
        li.innerHTML = `
            <div class="program-info">
                <img src="${currentProgram.art}" alt="${currentProgram.title}" class="program-art">
                <div class="program-details">
                    <span class="program-title">${currentProgram.title}</span>
                    <span class="program-time">${currentProgram.time}</span>
                </div>
            </div>
        `;
        
        // Force reflow
        li.offsetHeight;
        
        // Remove fade out class to trigger fade in
        li.classList.remove('fade-out');
        
        // Update index for next iteration
        currentScheduleIndex = (currentScheduleIndex + 1) % schedules.length;
    }, 300); // Match this with the CSS transition duration
}
