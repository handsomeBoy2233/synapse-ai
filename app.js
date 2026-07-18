/**
 * CulinaryLab - Application Engine
 * Core application logic for search, routing, and dynamic page rendering.
 */

// Helper to get safe image path (handles special characters like '#' in filenames)
function getSafeImagePath(imagePath) {
    if (!imagePath) return '';
    // imagePath is like "image/三鲜煲#美食教程 #中华料理.png"
    const parts = imagePath.split('image/');
    if (parts.length > 1) {
        return 'image/' + encodeURIComponent(parts[1]);
    }
    return encodeURIComponent(imagePath);
}

// Application State
const state = {
    searchQuery: '',
    selectedCategory: 'All',
    currentRecipeId: null,
    currentPage: 1,
    itemsPerPage: 24
};

// DOM Elements
const elements = {
    // Views
    homeView: document.getElementById('home-view'),
    detailView: document.getElementById('detail-view'),
    
    // Home components
    recipeGrid: document.getElementById('recipe-grid'),
    categoriesContainer: document.getElementById('categories-sidebar-container'),
    searchInput: document.getElementById('recipe-search'),
    clearSearchBtn: document.getElementById('clear-search'),
    filterStatusBar: document.getElementById('filter-status'),
    currentFilterName: document.getElementById('current-filter-name'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    noResultsState: document.getElementById('no-results-state'),
    noResultsClearBtn: document.getElementById('no-results-clear-btn'),
    
    // Stats
    statVideoCount: document.getElementById('stat-video-count'),
    statCategoryCount: document.getElementById('stat-category-count'),
    
    // Detail components
    videoPlayerTarget: document.getElementById('video-player-target'),
    detailTitle: document.getElementById('detail-title'),
    detailChineseTitle: document.getElementById('detail-chinese-title'),
    detailCategoryBadge: document.getElementById('detail-category-badge'),
    detailUploadDate: document.getElementById('detail-upload-date'),
    externalVideoLink: document.getElementById('external-video-link'),
    copyVideoLinkBtn: document.getElementById('copy-video-link'),
    detailTagsContainer: document.getElementById('detail-tags'),
    relatedGrid: document.getElementById('related-grid'),
    
    // Pagination components
    paginationWrapper: document.getElementById('pagination-wrapper'),
    paginationInfo: document.getElementById('pagination-info'),
    paginationButtons: document.getElementById('pagination-buttons')
};

// Define categories based on database
const CATEGORIES = [
    'All',
    'Pork Dishes',
    'Beef & Lamb',
    'Chicken & Poultry',
    'Seafood',
    'Tofu & Eggs',
    'Vegetables',
    'Soups & Claypots',
    'Staples & Noodles',
    'Baking & Desserts',
    'Appetizers & Pickles',
    'Home Cooking'
];

const CATEGORY_ICONS = {
    'All': 'fa-solid fa-border-all',
    'Pork Dishes': 'fa-solid fa-bacon',
    'Beef & Lamb': 'fa-solid fa-cow',
    'Chicken & Poultry': 'fa-solid fa-drumstick-bite',
    'Seafood': 'fa-solid fa-fish',
    'Tofu & Eggs': 'fa-solid fa-egg',
    'Vegetables': 'fa-solid fa-carrot',
    'Soups & Claypots': 'fa-solid fa-bowl-food',
    'Staples & Noodles': 'fa-solid fa-bowl-rice',
    'Baking & Desserts': 'fa-solid fa-cake-candles',
    'Appetizers & Pickles': 'fa-solid fa-pepper-hot',
    'Home Cooking': 'fa-solid fa-house-chimney'
};

/**
 * Initialize the Application
 */
function init() {
    // Initialize Stats
    if (elements.statVideoCount) {
        elements.statVideoCount.textContent = RECIPES_DB.length;
    }
    if (elements.statCategoryCount) {
        elements.statCategoryCount.textContent = CATEGORIES.length - 1; // exclude 'All'
    }

    // Render Category Navigation Pills
    renderCategoryPills();

    // Event Listeners
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearchBtn.addEventListener('click', clearSearch);
    elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    elements.noResultsClearBtn.addEventListener('click', resetAllFilters);
    
    // Copy Link Event
    elements.copyVideoLinkBtn.addEventListener('click', copyRecipeLink);

    // Setup SPA Hash Routing
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('DOMContentLoaded', handleRouting);
}

/**
 * SPA Router
 */
function handleRouting() {
    const hash = window.location.hash || '#/';
    
    // Scroll to top on page switch
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (hash === '#/' || hash.startsWith('#/category/') || hash.startsWith('#/search/')) {
        // Show Home View
        elements.detailView.classList.remove('active');
        elements.homeView.classList.add('active');
        
        state.currentPage = 1;
        
        // Parse category or search parameters from URL if present
        if (hash.startsWith('#/category/')) {
            const catName = decodeURIComponent(hash.split('#/category/')[1]);
            if (CATEGORIES.includes(catName)) {
                state.selectedCategory = catName;
            }
        } else if (hash.startsWith('#/search/')) {
            const query = decodeURIComponent(hash.split('#/search/')[1]);
            state.searchQuery = query;
            elements.searchInput.value = query;
            toggleClearSearchBtn();
        }
        
        updateCategoryPillUI();
        renderRecipeGrid();
    } 
    else if (hash.startsWith('#/recipe/')) {
        // Show Detail View
        const recipeId = parseInt(hash.split('#/recipe/')[1], 10);
        const recipe = RECIPES_DB.find(r => r.id === recipeId);
        
        if (recipe) {
            state.currentRecipeId = recipeId;
            elements.homeView.classList.remove('active');
            elements.detailView.classList.add('active');
            renderRecipeDetails(recipe);
        } else {
            // Redirect to home if ID not found
            window.location.hash = '#/';
        }
    } 
    else {
        // Default redirect
        window.location.hash = '#/';
    }
}

/**
 * Category Navigation Pills Generator
 */
function renderCategoryPills() {
    elements.categoriesContainer.innerHTML = '';
    
    CATEGORIES.forEach(category => {
        const pill = document.createElement('button');
        pill.className = 'category-pill';
        if (category === state.selectedCategory) {
            pill.classList.add('active');
        }
        
        // Add icon
        const iconClass = CATEGORY_ICONS[category] || 'fa-solid fa-utensils';
        pill.innerHTML = `<i class="${iconClass} category-pill-icon"></i> <span>${category}</span>`;
        pill.setAttribute('data-category', category);
        
        pill.addEventListener('click', () => {
            selectCategory(category);
        });
        
        elements.categoriesContainer.appendChild(pill);
    });
}

function updateCategoryPillUI() {
    const pills = elements.categoriesContainer.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        const cat = pill.getAttribute('data-category');
        if (cat === state.selectedCategory) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

function selectCategory(category) {
    state.selectedCategory = category;
    updateCategoryPillUI();
    
    // Update hash for state persistence & link sharing
    if (category === 'All') {
        window.location.hash = '#/';
    } else {
        window.location.hash = `#/category/${encodeURIComponent(category)}`;
    }
}

/**
 * Search Controls
 */
function handleSearchInput(e) {
    state.searchQuery = e.target.value.trim();
    toggleClearSearchBtn();
    
    // Throttle rendering slightly for smoother typing
    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
        if (state.searchQuery) {
            // Keep category 'All' when searching to search globally, or search within category?
            // Usually global search is expected. We update hash to search.
            window.location.hash = `#/search/${encodeURIComponent(state.searchQuery)}`;
        } else {
            window.location.hash = '#/';
        }
    }, 200);
}

function toggleClearSearchBtn() {
    if (state.searchQuery) {
        elements.clearSearchBtn.style.display = 'block';
    } else {
        elements.clearSearchBtn.style.display = 'none';
    }
}

function clearSearch() {
    state.searchQuery = '';
    elements.searchInput.value = '';
    toggleClearSearchBtn();
    window.location.hash = '#/';
}

function resetAllFilters() {
    state.searchQuery = '';
    state.selectedCategory = 'All';
    elements.searchInput.value = '';
    toggleClearSearchBtn();
    window.location.hash = '#/';
}

/**
 * Filter and Render Home Grid
 */
/**
 * Filter, Paginate and Render Home Grid
 */
function renderRecipeGrid() {
    // Filter logic
    let filtered = RECIPES_DB;

    // Filter by Category
    if (state.selectedCategory !== 'All') {
        filtered = filtered.filter(recipe => recipe.categories && recipe.categories.includes(state.selectedCategory));
    }

    // Filter by Search Query
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(recipe => {
            return (
                recipe.english_name.toLowerCase().includes(q) ||
                recipe.chinese_name.includes(q) ||
                recipe.tags.some(tag => tag.toLowerCase().includes(q))
            );
        });
    }

    // Display Status Bar
    if (state.selectedCategory !== 'All' || state.searchQuery) {
        elements.filterStatusBar.style.display = 'flex';
        
        let filterDesc = [];
        if (state.selectedCategory !== 'All') {
            filterDesc.push(`Category "${state.selectedCategory}"`);
        }
        if (state.searchQuery) {
            filterDesc.push(`Search "${state.searchQuery}"`);
        }
        
        elements.currentFilterName.textContent = filterDesc.join(' + ') + ` (${filtered.length} found)`;
    } else {
        elements.filterStatusBar.style.display = 'none';
    }

    // Pagination Calculation
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    
    // Safety check for current page bounds
    if (state.currentPage > totalPages) {
        state.currentPage = 1;
    }
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const pageItems = filtered.slice(startIndex, endIndex);

    // Render Grid Content
    elements.recipeGrid.innerHTML = '';
    
    if (totalItems === 0) {
        elements.recipeGrid.style.display = 'none';
        elements.noResultsState.style.display = 'block';
        elements.paginationWrapper.style.display = 'none';
    } else {
        elements.noResultsState.style.display = 'none';
        elements.recipeGrid.style.display = 'grid';
        
        pageItems.forEach(recipe => {
            const card = createRecipeCard(recipe);
            elements.recipeGrid.appendChild(card);
        });

        // Render Pagination Controls
        renderPagination(totalItems, totalPages);
    }
}

/**
 * Render Pagination Navigation Buttons
 */
function renderPagination(totalItems, totalPages) {
    if (totalPages <= 1) {
        elements.paginationWrapper.style.display = 'none';
        return;
    }

    elements.paginationWrapper.style.display = 'flex';
    
    const startRange = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endRange = Math.min(state.currentPage * state.itemsPerPage, totalItems);
    elements.paginationInfo.textContent = `Showing ${startRange}-${endRange} of ${totalItems} recipes`;

    elements.paginationButtons.innerHTML = '';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn page-btn-arrow';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Prev';
    prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderRecipeGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    elements.paginationButtons.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn';
        if (i === state.currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            if (state.currentPage !== i) {
                state.currentPage = i;
                renderRecipeGrid();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        elements.paginationButtons.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn page-btn-arrow';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.innerHTML = 'Next <i class="fa-solid fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderRecipeGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    elements.paginationButtons.appendChild(nextBtn);
}

/**
 * Create a recipe card element
 */
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('data-id', recipe.id);
    
    card.innerHTML = `
        <div class="recipe-card-img-wrapper">
            <img class="recipe-card-img" src="${getSafeImagePath(recipe.image)}" alt="${recipe.english_name}" loading="lazy">
            <div class="recipe-card-play-overlay">
                <i class="fa-solid fa-play"></i>
            </div>
        </div>
        <div class="recipe-card-content">
            <h3 class="recipe-card-title" title="${recipe.english_name}">${recipe.english_name}</h3>
            <div class="recipe-card-chinese">${recipe.chinese_name}</div>
            <div class="recipe-card-footer">
                <span class="recipe-card-category">${recipe.category}</span>
                <span class="recipe-card-date">${recipe.upload_date}</span>
            </div>
        </div>
    `;
    
    // Card Navigation click event
    card.addEventListener('click', () => {
        window.location.hash = `#/recipe/${recipe.id}`;
    });
    
    return card;
}

/**
 * Detail View Rendering
 */
function renderRecipeDetails(recipe) {
    // 1. Set Title & Metadata
    elements.detailTitle.textContent = recipe.english_name;
    elements.detailChineseTitle.textContent = recipe.chinese_name;
    elements.detailCategoryBadge.textContent = recipe.category;
    elements.detailUploadDate.textContent = recipe.upload_date;
    
    // 2. Play link
    elements.externalVideoLink.href = recipe.url;

    // 3. Inject Iframe Video Player
    // vinovo.to uses standard iframe embedding
    elements.videoPlayerTarget.innerHTML = `
        <iframe 
            src="${recipe.url}" 
            frameborder="0" 
            allowfullscreen 
            allow="autoplay; encrypted-media">
        </iframe>
    `;

    // 4. Render Tag Pills
    elements.detailTagsContainer.innerHTML = '';
    recipe.tags.forEach(tag => {
        const tagPill = document.createElement('a');
        tagPill.className = 'detail-tag';
        tagPill.href = `#/search/${encodeURIComponent(tag)}`;
        tagPill.innerHTML = `<i class="fa-solid fa-tag" style="font-size: 0.75rem; margin-right: 0.35rem; color: var(--primary);"></i> ${tag}`;
        elements.detailTagsContainer.appendChild(tagPill);
    });

    // 5. Render Related Videos
    renderRelatedVideos(recipe);
}

/**
 * Related Videos Logic
 * Matches recipes by sharing the same category or having overlapping tags
 */
function renderRelatedVideos(currentRecipe) {
    elements.relatedGrid.innerHTML = '';
    
    // Score all other recipes based on similarity
    const scoredRecipes = RECIPES_DB
        .filter(r => r.id !== currentRecipe.id)
        .map(recipe => {
            let score = 0;
            
            // Matches same category (large weight)
            if (recipe.category === currentRecipe.category) {
                score += 5;
            }
            
            // Overlapping tags
            const commonTags = recipe.tags.filter(t => currentRecipe.tags.includes(t));
            score += commonTags.length * 2;
            
            return { recipe, score };
        })
        .filter(scored => scored.score > 0)
        .sort((a, b) => b.score - a.score) // high score first
        .slice(0, 4); // Take top 4

    // Render cards
    if (scoredRecipes.length === 0) {
        // Fallback: take random 4 from same category or database
        const fallback = RECIPES_DB
            .filter(r => r.id !== currentRecipe.id)
            .slice(0, 4);
            
        fallback.forEach(recipe => {
            elements.relatedGrid.appendChild(createRecipeCard(recipe));
        });
    } else {
        scoredRecipes.forEach(item => {
            elements.relatedGrid.appendChild(createRecipeCard(item.recipe));
        });
    }
}

/**
 * Copy Share Link to Clipboard
 */
function copyRecipeLink() {
    const shareUrl = window.location.href;
    
    navigator.clipboard.writeText(shareUrl)
        .then(() => {
            const originalText = elements.copyVideoLinkBtn.innerHTML;
            elements.copyVideoLinkBtn.innerHTML = `<i class="fa-solid fa-check"></i> Link Copied!`;
            elements.copyVideoLinkBtn.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
            elements.copyVideoLinkBtn.style.borderColor = '#4ADE80';
            
            setTimeout(() => {
                elements.copyVideoLinkBtn.innerHTML = originalText;
                elements.copyVideoLinkBtn.style.backgroundColor = '';
                elements.copyVideoLinkBtn.style.borderColor = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

// Fire application initialization
init();
