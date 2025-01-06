const fs = require('fs');
const path = require('path');

// 解析歌词
function parseLRC(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/;
    const wordTimeRegex = /<(\d{2}):(\d{2})\.(\d{2})>/g;

    lines.forEach(line => {
        const match = line.match(timeRegex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3]);
            let text = match[4].trim();
            const time = minutes * 60 + seconds + centiseconds / 100;

            // 解析每个字的时间
            const words = [];
            let lastIndex = 0;
            let wordMatch;
            
            // 复制原始文本用于提取纯文字
            let pureText = text;
            
            // 收集所有时间标记和对应位置
            const timeMarks = [];
            while ((wordMatch = wordTimeRegex.exec(text)) !== null) {
                const wordMinutes = parseInt(wordMatch[1]);
                const wordSeconds = parseInt(wordMatch[2]);
                const wordCentiseconds = parseInt(wordMatch[3]);
                const wordTime = wordMinutes * 60 + wordSeconds + wordCentiseconds / 100;
                
                timeMarks.push({
                    time: wordTime,
                    index: wordMatch.index,
                    length: wordMatch[0].length
                });
            }
            
            // 移除所有时间标记，获取纯文本
            pureText = text.replace(wordTimeRegex, '');
            
            // 为每个字生成时间信息
            const chars = pureText.split('');
            const wordTimings = chars.map((char, index) => {
                const currentMark = timeMarks[index];
                const nextMark = timeMarks[index + 1];
                return {
                    char: char,
                    startTime: currentMark ? currentMark.time : time,
                    endTime: nextMark ? nextMark.time : (timeMarks[index] ? timeMarks[index].time + 0.5 : time + 0.5)
                };
            });

            if (pureText) {
                lyrics.push({
                    time: time,
                    text: pureText,
                    wordTimings: wordTimings
                });
            }
        }
    });

    return lyrics.sort((a, b) => a.time - b.time);
}

// 生成播放列表
function generatePlaylist() {
    const musicDir = path.join(__dirname, 'src/music');
    try {
        // 检查目录是否存在
        if (!fs.existsSync(musicDir)) {
            console.error(`Music directory does not exist: ${musicDir}`);
            return [];
        }

        const files = fs.readdirSync(musicDir);
        console.log('Found files in music directory:', files);
        
        // 过滤 .lrc 文件
        const lrcFiles = files.filter(file => path.extname(file) === '.lrc');
        console.log('Found LRC files:', lrcFiles);

        if (lrcFiles.length === 0) {
            console.error('No LRC files found in music directory');
            return [];
        }
        
        const playlist = lrcFiles.map(file => {
            console.log('Processing file:', file);
            const parts = file.split(' - ');
            if (parts.length !== 2) {
                console.error(`Invalid file name format: ${file}`);
                return null;
            }

            const artist = parts[0];
            const title = parts[1].split('.')[0];
            
            const audioFile = `${artist} - ${title}.mp3`;
            const backgroundFile = `${artist} - ${title}.png`;
            
            // 检查相关文件是否存在
            const audioPath = path.join(musicDir, audioFile);
            const backgroundPath = path.join(musicDir, backgroundFile);
            const lrcPath = path.join(musicDir, file);
            
            console.log('Checking files:');
            console.log('- Audio:', fs.existsSync(audioPath) ? 'exists' : 'missing');
            console.log('- Background:', fs.existsSync(backgroundPath) ? 'exists' : 'missing');
            console.log('- LRC:', fs.existsSync(lrcPath) ? 'exists' : 'missing');

            if (!fs.existsSync(audioPath) || !fs.existsSync(backgroundPath)) {
                console.error(`Missing required files for: ${file}`);
                return null;
            }

            return {
                title: title,
                artist: artist,
                audio: audioFile,
                background: backgroundFile,
                lyrics: parseLRC(path.join(musicDir, file))
            };
        }).filter(Boolean); // 移除 null 值

        return playlist;
    } catch (err) {
        console.error('Error reading directory:', err);
        return [];
    }
}

// 保存播放列表到 JSON 文件
function savePlaylistToJson(playlist) {
    try {
        const dataDir = path.join(__dirname, 'src/public/data');
        const jsonPath = path.join(dataDir, 'playlist.json');
        
        // 确保 data 目录存在
        if (!fs.existsSync(dataDir)) {
            console.log('Creating data directory:', dataDir);
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 写入 JSON 文件
        fs.writeFileSync(jsonPath, JSON.stringify(playlist, null, 2), 'utf8');
        console.log('Playlist saved to:', jsonPath);
        
        // 验证文件是否成功创建
        if (fs.existsSync(jsonPath)) {
            console.log('Successfully created playlist.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(content);
            console.log('Playlist contains', parsed.length, 'songs');
        } else {
            console.error('Failed to create playlist.json');
        }
    } catch (error) {
        console.error('Error saving playlist to JSON:', error);
    }
}

// 初始化函数
function initialize() {
    // 创建必要的目录结构
    const directories = [
        'src/public/data',
        'src/public/music',
        'src/public/icons'
    ];

    directories.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });

    // 生成并保存播放列表
    console.log('Generating playlist...');
    try {
        const playlist = generatePlaylist();
        if (playlist.length > 0) {
            savePlaylistToJson(playlist);
            console.log('Playlist generation completed');
        } else {
            console.error('No valid songs found');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// 运行初始化
initialize(); 