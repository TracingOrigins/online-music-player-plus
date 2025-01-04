const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors());

// 添加调试中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// 静态文件服务 - 分开处理不同类型的静态文件
app.use('/js', express.static(path.join(__dirname, 'src/public/js')));
app.use('/css', express.static(path.join(__dirname, 'src/public/css')));
app.use('/data', express.static(path.join(__dirname, 'src/public/data')));
app.use('/images', express.static(path.join(__dirname, 'src/public/images')));
app.use('/icons', (req, res, next) => {
    console.log(`[图标请求] ${req.path}`);
    express.static(path.join(__dirname, 'src/public/icons'))(req, res, next);
});

// 音乐文件中间件
app.use('/music', (req, res) => {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.join(__dirname, 'src/music', decodedPath);
    
    console.log(`[请求文件] ${filePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error(`[错误] 文件不存在: ${filePath}`);
        return res.status(404).json({
            error: 'File not found',
            path: decodedPath
        });
    }

    try {
        const stat = fs.statSync(filePath);
        const isAudio = filePath.endsWith('.mp3');
        const isImage = filePath.endsWith('.png');

        console.log(`[文件信息] 类型: ${isAudio ? '音频' : (isImage ? '图片' : '未知')}, 大小: ${stat.size} 字节`);

        // 设置响应头
        res.set({
            'Content-Length': stat.size,
            'Content-Type': isAudio ? 'audio/mpeg' : (isImage ? 'image/png' : 'application/octet-stream'),
            'Cache-Control': 'public, max-age=86400', // 缓存24小时
            'Accept-Ranges': 'bytes'
        });

        // 直接使用 sendFile，更简单可靠
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`[错误] 发送文件失败 ${filePath}:`, err);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Error sending file',
                        details: err.message
                    });
                }
            } else {
                console.log(`[成功] 文件发送完成: ${filePath}`);
            }
        });
    } catch (error) {
        console.error(`[错误] 处理文件失败 ${filePath}:`, error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    }
});

// 主页路由 - 移到最后，避免与其他路由冲突
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'src/public/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Index file not found');
    }
});

// 404 处理
app.use((req, res) => {
    console.log(`[404] 未找到路由: ${req.originalUrl}`);
    res.status(404).send('Not Found');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(`[错误] 服务器错误:`, err);
    res.status(500).json({
        error: 'Internal Server Error',
        details: err.message
    });
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    
    // 检查关键文件和目录
    const paths = [
        'src/public/js/script.js',
        'src/public/css/style.css',
        'src/public/index.html',
        'src/public/data/playlist.json',
        'src/music'
    ];
    
    console.log('\n检查文件和目录:');
    paths.forEach(p => {
        const fullPath = path.join(__dirname, p);
        const exists = fs.existsSync(fullPath);
        const type = fs.existsSync(fullPath) ? 
            (fs.statSync(fullPath).isDirectory() ? '目录' : '文件') : '不存在';
        console.log(`${p}: ${exists ? '存在' : '不存在'} (${type})`);
    });
}); 