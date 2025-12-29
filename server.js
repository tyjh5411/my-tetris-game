const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'scores.json');

// 解析 JSON 格式的請求內容
app.use(bodyParser.json());

// 讓你可以直接透過伺服器開啟 index.html
// 啟動後輸入 http://localhost:3000 即可進入遊戲
app.use(express.static(__dirname));

/**
 * API: 獲取排行榜 (前 5 名)
 */
app.get('/api/scores', (req, res) => {
    // 如果檔案不存在，回傳空陣列
    if (!fs.existsSync(DATA_FILE)) {
        return res.json([]);
    }
    
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const scores = JSON.parse(data);
        res.json(scores);
    } catch (err) {
        console.error("讀取檔案失敗:", err);
        res.status(500).json({ error: "無法讀取資料庫" });
    }
});

/**
 * API: 儲存或更新玩家分數
 */
app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    
    if (!name || score === undefined) {
        return res.status(400).json({ error: "缺少玩家名稱或分數" });
    }

    let scores = [];
    
    // 1. 讀取現有分數
    if (fs.existsSync(DATA_FILE)) {
        try {
            scores = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (err) {
            scores = [];
        }
    }

    // 2. 更新邏輯：相同帳號成績放在一起 (保留最高分)
    const playerIndex = scores.findIndex(s => s.name === name);
    if (playerIndex !== -1) {
        // 如果玩家已存在，且這次分數更高，則更新
        if (score > scores[playerIndex].score) {
            scores[playerIndex].score = score;
        }
    } else {
        // 新玩家直接加入
        scores.push({ name, score });
    }

    // 3. 排序 (由高到低) 並保留前 5 名
    scores.sort((a, b) => b.score - a.score);
    const top5 = scores.slice(0, 5);

    // 4. 寫回檔案
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(top5, null, 2));
        res.json({ success: true, scores: top5 });
    } catch (err) {
        console.error("儲存檔案失敗:", err);
        res.status(500).json({ error: "無法儲存分數" });
    }
});

app.listen(PORT, () => {
    console.log('====================================');
    console.log(`俄羅斯方塊伺服器啟動成功！`);
    console.log(`區域瀏覽網址: http://localhost:${PORT}`);
    console.log(`檔案存放在: ${DATA_FILE}`);
    console.log('====================================');
});