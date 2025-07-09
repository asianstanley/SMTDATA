const express = require('express');
const axios = require('axios');
const XLSX = require('xlsx');

const app = express();
app.use(express.json());

const { GITHUB_TOKEN } = require('./token'); // ดึง token จากไฟล์ token.js

const GITHUB_USERNAME = 'asianstanley';
const REPO = 'SMTDATA';
const BRANCH = 'main';
const FILE_PATH = 'data/SMTDATA.xlsx';

async function getSHA() {
    try {
        const res = await axios.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        return res.data.sha;
    } catch (err) {
        return null;
    }
}

app.post('/upload', async (req, res) => {
    const data = req.body.data;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลของเสีย');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const base64 = buffer.toString('base64');

    const sha = await getSHA();

    try {
        const response = await axios.put(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${FILE_PATH}`, {
            message: '💾 อัปเดตข้อมูลของเสียจากระบบ',
            content: base64,
            branch: BRANCH,
            sha: sha || undefined
        }, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, url: response.data.content.download_url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => console.log('✅ API พร้อมใช้งานที่ http://localhost:3000/upload'));
