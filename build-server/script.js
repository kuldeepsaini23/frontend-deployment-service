const { exec } = require("child_process");
const path = require("path");
const mime = require("mime-types");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();
// file system module
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
      accessKeyId: 'AKIA4SGZZAHUZG7YVAHG',
      secretAccessKey: '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'
  }
})

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing Script.js");
  // __dirname(/home/app/) is the directory of the current file
  const outDirPath = path.join(__dirname, "output");
  // go to the output directory and install the dependencies and build the project
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  // applying event listeners to the process
  p.stdout.on("data", function (data) {
    // The data event is fired when the process writes to its stdout
    //* This is a Buffer object
    console.log(data);
  });

  // On error
  p.stdout.on("error", function (data) {
    //* This is a Buffer object
    console.log("Error: ", data.toString());
  });

  // On close
  p.stdout.on("close", async function (data) {
    //* This is a Buffer object
    console.log("Build Successfull🎉🥳🥳🎉");
    // console.log("Close: ", data.toString());
    const distFolderPath = path.join(__dirname, 'output', 'dist')
    // get the content of the dist folder(Array)
    const distFolderContent = fs.readdirSync(distFolderPath, {
      recursive: true,
    });
    for (const file of distFolderContent) {
      //! Yha pe glti ki hai filepath calculate krna hai
      const filePath = path.join(distFolderPath, file);
      // check if the file is a directory then continue
      if (fs.lstatSync(filePath).isDirectory()) {
        continue;
      }

      console.log(`Uploading ${filePath} to S3`);
      const command = new PutObjectCommand({
        // Bucket: process.env.BUCKET_NAME,
        Bucket:'vercel-clone-kuldeep',
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });
      await s3Client.send(command);
      console.log(`Uploaded ${filePath} to S3`);
    }
    console.log("Done uploading files to S3🎉🥳🥳🎉");
  });
}


init();
