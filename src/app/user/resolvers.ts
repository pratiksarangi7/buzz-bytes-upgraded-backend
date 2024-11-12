import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    console.log(ctx);
    const id = ctx.user?.id;
    if (!id) return null;
    const user = UserService.getUserById(id);
    console.log("Fetched user details:", user);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => UserService.getUserById(id),
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("You are unauthenticated!!");

    await UserService.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS-${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("You are unauthenticated!!");
    await UserService.unfollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS-${ctx.user.id}`);
    return true;
  },
};
const extraResolvers = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { followingId: parent.id },
        include: {
          follower: true,
        },
      });
      return result.map((ele) => ele.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { followerId: parent.id },
        include: {
          following: true,
        },
      });
      return result.map((ele) => ele.following);
    },
    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS-${ctx.user.id}`
      );
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }
      const myFollowing = await prismaClient.follows.findMany({
        where: { followerId: ctx.user.id },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });

      const usersToRecommend: User[] = [];
      for (const followings of myFollowing) {
        for (const followingsOfFollowedUser of followings.following.followers) {
          if (
            followingsOfFollowedUser.followingId !== ctx.user.id &&
            myFollowing.findIndex(
              (e) => e.followingId === followingsOfFollowedUser.followingId
            ) < 0
          ) {
            usersToRecommend.push(followingsOfFollowedUser.following);
          }
        }
      }
      await redisClient.set(
        `RECOMMENDED_USERS-${ctx.user.id}`,
        JSON.stringify(usersToRecommend)
      );
      return usersToRecommend;
    },
  },
};

export const resolvers = { queries, extraResolvers, mutations };
