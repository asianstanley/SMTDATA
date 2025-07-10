const express = require("express");
const { Octokit } = require("@octokit/rest");
const XLSX = require("xlsx");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const octokit = new Octokit({ auth: "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" });
const owner = "asianstanley";
const repo = "SMTDATA";
const filePath = "SMTDATA.xlsx";
const branch = "main";

app.get("/data", async (req, res) => {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
    const content = Buffer.from(data.content, 'base64');
    const workbook = XLSX.read(content, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    res.json(jsonData);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading Excel data");
  }
});

app.post("/save", async (req, res) => {
  try {
    const jsonData = req.body;

    // แปลง JSON กลับเป็น sheet
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: "xlsx" });
    const base64Data = buffer.toString("base64");

    // ต้องการ SHA เก่าเพื่อ update
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });

    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: "Update data from web",
      content: base64Data,
      sha: fileData.sha,
      branch
    });

    res.json({ success: true, url: response.data.content.html_url });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
