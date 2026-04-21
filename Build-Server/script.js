const { exec } = require("child_process");
const { join } = require("path");
const { readdirSync, lstatSync, createReadStream } = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { lookup } = require("mime-types");
const Redis = require("ioredis");
require("dotenv").config();

const publisher = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const BUILD_ID = process.env.BUILD_ID;

function publishLog(log) {
  if (publisher && BUILD_ID) {
    publisher.publish(`logs:${BUILD_ID}`, JSON.stringify({ log }));
  }
  console.log(log);
}

function publishStatus(status) {
   if (publisher && BUILD_ID) {
      publisher.publish(`status:${BUILD_ID}`, JSON.stringify({ status }));
   }
}

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const PROJECT_ID = (process.env.PROJECT_ID || "").toLowerCase();
const BUCKET = process.env.BUCKET || "vercel-bucker-99";

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
    else fileList.push(filePath.substring(baseDir.length + 1));
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
      publishLog(`✅ Uploaded: ${file}`);
    } catch (err) {
      publishLog(`❌ Upload failed for ${file}: ${err.message}`);
    }
  }
}

function detectBuildCommand(projectPath, projectId) {
  const fs = require("fs");
  const { join } = require("path");

  const pkgPath = join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps['vite']) return `npx vite build`;
      if (deps['next']) return "npm run build";
      if (deps['react-scripts']) return "npm run build";
    } catch (e) {
      console.warn("Failed to parse package.json, falling back to heuristics in detectBuildCommand");
    }
  }

  if (fs.existsSync(join(projectPath, "vite.config.js")) || fs.existsSync(join(projectPath, "vite.config.ts")))
    return `npx vite build`;

  return "npm run build";
}

async function init() {
  publishLog("🚀 Starting builder...");
  publishStatus("RUNNING");
  const outDirPath = join(__dirname, "output");

  const buildCmd = detectBuildCommand(outDirPath, PROJECT_ID);
  publishLog(`🛠 Running: ${buildCmd}`);

  try {
    await new Promise((resolve, reject) => {
      publishLog("Installing dependencies and executing build...");
      const p = exec(`cd ${outDirPath} && npm install && ${buildCmd}`);
      
      p.stdout.on('data', (data) => publishLog(data.toString()));
      p.stderr.on('data', (data) => publishLog(data.toString()));
      
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Build process exited with code ' + code));
      });
    });
  } catch (err) {
    publishLog(`❌ Build failed: ${err.message}`);
    publishStatus("FAILED");
    process.exit(1);
  }

  publishLog("✅ Build complete");

  // Detect build folder (Vite/CRA/Next)
  const possibleDirs = ["dist", "build", "out", ".next"];
  const distFolder = possibleDirs.map(d => join(outDirPath, d)).find(p => require("fs").existsSync(p));

  if (!distFolder) {
    publishLog("❌ No build output found");
    publishStatus("FAILED");
    process.exit(1);
  }

  publishLog(`📁 Found build folder: ${distFolder}`);
  publishLog("⬆️ Uploading to S3...");

  await uploadFolderToS3(distFolder, `__outputs/${PROJECT_ID}`);
  publishLog("🎉 Deployment complete!");
  publishStatus("SUCCESS");
  process.exit(0);
}

init();
