// =========================================================================
// VelvetStream HD - Index Page Script Engine
// =========================================================================

let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
const itemsPerPage = 12; // 12 widescreen cards per page
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'popular';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    if (window.SCRAPED_VIDEOS_DATA && Array.isArray(window.SCRAPED_VIDEOS_DATA) && window.SCRAPED_VIDEOS_DATA.length > 0) {
        allVideos = window.SCRAPED_VIDEOS_DATA;
        setupHeroSpotlight();
        setupEventListeners();
        applyFiltersAndRender();
        return;
    }

    try {
        const response = await fetch('scraped_videos.json');
        allVideos = await response.json();
        
        setupHeroSpotlight();
        setupEventListeners();
        applyFiltersAndRender();
    } catch (error) {
        console.error('Error loading video data:', error);
        if (window.SCRAPED_VIDEOS_DATA) {
            allVideos = window.SCRAPED_VIDEOS_DATA;
            setupHeroSpotlight();
            setupEventListeners();
            applyFiltersAndRender();
        }
    }
}

function setupHeroSpotlight() {
    if (!allVideos || allVideos.length === 0) return;
    const heroVideo = allVideos[Math.floor(Math.random() * Math.min(10, allVideos.length))];
    const heroBanner = document.getElementById('heroBanner');
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');

    if (heroBanner && heroVideo) {
        heroBanner.style.backgroundImage = `linear-gradient(180deg, rgba(12, 13, 18, 0.2) 0%, rgba(12, 13, 18, 0.95) 100%), url('${heroVideo.thumb}')`;
        heroTitle.textContent = heroVideo.title;
        const durationText = (heroVideo.duration && heroVideo.duration !== '15:30') ? ` &bull; Duration ${heroVideo.duration}` : '';
        heroMeta.innerHTML = `<i class="fa-solid fa-eye"></i> ${heroVideo.views || '350K'} Views &bull; <i class="fa-solid fa-thumbs-up"></i> ${heroVideo.likes || '98%'} Rating${durationText}`;
        
        heroBanner.style.cursor = 'pointer';
        heroBanner.onclick = () => {
            window.location.href = `video.html?id=${heroVideo.id}`;
        };
    }
}

function setupEventListeners() {
    // Category Filter Buttons
    const tagCloud = document.getElementById('tagCloud');
    if (tagCloud) {
        tagCloud.addEventListener('click', (e) => {
            const btn = e.target.closest('.cat-pill');
            if (!btn) return;
            
            document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.getAttribute('data-filter') || 'all';
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim().toLowerCase();
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFiltersAndRender();
        });
    }
}

function applyFiltersAndRender() {
    // Filter by Category & Search
    filteredVideos = allVideos.filter(video => {
        const matchesCategory = (currentCategory === 'all') || 
                                (video.category === currentCategory) || 
                                (video.categoryName && video.categoryName.toLowerCase() === currentCategory) ||
                                (video.extra_tags && video.extra_tags.includes(currentCategory));
        
        const matchesSearch = !currentSearch || video.title.toLowerCase().includes(currentSearch);
        
        return matchesCategory && matchesSearch;
    });

    // Sorting
    if (currentSort === 'latest') {
        filteredVideos.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }

    // Update Meta Count
    const countEl = document.getElementById('videoTotalCount');
    if (countEl) {
        countEl.textContent = `Showing ${filteredVideos.length} ultra HD videos`;
    }

    renderGrid();
    renderPagination();
}

function renderGrid() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (filteredVideos.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: #94a3b8;">
            <i class="fa-solid fa-film" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>No videos found for "${currentSearch}"</h3>
            <p>Try searching for other categories like Asian, MILF, Voyeur...</p>
        </div>`;
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageVideos = filteredVideos.slice(startIndex, startIndex + itemsPerPage);

    pageVideos.forEach(video => {
        const card = document.createElement('a');
        card.href = `video.html?id=${video.id}`;
        card.style.textDecoration = 'none';


        card.id = 'yy';
        card.className = 'velvet-card yy';

        card.innerHTML = `
            <div class="card-thumb-box" style="background-image: url('${video.thumb}');">
                <span class="badge-hd">4K Ultra</span>
                <div class="play-overlay">
                    <div class="play-button-icon"><i class="fa-solid fa-play"></i></div>
                </div>
            </div>
            <div class="card-info-box">
                <h3 class="card-title-text" title="${video.title}">${video.title}</h3>
                <div class="card-meta-row">
                    <span class="card-cat-tag">${video.categoryName || 'Asian'}</span>
                    <div class="card-stats-item">
                        <span><i class="fa-regular fa-eye"></i> ${video.views || '200K'}</span>
                        <span class="stat-like"><i class="fa-solid fa-thumbs-up"></i> ${video.likes || '98%'}</span>
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

function renderPagination() {
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) return;
    paginationControls.innerHTML = '';

    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    if (totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            applyFiltersAndRender();
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };
    paginationControls.appendChild(prevBtn);

    // Page Numbers logic
    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            pages = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (currentPage >= totalPages - 3) {
            pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }

    pages.forEach(p => {
        if (p === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            paginationControls.appendChild(ellipsis);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
            btn.textContent = p;
            btn.onclick = () => {
                currentPage = p;
                applyFiltersAndRender();
                window.scrollTo({ top: 300, behavior: 'smooth' });
            };
            paginationControls.appendChild(btn);
        }
    });

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyFiltersAndRender();
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };
    paginationControls.appendChild(nextBtn);
}
