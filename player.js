// =========================================================================
// VelvetVision HD - Player Page Script Engine
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initPlayer();
});

async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    let videos = (window.SCRAPED_VIDEOS_DATA && Array.isArray(window.SCRAPED_VIDEOS_DATA)) ? window.SCRAPED_VIDEOS_DATA : null;

    if (!videos || videos.length === 0) {
        try {
            const response = await fetch('scraped_videos.json');
            videos = await response.json();
        } catch (error) {
            console.error('Error loading video in player:', error);
            videos = window.SCRAPED_VIDEOS_DATA || [];
        }
    }

    if (videos && videos.length > 0) {
        let currentVideo = videos.find(v => v.id === videoId);
        if (!currentVideo && videos.length > 0) {
            currentVideo = videos[0]; // Fallback to first video
        }

        if (currentVideo) {
            renderPlayer(currentVideo);
        }
    }
}

function renderPlayer(video) {
    const playerWrapper = document.getElementById('yy');
    const titleEl = document.getElementById('videoTitle');
    const viewsEl = document.getElementById('videoViews');
    const likesEl = document.getElementById('videoLikes');
    const durationEl = document.getElementById('videoDuration');
    const categoryEl = document.getElementById('videoCategory');

    if (titleEl) titleEl.textContent = video.title || 'Untitled Video';
    if (viewsEl) viewsEl.textContent = video.views || '200K';
    if (likesEl) likesEl.textContent = video.likes || '98%';
    if (durationEl) {
        if (video.duration && video.duration !== '15:30') {
            durationEl.textContent = video.duration;
            if (durationEl.parentElement) durationEl.parentElement.style.display = 'inline-flex';
        } else {
            if (durationEl.parentElement) durationEl.parentElement.style.display = 'none';
        }
    }
    if (categoryEl) {
        categoryEl.innerHTML = `<i class="fa-solid fa-tag"></i> ${video.categoryName || 'Asian'}`;
    }

    if (playerWrapper) {
        playerWrapper.innerHTML = '';
        const iframe = document.createElement('iframe');
        

        iframe.id = 'yy';
        iframe.className = 'yy';
        iframe.src = video.embedUrl || `https://www.xnxx.com/embedframe/${video.id}`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('scrolling', 'no');
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        playerWrapper.appendChild(iframe);
    }

    // Set page title
    document.title = `${video.title || 'Watch Video'} - NEXUS STREAM HD`;
}


