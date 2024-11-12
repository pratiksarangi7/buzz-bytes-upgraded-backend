"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../clients/redis");
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const resultToken = yield user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        console.log(ctx);
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return null;
        const user = user_1.default.getUserById(id);
        console.log("Fetched user details:", user);
        return user;
    }),
    getUserById: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { id }, ctx) { return user_1.default.getUserById(id); }),
};
const mutations = {
    followUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("You are unauthenticated!!");
        yield user_1.default.followUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS-${ctx.user.id}`);
        return true;
    }),
    unfollowUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("You are unauthenticated!!");
        yield user_1.default.unfollowUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS-${ctx.user.id}`);
        return true;
    }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { followingId: parent.id },
                include: {
                    follower: true,
                },
            });
            return result.map((ele) => ele.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { followerId: parent.id },
                include: {
                    following: true,
                },
            });
            return result.map((ele) => ele.following);
        }),
        recommendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                return [];
            const cachedValue = yield redis_1.redisClient.get(`RECOMMENDED_USERS-${ctx.user.id}`);
            if (cachedValue) {
                return JSON.parse(cachedValue);
            }
            const myFollowing = yield db_1.prismaClient.follows.findMany({
                where: { followerId: ctx.user.id },
                include: {
                    following: {
                        include: { followers: { include: { following: true } } },
                    },
                },
            });
            const usersToRecommend = [];
            for (const followings of myFollowing) {
                for (const followingsOfFollowedUser of followings.following.followers) {
                    if (followingsOfFollowedUser.followingId !== ctx.user.id &&
                        myFollowing.findIndex((e) => e.followingId === followingsOfFollowedUser.followingId) < 0) {
                        usersToRecommend.push(followingsOfFollowedUser.following);
                    }
                }
            }
            yield redis_1.redisClient.set(`RECOMMENDED_USERS-${ctx.user.id}`, JSON.stringify(usersToRecommend));
            return usersToRecommend;
        }),
    },
};
exports.resolvers = { queries, extraResolvers, mutations };
