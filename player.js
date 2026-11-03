// =========================================================================
// 播放页脚本
//
// 数据来源：videos_player.js（build-data.js 生成，gzip 后约 52KB）
// 不再请求原始 JSON（约 818KB），省下这部分流量。
//
// 字段位置（与 build-data.js 的 toPlayerRow 对应）：
//   var P = { id:0, title:1, catName:2, views:3, likes:4, duration:5, embed:6 };
// =========================================================================

var P = { id: 0, title: 1, catName: 2, views: 3, likes: 4, duration: 5, embed: 6 };

document.addEventListener('DOMContentLoaded', function () {
  initPlayer();
});

function initPlayer() {
  var urlParams = new URLSearchParams(window.location.search);
  var videoId = urlParams.get('id');

  var rows = (window.V_PLAYER && Array.isArray(window.V_PLAYER)) ? window.V_PLAYER : null;

  if (!rows || rows.length === 0) {
    // 数据文件没加载成功。留个明确的提示，不要静默白屏。
    showError('Video data failed to load. Please refresh the page.');
    return;
  }

  var current = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][P.id] === videoId) { current = rows[i]; break; }
  }

  // 找不到指定 id（比如链接被改过）时回退到第一条，避免白屏
  if (!current) current = rows[0];

  renderPlayer(current);
}

/* ---------- 播放地址解析 ----------
 * embed 字段为空表示这是标准 xnxx 视频，用 id 拼默认地址。
 * embed 有值说明是第三方来源（比如 streamfiles.net），直接用。
 */
function resolveEmbed(row) {
  var custom = row[P.embed];
  if (custom) return custom;
  return 'https://www.xnxx.com/embedframe/' + row[P.id];
}

function renderPlayer(row) {
  var playerWrapper = document.getElementById('playerWrap');
  var titleEl = document.getElementById('videoTitle');
  var viewsEl = document.getElementById('videoViews');
  var likesEl = document.getElementById('videoLikes');
  var durationEl = document.getElementById('videoDuration');
  var categoryEl = document.getElementById('videoCategory');

  var title = row[P.title] || 'Untitled Video';

  if (titleEl) titleEl.textContent = title;
  if (viewsEl) viewsEl.textContent = row[P.views] || '200K';
  if (likesEl) likesEl.textContent = row[P.likes] || '98%';

  if (durationEl) {
    var dur = row[P.duration];
    if (dur) {
      durationEl.textContent = dur;
      if (durationEl.parentElement) durationEl.parentElement.style.display = 'inline-flex';
    } else {
      if (durationEl.parentElement) durationEl.parentElement.style.display = 'none';
    }
  }

  if (categoryEl) {
    categoryEl.innerHTML = '<i class="fa-solid fa-tag"></i> ' + (row[P.catName] || 'Asian');
  }

  if (playerWrapper) {
    playerWrapper.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.className = 'yy';
    iframe.src = resolveEmbed(row);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('loading', 'eager');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    playerWrapper.appendChild(iframe);
  }

  // 标题不带品牌名，方便换域名复用
  document.title = title;
}

function showError(msg) {
  var playerWrapper = document.getElementById('playerWrap');
  if (playerWrapper) {
    playerWrapper.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;' +
      'height:100%;min-height:220px;color:#94a3b8;font-size:14px;text-align:center;padding:20px;">' +
      msg + '</div>';
  }
}
