class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progress = document.querySelector('.progress');
        this.currentTime = document.querySelector('.current-time');
        this.duration = document.querySelector('.duration');
        this.songTitle = document.querySelector('.song-title');
        this.artist = document.querySelector('.artist');
        this.background = document.querySelector('.background');
        this.lyrics = document.querySelector('.lyrics');
        this.themeBtn = document.getElementById('themeBtn');
        this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.progressBar = document.querySelector('.progress-bar');
        this.speedBtn = document.getElementById('speedBtn');
        this.speedOptions = document.querySelectorAll('.speed-option');
        this.currentSpeed = 1.0;
        this.playlist = [];
        this.currentSongIndex = 0;
        this.isPlaying = false;

        // 先初始化主题，再加载播放列表
        this.initializeTheme();
        
        // 加载播放列表（优先从缓存加载）
        this.loadPlaylist().then(() => {
            this.initializeEvents();
            this.loadSong(this.currentSongIndex);
            this.initializeLyrics();
            this.autoScroll = true;
        });
    }

    // 修改加载播放列表的方法
    async loadPlaylist() {
        try {
            // 先尝试从 localStorage 获取播放列表
            const cachedData = localStorage.getItem('musicPlaylistData');
            if (cachedData) {
                const { playlist, timestamp } = JSON.parse(cachedData);
                // 检查是否过期（例如 24 小时）
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    this.playlist = playlist;
                    console.log('Playlist loaded from cache:', this.playlist);
                    return;
                }
            }

            // 直接从 JSON 文件加载播放列表
            const response = await fetch('../data/playlist.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                this.playlist = data;
                // 保存数据和时间戳到 localStorage
                localStorage.setItem('musicPlaylistData', JSON.stringify({
                    playlist: data,
                    timestamp: Date.now()
                }));
                console.log('Playlist loaded from JSON file:', this.playlist);
            } else {
                console.error('No songs found in playlist');
                this.handleEmptyPlaylist();
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.handlePlaylistError();
        }
    }

    // 添加清除缓存的方法（如果需要的话）
    clearPlaylistCache() {
        localStorage.removeItem('musicPlaylist');
        console.log('Playlist cache cleared');
    }

    // 处理空播放列表
    handleEmptyPlaylist() {
        this.lyrics.innerHTML = '<p class="error-message">没有找到可播放的歌曲</p>';
        this.disableControls();
    }

    // 处理播放列表加载错误
    handlePlaylistError() {
        this.lyrics.innerHTML = '<p class="error-message">加载播放列表失败，请刷新页面重试</p>';
        this.disableControls();
    }

    // 禁用控制按钮
    disableControls() {
        this.playBtn.disabled = true;
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
        this.speedBtn.disabled = true;
    }

    initializeTheme() {
        // 获取系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 设置初始主题
        this.currentTheme = prefersDark ? 'dark' : 'light';
        
        // 立即应用主题
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.themeBtn.innerHTML = this.currentTheme === 'light' ?
            '<i class="ri-moon-line"></i>' :
            '<i class="ri-sun-line"></i>';

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.currentTheme = e.matches ? 'dark' : 'light';
            this.updateTheme();
        });
    }

    initializeEvents() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prevSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.themeBtn.addEventListener('click', () => this.toggleTheme());
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));
        this.progressBar.addEventListener('mousedown', () => {
            this.isProgressDragging = true;
        });
        document.addEventListener('mousemove', (e) => {
            if (this.isProgressDragging) {
                this.setProgress(e);
            }
        });
        document.addEventListener('mouseup', () => {
            this.isProgressDragging = false;
        });
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'PageUp':
                    // 上一首
                    this.prevSong();
                    break;
                case 'PageDown':
                    // 下一首
                    this.nextSong();
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        // Ctrl + 右方向键，快进15秒
                        this.audio.currentTime = Math.min(this.audio.currentTime + 15, this.audio.duration);
                    } else {
                        // 普通右方向键，快进5秒
                        this.audio.currentTime = Math.min(this.audio.currentTime + 5, this.audio.duration);
                    }
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey) {
                        // Ctrl + 左方向键，快退15秒
                        this.audio.currentTime = Math.max(this.audio.currentTime - 15, 0);
                    } else {
                        // 普通左方向键，快退5秒
                        this.audio.currentTime = Math.max(this.audio.currentTime - 5, 0);
                    }
                    break;
                case 'Space':
                    // 空格键播放/暂停
                    e.preventDefault(); // 防止页面滚动
                    this.togglePlay();
                    break;
            }
        });

        // 添加倍速选择事件
        this.speedOptions.forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed);
                this.setPlaybackSpeed(speed);

                // 更新选中状态
                this.speedOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // 更新当前速度
                this.currentSpeed = speed;
            });
        });

        // 初始化默认倍速状态
        this.speedOptions.forEach(option => {
            if (parseFloat(option.dataset.speed) === 1.0) {
                option.classList.add('active');
            }
        });

        // 定义一个计时器变量
        let autoScrollTimer;

        // PC端鼠标事件
        this.lyrics.addEventListener('mouseenter', () => {
            this.autoScroll = false;
        });

        this.lyrics.addEventListener('mouseleave', () => {
            this.autoScroll = true;
        });

        // 添加PC端歌词点击事件
        this.lyrics.addEventListener('click', (e) => {
            const lyricLine = e.target.closest('.lyric-line');
            if (lyricLine) {
                const time = parseFloat(lyricLine.dataset.time);
                if (!isNaN(time)) {
                    // 设置音频播放时间
                    this.audio.currentTime = time;
                    // 如果当前是暂停状态，自动开始播放
                    if (!this.isPlaying) {
                        this.togglePlay();
                    }
                    // 高亮当前歌词
                    this.updateLyrics(time);
                }
            }
        });

        // 移动端触摸事件
        this.lyrics.addEventListener('touchstart', () => {
            this.autoScroll = false;
            // 清除之前的计时器
            if (autoScrollTimer) {
                clearTimeout(autoScrollTimer);
            }
        });

        this.lyrics.addEventListener('touchend', () => {
            // 清除之前的计时器
            if (autoScrollTimer) {
                clearTimeout(autoScrollTimer);
            }
            // 设置新的计时器
            autoScrollTimer = setTimeout(() => {
                this.autoScroll = true;
            }, 5000); // 5秒后恢复自动滚动
        });

        // 处理触摸滚动
        let touchStartY = 0;
        let isTouchMove = false;

        this.lyrics.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            isTouchMove = false;
            // 清除之前的计时器
            if (autoScrollTimer) {
                clearTimeout(autoScrollTimer);
            }
        });

        this.lyrics.addEventListener('touchmove', (e) => {
            const touchMoveY = e.touches[0].clientY;
            if (Math.abs(touchMoveY - touchStartY) > 10) {
                isTouchMove = true;
                // 清除之前的计时器
                if (autoScrollTimer) {
                    clearTimeout(autoScrollTimer);
                }
                // 设置新的计时器
                autoScrollTimer = setTimeout(() => {
                    this.autoScroll = true;
                }, 5000);
            }
        });

        this.lyrics.addEventListener('touchend', (e) => {
            if (!isTouchMove) {
                // 如果不是滑动，而是点击，则处理点击事件
                const lyricLine = e.target.closest('.lyric-line');
                if (lyricLine) {
                    const time = parseFloat(lyricLine.dataset.time);
                    if (!isNaN(time)) {
                        this.audio.currentTime = time;
                        if (!this.isPlaying) {
                            this.togglePlay();
                        }
                    }
                }
            }
        });
    }

    loadSong(index) {
        const song = this.playlist[index];
        this.songTitle.textContent = song.title;
        this.artist.textContent = song.artist;
        
        // 直接使用相对路径访问音乐文件
        this.audio.src = `../../music/${song.audio}`;

        // 修改背景图片加载逻辑
        if (song.background) {
            // 先清除现有背景，避免闪烁
            this.background.style.backgroundImage = 'none';
            this.background.style.display = 'none';

            const img = new Image();
            
            // 添加加载超时处理
            const loadTimeout = setTimeout(() => {
                console.error('背景图片加载超时:', song.background);
                this.handleBackgroundError();
            }, 5000);

            img.onload = () => {
                clearTimeout(loadTimeout);
                this.background.style.opacity = '0';
                // 直接使用相对路径访问背景图片
                this.background.style.backgroundImage = `url("../../music/${song.background}")`;
                this.background.style.display = 'block';
                
                requestAnimationFrame(() => {
                    this.background.style.opacity = this.currentTheme === 'dark' ? '0.3' : '0.4';
                    this.background.style.transition = 'opacity 0.3s ease';
                });
            };

            img.onerror = (error) => {
                clearTimeout(loadTimeout);
                console.error('背景图片加载失败:', song.background, error);
                this.handleBackgroundError();
            };

            // 直接使用相对路径加载图片
            img.src = `../../music/${song.background}`;
        } else {
            this.handleBackgroundError();
        }

        this.initializeLyrics();
        this.audio.playbackRate = this.currentSpeed;

        // 移除之前的事件监听器
        this.audio.removeEventListener('loadedmetadata', this.handleMetadataLoaded);
        this.audio.removeEventListener('error', this.handleAudioError);

        // 添加音频加载完成后的处理
        this.handleMetadataLoaded = () => {
            this.duration.textContent = this.formatTime(this.audio.duration);
            this.currentTime.textContent = this.formatTime(0);
            this.progress.style.width = '0%';
        };
        this.audio.addEventListener('loadedmetadata', this.handleMetadataLoaded);

        // 添加音频加载错误处理
        this.handleAudioError = (e) => {
            console.error('音频加载失败:', e);
            this.handlePlaybackError();
        };
        this.audio.addEventListener('error', this.handleAudioError);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playBtn.innerHTML = '<i class="ri-play-fill"></i>';
        } else {
            this.audio.play();
            this.playBtn.innerHTML = '<i class="ri-pause-fill"></i>';
        }
        this.isPlaying = !this.isPlaying;
    }

    prevSong() {
        this.currentSongIndex--;
        if (this.currentSongIndex < 0) {
            this.currentSongIndex = this.playlist.length - 1;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    nextSong() {
        this.currentSongIndex++;
        if (this.currentSongIndex >= this.playlist.length) {
            this.currentSongIndex = 0;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    updateProgress() {
        const { currentTime, duration } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.progress.style.width = `${progressPercent}%`;

        this.currentTime.textContent = this.formatTime(currentTime);
        this.duration.textContent = this.formatTime(duration);

        this.updateLyrics(currentTime);
    }

    formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    updateLyrics() {
        if (!this.audio.duration) return;

        const currentTime = this.audio.currentTime;
        const lyrics = Array.from(this.lyrics.getElementsByClassName('lyric-line'));
        let activeLine = null;

        // 找到当前行
        for (let i = 0; i < lyrics.length; i++) {
            const line = lyrics[i];
            const time = parseFloat(line.dataset.time);
            const nextTime = lyrics[i + 1] ? parseFloat(lyrics[i + 1].dataset.time) : Infinity;

            if (currentTime >= time && currentTime < nextTime) {
                activeLine = line;
                break;
            }
        }

        // 更新歌词高亮状态
        lyrics.forEach(line => line.classList.remove('active'));
        if (activeLine) {
            activeLine.classList.add('active');
            this.scrollToActiveLyric(activeLine);

            // 更新当前行每个字的进度
            const chars = activeLine.getElementsByClassName('lyric-char');
            Array.from(chars).forEach(char => {
                const startTime = parseFloat(char.dataset.startTime);
                const endTime = parseFloat(char.dataset.endTime);
                
                if (currentTime < startTime) {
                    char.style.setProperty('--char-progress', '0%');
                } else if (currentTime > endTime) {
                    char.style.setProperty('--char-progress', '100%');
                } else {
                    const progress = ((currentTime - startTime) / (endTime - startTime)) * 100;
                    char.style.setProperty('--char-progress', `${Math.min(100, Math.max(0, progress))}%`);
                }
            });
        }
    }

    scrollToActiveLyric(activeLine) {
        if (!activeLine || !this.autoScroll) return;

        const container = this.lyrics;
        const containerHeight = container.clientHeight;
        const lineHeight = activeLine.offsetHeight;
        
        // 计算 1/3 位置的偏移量
        const targetOffset = containerHeight / 3;
        
        // 计算滚动位置，使当前歌词位于容器 1/3 处
        const scrollTop = activeLine.offsetTop - targetOffset + (lineHeight / 2);

        // 使用平滑滚动
        container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.updateTheme();
    }

    updateTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.themeBtn.innerHTML = this.currentTheme === 'light' ?
            '<i class="ri-moon-line"></i>' :
            '<i class="ri-sun-line"></i>';
    }

    setProgress(e) {
        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;

        // 如果是拖动事件，需要计算相对于进度条的位置
        const rect = this.progressBar.getBoundingClientRect();
        const x = e.type === 'mousemove' ? e.clientX - rect.left : clickX;

        this.audio.currentTime = (x / width) * duration;
    }

    setPlaybackSpeed(speed) {
        this.currentSpeed = speed;
        this.audio.playbackRate = speed;
        this.speedBtn.innerHTML = '<i class="ri-speed-line"></i>';
    }

    // 修改初始化歌词的方法
    initializeLyrics() {
        const song = this.playlist[this.currentSongIndex];
        if (song.lyrics) {
            const wrapper = this.lyrics.querySelector('.lyrics-wrapper') || this.lyrics;
            
            // 修改歌词行的创建方式，为每个字添加 span 标签和 data-text 属性
            const lyricsHTML = song.lyrics.map((lyric) => {
                const chars = lyric.wordTimings.map((timing, index) => 
                    `<span class="lyric-char" 
                        data-start-time="${timing.startTime}" 
                        data-end-time="${timing.endTime}"
                        data-text="${timing.char}"
                    >${timing.char}</span>`
                ).join('');
                
                return `<p class="lyric-line" data-time="${lyric.time}">${chars}</p>`;
            }).join('');
            
            wrapper.innerHTML = lyricsHTML;
            
            const firstLine = wrapper.querySelector('.lyric-line');
            if (firstLine) {
                this.scrollToActiveLyric(firstLine);
            }
        }
    }

    // 添加音频加载错误处理方法
    handlePlaybackError() {
        this.lyrics.innerHTML = '<p class="error-message">音频加载失败，请检查文件是否存在</p>';
        this.disableControls();
    }

    // 添加背景图片错误处理方法
    handleBackgroundError() {
        this.background.style.backgroundImage = 'none';
        this.background.style.backgroundColor = this.currentTheme === 'dark' ? '#1a1a1a' : '#f0f0f0';
        this.background.style.opacity = '1';
        this.background.style.display = 'block';
    }
}

// 等待 DOM 加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
}); 