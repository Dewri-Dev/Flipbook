// Configuration
const PDF_PATH = 'Micro_Project Final Draft.pdf';
const THUMBNAIL_WIDTH = 200;
const PAGE_WIDTH = 550;
const PAGE_HEIGHT = 733;

// State
let pdfDoc = null;
let pageFlip = null;
let currentZoom = 1;
let totalPages = 0;
let isMobile = window.innerWidth <= 768;
let soundEnabled = true;
let autoFlipInterval = null;
let isAutoFlipping = false;
let renderedPages = new Set();

// Custom Page Flip Sound
const PAGE_FLIP_SOUND_PATH = 'page-flip.mp3';
const audio = new Audio(PAGE_FLIP_SOUND_PATH);

// Initialize Lucide Icons
lucide.createIcons();

// Elements
const flipbookEl = document.getElementById('flipbook');
const thumbnailContainer = document.getElementById('thumbnail-container');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.getElementById('loading-progress');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const zoomLevelEl = document.getElementById('zoom-level');
const sidebarRight = document.getElementById('sidebar-right');
const pageSlider = document.getElementById('page-slider');

// PDF.js Setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function init() {
    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument(PDF_PATH);
        
        loadingTask.onProgress = (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            if (!isNaN(percent)) loadingProgress.textContent = `${percent}%`;
        };

        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        totalPagesEl.textContent = totalPages;
        pageSlider.max = totalPages;

        // Create Page Containers (Lazy Rendering)
        createPageContainers();

        // Initialize Flipbook
        initFlipbook();

        // Initial Page Render (Current + Next)
        await renderNeighborPages(0);

        // Generate Thumbnails (Background)
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

function createPageContainers() {
    for (let i = 1; i <= totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        
        // Hard Cover for first and last pages
        if (i === 1 || i === totalPages) {
            pageDiv.classList.add('page-cover');
            pageDiv.setAttribute('data-density', 'hard');
        } else {
            pageDiv.setAttribute('data-density', 'soft');
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';
        contentDiv.id = `page-${i}`;
        
        // Placeholder or Spinner
        const loader = document.createElement('div');
        loader.className = 'spinner';
        loader.style.width = '20px';
        loader.style.height = '20px';
        contentDiv.appendChild(loader);

        pageDiv.appendChild(contentDiv);
        flipbookEl.appendChild(pageDiv);
    }
}

async function renderPage(pageNum, scale = 2.0) {
    if (renderedPages.has(pageNum) && scale === 2.0) return;
    
    const container = document.getElementById(`page-${pageNum}`);
    if (!container) return;

    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        
        container.innerHTML = ''; // Clear loader
        container.appendChild(canvas);
        renderedPages.add(pageNum);
    } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
    }
}

async function renderNeighborPages(currentIndex) {
    const pagesToRender = [currentIndex + 1];
    
    // In double page mode, we might need more
    if (currentIndex + 2 <= totalPages) pagesToRender.push(currentIndex + 2);
    if (currentIndex > 0) pagesToRender.push(currentIndex);
    if (currentIndex + 3 <= totalPages) pagesToRender.push(currentIndex + 3);

    for (const pageNum of pagesToRender) {
        if (pageNum >= 1 && pageNum <= totalPages) {
            renderPage(pageNum);
        }
    }
}

function initFlipbook() {
    pageFlip = new St.PageFlip(flipbookEl, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        size: "stretch",
        minWidth: 315,
        maxWidth: 1000,
        minHeight: 420,
        maxHeight: 1350,
        maxShadowOpacity: 0.3,
        showCover: true,
        mobileScrollSupport: false,
        flippingTime: 800,
        usePortrait: isMobile,
        startZIndex: 0,
        autoSize: true,
        drawShadow: true,
        clickEventForward: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // Update page info on flip
    pageFlip.on('flip', (e) => {
        const pageNum = e.data + 1;
        currentPageEl.textContent = pageNum;
        pageSlider.value = pageNum;
        updateActiveThumbnail(pageNum - 1);
        renderNeighborPages(e.data);
    });

    // Play sound at the start of flipping
    pageFlip.on('changeState', (e) => {
        if (e.data === 'flipping' && soundEnabled) {
            audio.currentTime = 0;
            audio.play().catch(err => {});
        }
    });

    currentPageEl.textContent = pageFlip.getCurrentPageIndex() + 1;
}

async function generateThumbnails() {
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = 160 / originalViewport.width;
        const viewport = page.getViewport({ scale });
        
        const thumbItem = document.createElement('div');
        thumbItem.className = 'thumbnail-item';
        if (i === 1) thumbItem.classList.add('active');
        thumbItem.onclick = () => pageFlip.turnToPage(i - 1);

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

    // Slider
    pageSlider.oninput = (e) => {
        const pageNum = parseInt(e.target.value);
        pageFlip.turnToPage(pageNum - 1);
    };

    // Zoom
    document.getElementById('zoom-in').onclick = () => updateZoom(0.2);
    document.getElementById('zoom-out').onclick = () => updateZoom(-0.2);

    // Thumbnails Toggle
    document.getElementById('toggle-thumbnails').onclick = toggleThumbnails;

    // Fullscreen
    document.getElementById('toggle-fullscreen').onclick = toggleFullscreen;

    // Auto-flip
    document.getElementById('toggle-autoflip').onclick = toggleAutoFlip;

    // Sound
    document.getElementById('toggle-sound').onclick = () => {
        soundEnabled = !soundEnabled;
        const btn = document.getElementById('toggle-sound');
        btn.innerHTML = soundEnabled ? '<i data-lucide="volume-2"></i>' : '<i data-lucide="volume-x"></i>';
        lucide.createIcons();
    };

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') pageFlip.flipPrev();
        if (e.key === 'ArrowRight') pageFlip.flipNext();
        if (e.key === 'f') toggleFullscreen();
        if (e.key === 's') toggleAutoFlip();
    });

    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        adjustScale();
    });
}

function toggleAutoFlip() {
    isAutoFlipping = !isAutoFlipping;
    const btn = document.getElementById('toggle-autoflip');
    
    if (isAutoFlipping) {
        btn.classList.add('active');
        btn.innerHTML = '<i data-lucide="pause"></i>';
        autoFlipInterval = setInterval(() => {
            if (pageFlip.getCurrentPageIndex() < totalPages - 1) {
                pageFlip.flipNext();
            } else {
                toggleAutoFlip(); // Stop at end
            }
        }, 4000);
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i data-lucide="play"></i>';
        clearInterval(autoFlipInterval);
    }
    lucide.createIcons();
}

function toggleThumbnails() {
    sidebarRight.classList.toggle('hidden');
    setTimeout(adjustScale, 400);
}

function adjustScale() {
    const wrapper = document.getElementById('flipbook-wrapper');
    const availableWidth = wrapper.clientWidth - 40;
    const availableHeight = wrapper.clientHeight - 40;
    
    const bookWidth = pageFlip.getBoundsRect().width;
    const bookHeight = pageFlip.getBoundsRect().height;
    
    const scaleX = availableWidth / bookWidth;
    const scaleY = availableHeight / bookHeight;
    
    currentZoom = Math.min(scaleX, scaleY, 1.1); 
    applyZoom();
}

function updateZoom(delta) {
    currentZoom = Math.min(Math.max(0.5, currentZoom + delta), 3);
    applyZoom();
    
    // If zoomed in significantly, re-render current pages at higher res
    if (currentZoom > 1.5) {
        const index = pageFlip.getCurrentPageIndex();
        renderPage(index + 1, currentZoom * 2);
        if (index + 2 <= totalPages) renderPage(index + 2, currentZoom * 2);
    }
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
