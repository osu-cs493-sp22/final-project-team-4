const express = require("express");
const morgan = require("morgan");
const redis = require("redis");
const jwt = require("jsonwebtoken");

const api = require("./api");
const { connectToDb } = require("./lib/mongo");

const app = express();
const port = process.env.PORT || 8000;

/**
 * Redis ports and functions
 */
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || "6379";
const redisClient = redis.createClient({url: `redis://${redisHost}:${redisPort}`})
const rateLimitWindowMaxRequests = 10; //per ip
const rateLimitWindowMilliseconds = 60000; // 1 minute
const authUserRateLimitWindowMaxRequests = 30; //per user

async function manageBucket(perBasis, maxRequest) {
   let tokenBucket;
    try {
    tokenBucket = await redisClient.hGetAll(perBasis);
  } catch (error) {
    console.log("error")
    return;
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || maxRequest,
    last: parseInt(tokenBucket.last) || Date.now(),
  };
  console.log("== tokenBucket:", tokenBucket);

  const now = Date.now();
  const ellapsedMs = now - tokenBucket.last;
  tokenBucket.tokens +=
    ellapsedMs * (maxRequest / rateLimitWindowMilliseconds);
  tokenBucket.tokens = Math.min(maxRequest, tokenBucket.tokens);
  tokenBucket.last = now;

  if (tokenBucket.tokens >= 1) {
    tokenBucket.tokens -= 1;
    await redisClient.hSet(perBasis, [
      ["tokens", tokenBucket.tokens],
      ["last", tokenBucket.last]
    ]);
    return
  } else {
    await redisClient.hSet(perBasis, [
      ["tokens", tokenBucket.tokens],
      ["last", tokenBucket.last],
    ]);
    console.log("returning error")
    return 1
  }
}


async function rateLimit(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const authParts = authHeader.split(" ");
  const token = authParts[0] === "Bearer" ? authParts[1] : null;
  console.log("==token",token)
  const ip = req.ip;
  if (token){
    const payload = jwt.verify(token, "SuperSecret");
    console.log("== payload:", payload);
    const userId = payload.sub;
    if (userId) {
      if(await manageBucket(userId, authUserRateLimitWindowMaxRequests) == 1){
        console.log("too many requests")
        res.status(429).send({
          err: "Too many requests per minute"
        })
      }else{
        next()
      }
    }
    else {
      if(await manageBucket(ip, rateLimitWindowMaxRequests) == 1){
        console.log("too many requests")
        res.status(429).send({
          err: "Too many requests per minute"
        })
      }else{
        next()
      }
    }
  }else{
    if(await manageBucket(ip, rateLimitWindowMaxRequests) == 1){
      console.log("too many requests")
      res.status(429).send({
        err: "Too many requests per minute"
      })
    }else {
      next()
    }
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

// TODO: FIXME:
redisClient.connect().then(connectToDb(function () {
  app.listen(port, () => {
    console.log("== server is running on port:", port);
  });
}));
