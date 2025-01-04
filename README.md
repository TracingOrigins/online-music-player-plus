# Online Music Player Plus | 在线音乐播放器 Plus

[English](#english) | [中文](#中文)

## English

### Introduction

An elegant online music player with synchronized lyrics display and karaoke effects.

### Features

- 🎵 Audio playback controls (play/pause/previous/next)
- 🎨 Adaptive light/dark theme (follows system)
- 📱 Responsive design, mobile-friendly
- 🎯 Progress bar control and time display
- 🎤 Synchronized lyrics display with karaoke effects
- ⚡ Playback speed control
- 🔄 Auto-play next song
- 💾 Local music file support
- ⌨️ Keyboard shortcuts
   - `Space`: Play/Pause
   - `PageUp`: Previous song
   - `PageDown`: Next song
   - `←`: Rewind 5 seconds
   - `→`: Fast forward 5 seconds
   - `Ctrl + ←`: Rewind 15 seconds
   - `Ctrl + →`: Fast forward 15 seconds

### Directory Structure

```
online-music-player-plus/
├── src/
│ ├── public/
│ │ ├── css/
│ │ ├── js/
│ │ └── icons/
│ ├── music/
│ │ ├── .mp3
│ │ ├── .lrc
│ │ └── .png
│ └── server.js
├── package.json
└── README.md
```

### Environmental requirement

- Node.js >= 14.0.0
- npm >= 6.0.0

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/TracingOrigins/online-music-player-plus.git
   cd online-music-player-plus
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. prepare music files
   -Download music files in the src/music' directory:
      -Audio file (.mp3)
      -Lyrics file (.lrc) (word for word lyrics are supported)
      -background picture (.png)
   -File name requirements:
      -Audio: `the name of the singer-the name of the song. MP3`.
      -Lyrics: `the name of the singer-the name of the song. lrc'
      -background: `singer's name-song name. png'

4. Start the server:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### License

[GPL-3.0 license](LICENSE)

### Contact

If you have any questions or suggestions, please submit Issue or PR.

---

## 中文

### 简介

一个优雅的在线音乐播放器，支持歌词同步显示和卡拉OK效果。

### 功能特点

- 🎵 音频播放控制（播放/暂停/上一首/下一首）
- 🎨 自适应明暗主题（跟随系统）
- 📱 响应式设计，支持移动端
- 🎯 进度条控制和时间显示
- 🎤 歌词同步显示和卡拉OK效果
- ⚡ 播放速度调节
- 🔄 自动播放下一首
- 💾 本地音乐文件支持
- ⌨️ 键盘快捷键
   - `空格键`: 播放/暂停
   - `PageUp`: 上一首
   - `PageDown`: 下一首
   - `←`: 快退 5 秒
   - `→`: 快进 5 秒
   - `Ctrl + ←`: 快退 15 秒
   - `Ctrl + →`: 快进 15 秒

### 目录结构

```
online-music-player-plus/
├── src/
│ ├── public/
│ │ ├── css/
│ │ ├── js/
│ │ └── icons/
│ ├── music/
│ │ ├── .mp3
│ │ ├── .lrc
│ │ └── .png
│ └── server.js
├── package.json
└── README.md
```

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 快速开始

1. 克隆仓库
   ```bash
   git clone https://github.com/TracingOrigins/online-music-player-plus.git
   cd online-music-player-plus
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 准备音乐文件
   - 在 `src/music` 目录下放入音乐文件：
     - 音频文件（.mp3）
     - 歌词文件（.lrc）（支持逐字歌词）
     - 背景图片（.png）
   - 文件名要求：
     - 音频：`歌手名 - 歌名.mp3`
     - 歌词：`歌手名 - 歌名.lrc`
     - 背景：`歌手名 - 歌名.png`
4. 初始化播放列表
   ```bash
   npm run init
   ```
5. 启动服务器：
   ```bash
   # 开发模式 (会自动重新加载)
   npm run dev

   # 生产模式
   npm start
   ```
6. 在浏览器中访问 `http://localhost:3000`

### 许可证

[GPL-3.0 license](LICENSE)

### 联系

如有问题或建议，欢迎提 Issue 或 PR。
