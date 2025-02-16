import { Comment, Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/buzz";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

const queries = {
  getAllTweets: async () => {
    const tweets = TweetService.getAllTweets();
    return tweets;
  },
  getSignedURLForTweet: async (
    parent: any,
    { imageType }: { imageType: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("You are unauthenticated");
    const allowedImgTypes = ["jpeg", "jpg", "png", "webp"];
    if (!allowedImgTypes.includes(imageType))
      throw new Error("Unsupported Img type");
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${
        ctx.user.id
      }/tweets/${Date.now().toString()}.${imageType}`,
    });
    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
  },
};

const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated!!");
    const tweet = await TweetService.createTweet({
      ...payload,
      userId: ctx.user.id,
    });
    return tweet;
  },
  createComment: async (
    parent: any,
    { payload }: { payload: { content: string; tweetId: string } },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated!!");
    const comment = await prismaClient.comment.create({
      data: {
        content: payload.content,
        tweet: { connect: { id: payload.tweetId } },
        author: { connect: { id: ctx.user.id } },
      },
    });
    return comment;
  },
  likeTweet: async (
    parent: any,
    { tweetId }: { tweetId: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated!!");

    await TweetService.likeTweet(tweetId, ctx.user.id);
    return true;
  },
  unlikeTweet: async (
    parent: any,
    { tweetId }: { tweetId: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated!!");
    await TweetService.unlikeTweet(tweetId, ctx.user?.id);
    return true;
  },
};

const extraResolvers = {
  Tweet: {
    author: (parent: Tweet) => UserService.getUserById(parent.authorId),
    isLiked: async (parent: Tweet, args: any, ctx: GraphqlContext) => {
      if (!ctx.user) return false;
      const likeExists = await prismaClient.like.findUnique({
        where: { userId_tweetId: { userId: ctx.user.id, tweetId: parent.id } },
      });
      return Boolean(likeExists);
    },
    likeCount: async (parent: Tweet) => {
      const cnt = await prismaClient.like.count({
        where: { tweetId: parent.id },
      });
      return cnt;
    },
    comments: async (parent: Tweet) => {
      const comments = await prismaClient.comment.findMany({
        where: { tweetId: parent.id },
        orderBy: { createdAt: "desc" },
      });
      return comments;
    },
  },
  Comment: {
    author: (parent: Comment) => UserService.getUserById(parent.authorId),
  },
};

export const resolvers = { queries, mutations, extraResolvers };
