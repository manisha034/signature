const express = require("express");
const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configure multer to save files with correct extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // get extension
    const cleanName = Date.now() + ext;
    cb(null, cleanName);
  }
});

const upload = multer({ storage: storage });

// Route to generate T-shirt design
app.post("/generate", upload.single("photo"), async (req, res) => {
  try {
    const { name, roll, size } = req.body;
    const photoPath = req.file.path;

    // Canvas size for print-ready (A4 300 DPI approx)
    const width = 2480;
    const height = 3508;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 120px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Signature Day 2026", width / 2, 300);

    // Load student photo
    const studentImage = await loadImage(photoPath);

    // Circular crop photo
    const imgSize = 800;
    const imgX = width / 2;
    const imgY = 600;
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(studentImage, imgX - imgSize / 2, imgY, imgSize, imgSize);
    ctx.restore();

    // Student Name
    ctx.font = "bold 100px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(name, width / 2, 1550);

    // Roll Number
    ctx.font = "70px Arial";
    ctx.fillText(`Roll No: ${roll}`, width / 2, 1700);

    // Size
    ctx.fillText(`Size: ${size}`, width / 2, 1850);

    // Save output file
    const outputFileName = `${name.replace(/\s/g, "_")}_${roll}.png`;
    const outputPath = path.join("output", outputFileName);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    res.json({
      message: "Design generated successfully!",
      file: outputPath
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});