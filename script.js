// =========================================================================
// 首页脚本 — 两阶段加载 + 图片懒加载
//
// 阶段 1：videos_core.js（24 条，gzip 后 2.4KB）→ 首屏立刻出图
// 阶段 2：videos_data.js（1270 条，gzip 后 92KB）→ 浏览器空闲时才加载
//
// 图片用 <img loading="lazy">，不在视口内就不会发请求。
// =========================================================================

// 数据字段位置（数组格式，比对象省一半体积）
var F = { id: 0, title: 1, cat: 2, catName: 3, thumb: 4, views: 5, likes: 6, tags: 7, embed: 8 };

var allVideos = [];
var coreVideos = [];
var filteredVideos = [];
var currentPage = 1;
var itemsPerPage = 12;
var currentCategory = 'all';
var currentSearch = '';
var currentSort = 'popular';
var fullLoaded = false;

/* ---------- 数组项 -> 对象 ---------- */
function toObj(a) {
  return {
    id: a[F.id],
    title: a[F.title] || '',
    category: a[F.cat],
    categoryName: a[F.catName],
    thumb: a[F.thumb],
    views: a[F.views],
    likes: a[F.likes],
    extra_tags: a[F.tags] || [],
    embed: a[F.embed] || null
  };
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', function () {
  if (window.V_CORE && window.V_CORE.length) {
    coreVideos = window.V_CORE.map(toObj);
    allVideos = coreVideos.slice();
    boot();
    scheduleFullLoad();
  } else if (window.V_FULL && window.V_FULL.length) {
    // 兜底：core 没加载成功时直接用全量
    allVideos = window.V_FULL.map(toObj);
    fullLoaded = true;
    boot();
  }
});

function boot() {
  setupHeroSpotlight();
  setupEventListeners();
  applyFiltersAndRender();
}

/* ---------- 阶段 2：按需加载全量（关键优化） ----------
 * 不再后台自动下载 280KB 的全量数据。
 * 只在真正需要时才拉：用户搜索、切换分类、或翻到第 2 页。
 * 这样首页首次访问的数据流量只有 6KB。
 */
var fullLoading = false;
var fullCallbacks = [];

function loadFull(onDone) {
  if (window.V_FULL && window.V_FULL.length) { afterFullLoad(); if (onDone) onDone(); return; }
  if (onDone) fullCallbacks.push(onDone);
  if (fullLoading) return;

  fullLoading = true;
  var s = document.createElement('script');
  s.src = 'videos_data.js';
  s.async = true;
  s.onload = function () {
    afterFullLoad();
    var cbs = fullCallbacks; fullCallbacks = [];
    for (var i = 0; i < cbs.length; i++) { try { cbs[i](); } catch (e) {} }
  };
  s.onerror = function () {
    fullLoading = false;
    if (window.console) console.warn('[data] 全量数据加载失败，继续使用首屏 24 条');
  };
  document.body.appendChild(s);
}

/* 首次交互后才预热全量数据（不阻塞任何操作） */
function scheduleFullLoad() {
  if (window.V_FULL && window.V_FULL.length) { afterFullLoad(); return; }

  var trigger = function () {
    cleanup();
    // 交互后再延迟一点，让交互本身先完成
    setTimeout(function () { loadFull(); }, 300);
  };
  var cleanup = function () {
    window.removeEventListener('scroll', trigger);
    window.removeEventListener('touchstart', trigger);
    window.removeEventListener('mousemove', trigger);
  };

  window.addEventListener('scroll', trigger, { passive: true, once: true });
  window.addEventListener('touchstart', trigger, { passive: true, once: true });
  window.addEventListener('mousemove', trigger, { passive: true, once: true });
}

function afterFullLoad() {
  if (!window.V_FULL || !window.V_FULL.length) return;
  var prevCount = allVideos.length;
  fullLoaded = true;
  allVideos = window.V_FULL.map(toObj);

  var countEl = document.getElementById('videoTotalCount');
  if (countEl) countEl.textContent = 'Showing ' + allVideos.length + ' ultra HD videos';

  // 只在需要更多结果时重绘，避免打断浏览
  if (filteredVideos.length >= prevCount) applyFiltersAndRender();
}

/* ---------- Hero ---------- */
function setupHeroSpotlight() {
  if (!allVideos || allVideos.length === 0) return;
  var heroVideo = allVideos[Math.floor(Math.random() * Math.min(10, allVideos.length))];
  var heroBanner = document.getElementById('heroBanner');
  var heroTitle = document.getElementById('heroTitle');
  var heroMeta = document.getElementById('heroMeta');

  if (heroBanner && heroVideo) {
    heroBanner.style.backgroundImage =
      "linear-gradient(180deg, rgba(12, 13, 18, 0.2) 0%, rgba(12, 13, 18, 0.95) 100%), url('" + heroVideo.thumb + "')";
    if (heroTitle) heroTitle.textContent = heroVideo.title;
    if (heroMeta) heroMeta.innerHTML = '<i class="fa-solid fa-eye"></i> ' + (heroVideo.views || '350K') + ' Views';
    heroBanner.style.cursor = 'pointer';
    heroBanner.onclick = function () {
      window.location.href = 'video?id=' + heroVideo.id;
    };
  }
}

/* ---------- 事件 ---------- */
function setupEventListeners() {
  var tagCloud = document.getElementById('tagCloud');
  if (tagCloud) {
    tagCloud.addEventListener('click', function (e) {
      var btn = e.target.closest('.cat-pill');
      if (!btn) return;
      var pills = document.querySelectorAll('.cat-pill');
      for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      currentPage = 1;
      if (!fullLoaded) {
        // 首屏只有 24 条，分类可能筛不到 → 先拉全量
        applyFiltersAndRender();          // 先给出即时反馈
        loadFull(function () { applyFiltersAndRender(); });
      } else {
        applyFiltersAndRender();
      }
    });
  }

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function (e) {
      clearTimeout(timer);
      var val = e.target.value.trim().toLowerCase();
      timer = setTimeout(function () {
        currentSearch = val;
        currentPage = 1;
        if (!fullLoaded) {
          applyFiltersAndRender();
          loadFull(function () { applyFiltersAndRender(); });
        } else {
          applyFiltersAndRender();
        }
      }, 180);
    });
  }

  var sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function (e) {
      currentSort = e.target.value;
      if (!fullLoaded) {
        applyFiltersAndRender();
        loadFull(function () { applyFiltersAndRender(); });
      } else {
        applyFiltersAndRender();
      }
    });
  }
}

/* ---------- 筛选 ---------- */
function applyFiltersAndRender() {
  filteredVideos = allVideos.filter(function (v) {
    var okCat = (currentCategory === 'all') ||
                v.category === currentCategory ||
                (v.categoryName && v.categoryName.toLowerCase() === currentCategory) ||
                (v.extra_tags && v.extra_tags.indexOf(currentCategory) !== -1);
    var okSearch = !currentSearch || v.title.toLowerCase().indexOf(currentSearch) !== -1;
    return okCat && okSearch;
  });

  if (currentSort === 'latest') {
    filteredVideos.sort(function (a, b) {
      return (b.id || '').localeCompare(a.id || '');
    });
  }

  var countEl = document.getElementById('videoTotalCount');
  if (countEl) countEl.textContent = 'Showing ' + filteredVideos.length + ' ultra HD videos';

  renderGrid();
  renderPagination();
}

/* ---------- 渲染（字符串拼接，比 createElement 快） ---------- */
function renderGrid() {
  var grid = document.getElementById('mediaGrid');
  if (!grid) return;

  if (filteredVideos.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#94a3b8;">' +
      '<h3>No videos found</h3><p>Try another category or search term.</p></div>';
    return;
  }

  var start = (currentPage - 1) * itemsPerPage;
  var page = filteredVideos.slice(start, start + itemsPerPage);
  var html = '';

  // 首屏立即加载的张数按视口宽度算：
  // 手机 2 列，一屏约见 2 张；桌面 4 列，一屏约见 4 张。
  // 多加载的那几张用户根本看不到，纯浪费流量。
  var vw = window.innerWidth || 1024;
  var eagerCount = vw <= 640 ? 2 : (vw <= 1024 ? 3 : 4);

  for (var i = 0; i < page.length; i++) {
    var v = page[i];
    var eager = (start === 0 && i < eagerCount);
    html +=
      '<a href="video?id=' + v.id + '" class="velvet-card">' +
        '<div class="card-thumb-box">' +
          '<img class="thumb-img" src="' + v.thumb + '" alt="" ' +
               'width="' + (vw <= 640 ? 180 : 320) + '" height="' + (vw <= 640 ? 101 : 180) + '" ' +
               (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">' +
          '<span class="badge-hd">4K Ultra</span>' +
          '<div class="play-overlay"><div class="play-button-icon"><i class="fa-solid fa-play"></i></div></div>' +
        '</div>' +
        '<div class="card-info-box">' +
          '<h3 class="card-title-text">' + esc(v.title) + '</h3>' +
          '<div class="card-meta-row">' +
            '<span class="card-cat-tag">' + esc(v.categoryName || 'Asian') + '</span>' +
            '<div class="card-stats-item">' +
              '<span><i class="fa-regular fa-eye"></i> ' + (v.views || '') + '</span>' +
              '<span class="stat-like"><i class="fa-solid fa-thumbs-up"></i> ' + (v.likes || '') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  grid.innerHTML = html;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 分页 ---------- */
function renderPagination() {
  var box = document.getElementById('paginationControls');
  if (!box) return;

  var total = Math.ceil(filteredVideos.length / itemsPerPage);
  if (total <= 1) { box.innerHTML = ''; return; }

  var pages = [];
  if (total <= 7) {
    for (var i = 1; i <= total; i++) pages.push(i);
  } else if (currentPage <= 4) {
    pages = [1, 2, 3, 4, 5, '...', total];
  } else if (currentPage >= total - 3) {
    pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  } else {
    pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total];
  }

  var html = '<button class="page-btn" data-p="prev"' + (currentPage === 1 ? ' disabled' : '') +
             '><i class="fa-solid fa-chevron-left"></i></button>';

  for (var k = 0; k < pages.length; k++) {
    var p = pages[k];
    if (p === '...') html += '<span class="page-ellipsis">...</span>';
    else html += '<button class="page-btn' + (p === currentPage ? ' active' : '') +
                 '" data-p="' + p + '">' + p + '</button>';
  }

  html += '<button class="page-btn" data-p="next"' + (currentPage === total ? ' disabled' : '') +
          '><i class="fa-solid fa-chevron-right"></i></button>';

  box.innerHTML = html;

  box.onclick = function (e) {
    var btn = e.target.closest('.page-btn');
    if (!btn || btn.disabled) return;
    var p = btn.getAttribute('data-p');
    if (p === 'prev') { if (currentPage > 1) currentPage--; }
    else if (p === 'next') { if (currentPage < total) currentPage++; }
    else currentPage = parseInt(p, 10);

    if (!fullLoaded) {
      applyFiltersAndRender();
      loadFull(function () { applyFiltersAndRender(); });
    } else {
      applyFiltersAndRender();
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };
}
