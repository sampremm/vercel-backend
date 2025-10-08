const { execSync } = require("child_process");
const { join } = require("path");
const { readdirSync, lstatSync, createReadStream } = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { lookup } = require("mime-types");
require("dotenv").config();

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const PROJECT_ID = process.env.PROJECT_ID;
const BUCKET = process.env.BUCKET || "vercel-project-clone";

if (!PROJECT_ID || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

function walkDir(dir, fileList = [], baseDir = dir) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (lstatSync(filePath).isDirectory()) walkDir(filePath, fileList, baseDir);
    else fileList.push(filePath.replace(baseDir + "/", ""));
  }
  return fileList;
}

async function uploadFolderToS3(folderPath, prefix) {
  const files = walkDir(folderPath);
  for (const file of files) {
    const filePath = join(folderPath, file);
    const params = {
      Bucket: BUCKET,
      Key: `${prefix}/${file}`,
      Body: createReadStream(filePath),
      ContentType: lookup(filePath) || "application/octet-stream",
    };
    try {
      await s3Client.send(new PutObjectCommand(params));
      console.log("✅ Uploaded:", file);
    } catch (err) {
      console.error("❌ Upload failed for", file, err.message);
    }
  }
}

function detectBuildCommand(projectPath, projectId) {
  const fs = require("fs");
  if (fs.existsSync(join(projectPath, "vite.config.js")))
    return `npx vite build --base=/${projectId}/`;
  if (fs.existsSync(join(projectPath, "next.config.js")))
    return "npm run build";
  if (fs.existsSync(join(projectPath, "react-scripts")))
    return "npm run build";
  return "npm run build";
}

async function init() {
  console.log("🚀 Starting builder...");
  const outDirPath = join(__dirname, "output");

  const buildCmd = detectBuildCommand(outDirPath, PROJECT_ID);
  console.log("🛠 Running:", buildCmd);

  try {
    execSync(`cd ${outDirPath} && npm install && ${buildCmd}`, { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Build failed:", err.message);
    process.exit(1);
  }

  console.log("✅ Build complete");

  // Detect build folder (Vite/CRA/Next)
  const possibleDirs = ["dist", "build", ".next"];
  const distFolder = possibleDirs.map(d => join(outDirPath, d)).find(p => require("fs").existsSync(p));

  if (!distFolder) {
    console.error("❌ No build output found");
    process.exit(1);
  }

  console.log("📁 Found build folder:", distFolder);
  console.log("⬆️ Uploading to S3...");

  await uploadFolderToS3(distFolder, `__outputs/${PROJECT_ID}`);
  console.log("🎉 Deployment complete!");
}

init();
