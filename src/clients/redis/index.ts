import * as dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();
console.log(process.env.REDIS_URL);
export const redisClient = new Redis(process.env.REDIS_URL as string);
