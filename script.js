// Configuration
const PDF_PATH = 'Micro_Project Final Draft.pdf';
const THUMBNAIL_WIDTH = 200;

// State
let pdfDoc = null;
let pageFlip = null;
let currentZoom = 1;
let totalPages = 0;
let isMobile = window.innerWidth <= 768;
let soundEnabled = true;

// Custom Page Flip Sound
// 1. Place your sound file in the project folder
// 2. Name it 'page-flip.mp3' (or change the filename below)
const PAGE_FLIP_SOUND_PATH = 'page-flip.mp3';
const audio = new Audio(PAGE_FLIP_SOUND_PATH);

// Initialize Lucide Icons
lucide.createIcons();

const THUMBNAIL_HEIGHT = 120;

// Elements
const flipbookEl = document.getElementById('flipbook');
const thumbnailContainer = document.getElementById('thumbnail-container');
const loadingOverlay = document.getElementById('loading-overlay');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const zoomLevelEl = document.getElementById('zoom-level');
const sidebarRight = document.getElementById('sidebar-right');

// PDF.js Setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function init() {
    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument(PDF_PATH);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        totalPagesEl.textContent = totalPages;

        // Render Pages for Flipbook
        await renderAllPages();

        // Initialize Flipbook
        initFlipbook();

        // Generate Thumbnails
        generateThumbnails();

        // Hide Loading Overlay
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);

        // Setup Event Listeners
        setupEventListeners();

        // Initial scale adjustment
        setTimeout(adjustScale, 500);

    } catch (error) {
        console.error('Error initializing flipbook:', error);
        alert('Error loading PDF. Please ensure the file exists and you are running this through a local server.');
    }
}

async function renderAllPages() {
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); 
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.setAttribute('data-density', 'soft'); // Same density for all pages
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';
        contentDiv.appendChild(canvas);
        pageDiv.appendChild(contentDiv);
        
        flipbookEl.appendChild(pageDiv);
    }
}

function initFlipbook() {
    const pageWidth = 550;
    const pageHeight = 733;

    pageFlip = new St.PageFlip(flipbookEl, {
        width: pageWidth,
        height: pageHeight,
        size: "stretch",
        minWidth: 315,
        maxWidth: 1000,
        minHeight: 420,
        maxHeight: 1350,
        maxShadowOpacity: 0.3,
        showCover: true,
        mobileScrollSupport: false,
        flippingTime: 600, // Faster flip
        usePortrait: isMobile,
        startZIndex: 0,
        autoSize: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // Update page info on flip
    pageFlip.on('flip', (e) => {
        const pageNum = e.data + 1;
        currentPageEl.textContent = pageNum;
        updateActiveThumbnail(pageNum - 1);
    });

    // Play sound at the start of flipping
    pageFlip.on('changeState', (e) => {
        if (e.data === 'flipping' && soundEnabled) {
            audio.currentTime = 0;
            audio.play().catch(err => console.log('Audio play blocked'));
        }
    });

    // Handle initial state
    currentPageEl.textContent = pageFlip.getCurrentPageIndex() + 1;
}

async function generateThumbnails() {
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = 160 / originalViewport.width; // Fixed width for sidebar
        const viewport = page.getViewport({ scale });
        
        const thumbItem = document.createElement('div');
        thumbItem.className = 'thumbnail-item';
        if (i === 1) thumbItem.classList.add('active');
        thumbItem.onclick = () => {
            pageFlip.turnToPage(i - 1);
        };

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const pageNum = document.createElement('div');
        pageNum.className = 'thumbnail-page-num';
        pageNum.textContent = `PAGE ${i}`;

        thumbItem.appendChild(canvas);
        thumbItem.appendChild(pageNum);
        thumbnailContainer.appendChild(thumbItem);
    }
}

function updateActiveThumbnail(index) {
    const thumbs = document.querySelectorAll('.thumbnail-item');
    thumbs.forEach(t => t.classList.remove('active'));
    if (thumbs[index]) {
        thumbs[index].classList.add('active');
        thumbs[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function setupEventListeners() {
    // Navigation
    document.getElementById('prev-page').onclick = () => pageFlip.flipPrev();
    document.getElementById('next-page').onclick = () => pageFlip.flipNext();
    document.getElementById('first-page').onclick = () => pageFlip.turnToPage(0);
    document.getElementById('last-page').onclick = () => pageFlip.turnToPage(totalPages - 1);

    // Zoom
    document.getElementById('zoom-in').onclick = () => updateZoom(0.1);
    document.getElementById('zoom-out').onclick = () => updateZoom(-0.1);

    // Thumbnails Toggle
    document.getElementById('toggle-thumbnails').onclick = toggleThumbnails;

    // Fullscreen
    document.getElementById('toggle-fullscreen').onclick = toggleFullscreen;

    // Sound
    document.getElementById('toggle-sound').onclick = () => {
        soundEnabled = !soundEnabled;
        const icon = document.querySelector('#toggle-sound i');
        if (soundEnabled) {
            icon.setAttribute('data-lucide', 'volume-2');
        } else {
            icon.setAttribute('data-lucide', 'volume-x');
        }
        lucide.createIcons();
    };

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') pageFlip.flipPrev();
        if (e.key === 'ArrowRight') pageFlip.flipNext();
        if (e.key === 'Home') pageFlip.turnToPage(0);
        if (e.key === 'End') pageFlip.turnToPage(totalPages - 1);
    });

    // Handle resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        adjustScale();
    });
}

function toggleThumbnails() {
    sidebarRight.classList.toggle('hidden');
    setTimeout(adjustScale, 400); // Readjust after transition
}

function adjustScale() {
    const wrapper = document.getElementById('flipbook-wrapper');
    const availableWidth = wrapper.clientWidth - 100;
    const availableHeight = wrapper.clientHeight - 100;
    
    const bookWidth = pageFlip.getBoundsRect().width;
    const bookHeight = pageFlip.getBoundsRect().height;
    
    const scaleX = availableWidth / bookWidth;
    const scaleY = availableHeight / bookHeight;
    
    currentZoom = Math.min(scaleX, scaleY, 1.2); 
    applyZoom();
}

function updateZoom(delta) {
    currentZoom = Math.min(Math.max(0.2, currentZoom + delta), 3);
    applyZoom();
}

function applyZoom() {
    flipbookEl.style.transform = `scale(${currentZoom})`;
    zoomLevelEl.textContent = `${Math.round(currentZoom * 100)}%`;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Start
init();
