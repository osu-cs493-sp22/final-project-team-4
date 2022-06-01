const express = require("express");
const morgan = require("morgan");
const redis = require("redis");

const api = require("./api");
const { connectToDb } = require("./lib/mongo");

const app = express();
const port = process.env.PORT || 8000;

/**
 * Redis ports and functions
 */
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || "6379";
const redisClient = redis.createClient(redisHost, redisPort);
const rateLimitWindowMaxRequests = 10; //per ip
const rateLimitWindowMilliseconds = 60000; // 1 minute
const authUserrateLimitWindowMaxRequests = 30; //per user

async function rateLimit(req, res, next) {
  ip = req.ip;

  let tokenBucket;

  try {
    tokenBucket = await redisClient.hGetAll(ip);
  } catch (error) {
    next();
    return;
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || rateLimitWindowMaxRequests,
    last: parseInt(tokenBucket.last) || Date.now(),
  };
  console.log("== tokenBucket:", tokenBucket)
  
  const now = Date.now()
  const ellapsedMs = now - tokenBucket.last
  tokenBucket.tokens += ellapsedMs * (rateLimitWindowMaxRequests / rateLimitWindowMilliseconds)
  tokenBucket.tokens = Math.min(rateLimitWindowMaxRequests, tokenBucket.tokens)
  tokenBucket.last = now

  if (tokenBucket.tokens >= 1) {
    tokenBucket.tokens -= 1
    await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
    
  } else {
    await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
    res.status(429).send({
      err: "too many requests per minute"
    })
  }

}

app.use(rateLimit);
/*
 * Morgan is a popular logger.
 */
app.use(morgan("dev"));

app.use(express.json());
app.use(express.static("public"));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use("/", api);

app.use("*", function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist",
  });
});

connectToDb(function () {
  app.listen(port, function () {
    console.log("== Server is running on port", port);
  });
});

redisClient.connect().then(function () {
  app.listen(port, () => {
    console.log("== server is running on port:", port);
  });
});
