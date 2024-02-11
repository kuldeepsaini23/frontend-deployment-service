const { exec } = require("child_process");
const path = require("path");
const mime = require("mime-types");
const dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();
const { Redis } = require("ioredis");


// file system module
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


const publisher = new Redis(process.env.REDIS_HOST);

const PROJECT_ID = process.env.PROJECT_ID;

function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(log));
}

async function init() {
  console.log("Executing Script.js");
  publishLog("Build Started...");
  // __dirname(/home/app/) is the directory of the current file
  const outDirPath = path.join(__dirname, "output");
  // go to the output directory and install the dependencies and build the project
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  // applying event listeners to the process
  p.stdout.on("data", function (data) {
    // The data event is fired when the process writes to its stdout
    //* This is a Buffer object
    console.log(data.toString());
    publishLog(data.toString());
  });

  // On error
  p.stdout.on("error", function (data) {
    //* This is a Buffer object
    console.log("Error: ", data.toString());
    publishLog("Error: ", data.toString());
  });

  // On close
  p.stdout.on("close", async function (data) {
    //* This is a Buffer object
    console.log("Build Successfull🎉🥳🥳🎉");
    publishLog("Build Successfull🎉🥳🥳🎉");
    // console.log("Close: ", data.toString());
    const distFolderPath = path.join(__dirname, "output", "dist");
    // get the content of the dist folder(Array)
    const distFolderContent = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    publishLog("Starting upload...");

    for (const file of distFolderContent) {
      //! Yha pe glti ki hai filepath calculate krna hai
      const filePath = path.join(distFolderPath, file);
      // check if the file is a directory then continue
      if (fs.lstatSync(filePath).isDirectory()) {
        continue;
      }

      console.log(`Uploading ${filePath} to S3`);
      publishLog(`Uploading ${filePath} to S3`);
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        // Bucket: "vercel-clone-kuldeep",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });
      await s3Client.send(command);
      console.log(`Uploaded ${filePath} to S3`);
      publishLog(`Uploaded ${filePath} to S3`);
    }
    console.log("Done uploading files to S3🎉🥳🥳🎉");
    publishLog("Done uploading files to S3🎉🥳🥳🎉");
  });
}

init();
