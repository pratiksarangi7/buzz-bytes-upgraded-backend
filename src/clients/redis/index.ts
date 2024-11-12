import Redis from "ioredis";

export const redisClient = new Redis(
  "rediss://default:AWN_AAIjcDExOGMwYzAyZjQxMTA0YjMxOTMxNThjNjRhZmFlYjc0ZnAxMA@endless-cheetah-25471.upstash.io:6379"
);
