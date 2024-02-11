const express = require("express");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand, Scope } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const {Redis} = require("ioredis");

const app = express();
const PORT = process.env.PORT || 9000;

const subscriber = new Redis(
  process.env.REDIS_HOST,
);

const io = new Server({cors:'*'});

io.on('connection', (socket) => {
  socket.on('subscribe', channel => {
    socket.join(channel);
    socket.emit('message', `Subscribed/Joined to ${channel}`);
  })
});
io.listen(9001, () => {console.log('Socket.io server is running on port 9001')});

const config = {
  CLUSTER: process.env.CLUSTER_ARN,
  TASK: process.env.TASK_DEFINITION_ARN,
};

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware
app.use(express.json());

app.post("/project", async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  // Spin the container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          process.env.SUBNET1,
          process.env.SUBNET2,
          process.env.SUBNET3,
        ],
        securityGroups: [process.env.SECURITY_GROUP],
      },
    },
    overrides: {
      // Yha pe environment variables set krne h
      containerOverrides: [
        {
          name: process.env.TASK_DEFIANTION_NAME,
          environment: [
            { name: "GIT_REPOSITORY__URL", value: gitURL },
            { name: "PROJECT_ID", value: projectSlug },
          ],
        },
      ],
    },
  });

  //Send the command to ECS
  await ecsClient.send(command);
  // return the response
  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}.localhost:8000/` },
  });
});

// Subscribe to the logs
async function initRedisSubscriber() {
  console.log("Subscribed to logs...");
  subscriber.psubscribe('logs:*');
  subscriber.on('pmessage', (pattern, channel, message)=>{
    io.to(channel).emit('message', message);
  })
}
initRedisSubscriber();
app.listen(PORT, () => console.log(`API Server is running on port ${PORT}`));
