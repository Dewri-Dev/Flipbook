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
let thumbnailObserver = null;
let bottomThumbnailObserver = null;

// Custom Page Flip Sound
const PAGE_FLIP_SOUND_PATH = 'page-flip.mp3';
const audio = new Audio(PAGE_FLIP_SOUND_PATH);

// Initialize Lucide Icons
lucide.createIcons();

// Elements
const flipbookEl = document.getElementById('flipbook');
const thumbnailContainer = document.getElementById('thumbnail-container');
const bottomThumbnailContainer = document.getElementById('bottom-thumbnail-container');
const bottomThumbnailTray = document.getElementById('bottom-thumbnail-tray');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.getElementById('loading-progress');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const zoomLevelEl = document.getElementById('zoom-level');
const sidebarRight = document.getElementById('sidebar-right');
const pageSlider = document.getElementById('page-slider');
const sliderPreview = document.getElementById('slider-preview');
const previewCanvas = document.getElementById('preview-canvas');
const previewPageNum = document.getElementById('preview-page-num');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const toggleFullscreenBtn = document.getElementById('toggle-fullscreen');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const jumpInput = document.getElementById('jump-input');
const jumpBtn = document.getElementById('jump-btn');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-container');
const searchInputField = document.getElementById('search-input-field');
const scrollUpBtn = document.getElementById('scroll-up');
const scrollDownBtn = document.getElementById('scroll-down');
const closeSidebarBtn = document.getElementById('close-sidebar');

// PDF.js Setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function init() {
    try {
        const loadingTask = pdfjsLib.getDocument(PDF_PATH);
        
        loadingTask.onProgress = (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            if (!isNaN(percent)) loadingProgress.textContent = `${percent}%`;
        };

        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        totalPagesEl.textContent = totalPages;
        pageSlider.max = totalPages;
        jumpInput.max = totalPages;

        createPageContainers();
        initFlipbook();
        await renderNeighborPages(0);

        setupObservers();
        generateThumbnailPlaceholders();

        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);

        setupEventListeners();
        setTimeout(adjustScale, 500);

    } catch (error) {
        console.error('Error initializing flipbook:', error);
    }
}

function createPageContainers() {
    flipbookEl.innerHTML = '';
    renderedPages.clear();
    for (let i = 1; i <= totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        if (i === 1 || i === totalPages) {
            pageDiv.classList.add('page-cover');
            pageDiv.setAttribute('data-density', 'hard');
        } else {
            pageDiv.setAttribute('data-density', 'soft');
        }
        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';
        contentDiv.id = `page-${i}`;
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
        container.innerHTML = ''; 
        container.appendChild(canvas);
        renderedPages.add(pageNum);
    } catch (err) {}
}

async function renderNeighborPages(currentIndex) {
    const pagesToRender = [currentIndex + 1];
    if (currentIndex + 2 <= totalPages) pagesToRender.push(currentIndex + 2);
    if (currentIndex > 0) pagesToRender.push(currentIndex);
    if (currentIndex + 3 <= totalPages) pagesToRender.push(currentIndex + 3);
    for (const pageNum of pagesToRender) {
        if (pageNum >= 1 && pageNum <= totalPages) renderPage(pageNum);
    }
}

function initFlipbook() {
    if (pageFlip) pageFlip.destroy();
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
        flippingTime: 800,
        usePortrait: isMobile,
        autoSize: true,
        drawShadow: true,
        clickEventForward: true
    });
    pageFlip.loadFromHTML(document.querySelectorAll('.page'));
    pageFlip.on('flip', (e) => {
        const pageNum = e.data + 1;
        currentPageEl.textContent = pageNum;
        pageSlider.value = pageNum;
        updateActiveThumbnail(pageNum - 1);
        renderNeighborPages(e.data);
    });
    pageFlip.on('changeState', (e) => {
        if (e.data === 'flipping' && soundEnabled) {
            audio.currentTime = 0;
            audio.play().catch(err => {});
        }
    });
    currentPageEl.textContent = pageFlip.getCurrentPageIndex() + 1;
}

function setupObservers() {
    const options = { root: null, rootMargin: '100px' };
    thumbnailObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.getAttribute('data-page'));
                renderThumbnail(pageNum, entry.target);
                thumbnailObserver.unobserve(entry.target);
            }
        });
    }, options);

    bottomThumbnailObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.getAttribute('data-page'));
                renderThumbnail(pageNum, entry.target);
                bottomThumbnailObserver.unobserve(entry.target);
            }
        });
    }, { root: bottomThumbnailTray, rootMargin: '100px' });
}

function generateThumbnailPlaceholders() {
    thumbnailContainer.innerHTML = '';
    bottomThumbnailContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const createThumb = (container, observer) => {
            const thumbItem = document.createElement('div');
            thumbItem.className = 'thumbnail-item loading';
            thumbItem.setAttribute('data-page', i);
            if (i === 1) thumbItem.classList.add('active');
            thumbItem.onclick = () => {
                pageFlip.turnToPage(i - 1);
                if (isMobile) toggleSidebar();
            };
            const pageNumLabel = document.createElement('div');
            pageNumLabel.className = 'thumbnail-page-num';
            pageNumLabel.textContent = `PAGE ${i}`;
            thumbItem.appendChild(pageNumLabel);
            container.appendChild(thumbItem);
            observer.observe(thumbItem);
        };
        createThumb(thumbnailContainer, thumbnailObserver);
        createThumb(bottomThumbnailContainer, bottomThumbnailObserver);
    }
}

async function renderThumbnail(pageNum, container) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 160 / page.getViewport({ scale: 1 }).width });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        container.classList.remove('loading');
        container.prepend(canvas);
    } catch (err) {}
}

async function renderPreview(pageNum) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 120 / page.getViewport({ scale: 1 }).width });
        previewCanvas.height = viewport.height;
        previewCanvas.width = viewport.width;
        await page.render({ canvasContext: previewCanvas.getContext('2d'), viewport }).promise;
        previewPageNum.textContent = `Page ${pageNum}`;
    } catch (err) {}
}

function updateActiveThumbnail(index) {
    // Update Right Sidebar
    const sidebarThumbs = document.querySelectorAll('.thumbnail-container .thumbnail-item');
    sidebarThumbs.forEach(t => t.classList.remove('active'));
    if (sidebarThumbs[index]) {
        sidebarThumbs[index].classList.add('active');
        // Only scroll if sidebar is NOT hidden
        if (!sidebarRight.classList.contains('hidden')) {
            sidebarThumbs[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Update Bottom Tray
    const bottomThumbs = document.querySelectorAll('.bottom-thumbnail-container .thumbnail-item');
    bottomThumbs.forEach(t => t.classList.remove('active'));
    if (bottomThumbs[index]) {
        bottomThumbs[index].classList.add('active');
        // Only scroll if tray is active
        if (bottomThumbnailTray.classList.contains('active')) {
            bottomThumbs[index].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }
}

function setupEventListeners() {
    document.getElementById('prev-page').onclick = () => pageFlip.flipPrev();
    document.getElementById('next-page').onclick = () => pageFlip.flipNext();
    document.getElementById('first-page').onclick = () => pageFlip.turnToPage(0);
    document.getElementById('last-page').onclick = () => pageFlip.turnToPage(totalPages - 1);

    // Jump to Page
    jumpBtn.onclick = () => {
        const pageNum = parseInt(jumpInput.value);
        if (pageNum >= 1 && pageNum <= totalPages) {
            pageFlip.turnToPage(pageNum - 1);
        }
    };
    jumpInput.onkeydown = (e) => {
        if (e.key === 'Enter') jumpBtn.click();
    };

    // Search
    searchBtn.onclick = () => {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInputField.focus();
        }
    };

    // Sidebar Toggle
    toggleSidebarBtn.onclick = toggleSidebar;
    if (closeSidebarBtn) closeSidebarBtn.onclick = toggleSidebar;
    sidebarOverlay.onclick = toggleSidebar;

    // Sidebar Scroll
    scrollUpBtn.onclick = () => {
        thumbnailContainer.scrollBy({ top: -300, behavior: 'smooth' });
    };
    scrollDownBtn.onclick = () => {
        thumbnailContainer.scrollBy({ top: 300, behavior: 'smooth' });
    };

    pageSlider.oninput = (e) => {
        const pageNum = parseInt(e.target.value);
        renderPreview(pageNum);
        const ratio = (pageNum - 1) / (totalPages - 1);
        sliderPreview.style.left = `${ratio * 100}%`;
        sliderPreview.classList.add('active');
    };
    
    pageSlider.onchange = (e) => {
        pageFlip.turnToPage(parseInt(e.target.value) - 1);
        setTimeout(() => sliderPreview.classList.remove('active'), 500);
    };

    pageSlider.onmouseenter = () => sliderPreview.classList.add('active');
    pageSlider.onmouseleave = () => sliderPreview.classList.remove('active');

    document.getElementById('zoom-in').onclick = () => updateZoom(0.2);
    document.getElementById('zoom-out').onclick = () => updateZoom(-0.2);
    toggleFullscreenBtn.onclick = toggleFullscreen;
    document.getElementById('toggle-autoflip').onclick = toggleAutoFlip;

    document.getElementById('toggle-sound').onclick = () => {
        soundEnabled = !soundEnabled;
        document.getElementById('toggle-sound').innerHTML = soundEnabled ? '<i data-lucide="volume-2"></i>' : '<i data-lucide="volume-x"></i>';
        lucide.createIcons();
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') pageFlip.flipPrev();
        if (e.key === 'ArrowRight') pageFlip.flipNext();
        if (e.key === 'f') toggleFullscreen();
    });

    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        document.body.classList.toggle('fullscreen-mode', isFullscreen);
        toggleFullscreenBtn.innerHTML = isFullscreen ? '<i data-lucide="minimize"></i>' : '<i data-lucide="maximize"></i>';
        lucide.createIcons();
        setTimeout(adjustScale, 500);
    });

    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            const currentIndex = pageFlip.getCurrentPageIndex();
            createPageContainers();
            initFlipbook();
            pageFlip.turnToPage(currentIndex);
        }
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
            if (pageFlip.getCurrentPageIndex() < totalPages - 1) pageFlip.flipNext();
            else toggleAutoFlip();
        }, 4000);
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i data-lucide="play"></i>';
        clearInterval(autoFlipInterval);
    }
    lucide.createIcons();
}

function toggleSidebar() {
    const isNowHidden = sidebarRight.classList.toggle('hidden');
    
    // Sync overlay and button state with sidebar visibility
    if (isNowHidden) {
        sidebarOverlay.classList.remove('active');
        toggleSidebarBtn.classList.remove('active');
    } else {
        sidebarOverlay.classList.add('active');
        toggleSidebarBtn.classList.add('active');
    }
}

function toggleThumbnails() {
    bottomThumbnailTray.classList.toggle('active');
    setTimeout(adjustScale, 400);
}

function adjustScale() {
    const wrapper = document.getElementById('flipbook-wrapper');
    if (!wrapper || !pageFlip) return;
    const availableWidth = wrapper.clientWidth - 40;
    const availableHeight = wrapper.clientHeight - 40;
    const bounds = pageFlip.getBoundsRect();
    currentZoom = Math.min(availableWidth / bounds.width, availableHeight / bounds.height, 1.1); 
    flipbookEl.style.transform = `scale(${currentZoom})`;
    zoomLevelEl.textContent = `${Math.round(currentZoom * 100)}%`;
}

function updateZoom(delta) {
    currentZoom = Math.min(Math.max(0.5, currentZoom + delta), 3);
    flipbookEl.style.transform = `scale(${currentZoom})`;
    zoomLevelEl.textContent = `${Math.round(currentZoom * 100)}%`;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

init();
