import { Tag } from "@prisma/client";
import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayload {
  content: string;
  imageURL?: string;
  userId?: string;
  tag: Tag;
}

class TweetService {
  public static async createTweet(data: CreateTweetPayload) {
    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:TWEET:${data.userId}`
    );
    if (rateLimitFlag) throw new Error("Wait for atleast 10 secs...");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        tag: data.tag,
        author: { connect: { id: data.userId } },
      },
    });
    await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
    await redisClient.del("ALL_TWEETS");
    return tweet;
  }
  public static async getAllTweets() {
    const cachedTweets = await redisClient.get("ALL_TWEETS");
    if (cachedTweets) return JSON.parse(cachedTweets);

    const tweets = await prismaClient.tweet.findMany({
      orderBy: { createdAt: "desc" },
    });
    await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
    return tweets;
  }
  public static async likeTweet(tweetId: string, userId: string) {
    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:LIKE:${userId}-${tweetId}`
    );
    if (rateLimitFlag) throw new Error("Wait for atleast 10 secs...");
    const existingLike = await prismaClient.like.findUnique({
      where: { userId_tweetId: { tweetId, userId } },
    });
    if (existingLike) return false;
    await prismaClient.like.create({
      data: {
        tweet: { connect: { id: tweetId } },
        user: { connect: { id: userId } },
      },
    });
    await redisClient.setex(`RATE_LIMIT:LIKE:${userId}-${tweetId}`, 10, 1);
    await redisClient.del("ALL_TWEETS");
  }
  public static async unlikeTweet(tweetId: string, userId: string) {
    await prismaClient.like.delete({
      where: { userId_tweetId: { userId, tweetId } },
    });
  }
}

export default TweetService;
