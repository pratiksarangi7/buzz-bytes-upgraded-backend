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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const user_1 = __importDefault(require("../../services/user"));
const buzz_1 = __importDefault(require("../../services/buzz"));
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_DEFAULT_REGION,
});
const queries = {
    getAllTweets: () => __awaiter(void 0, void 0, void 0, function* () {
        const tweets = buzz_1.default.getAllTweets();
        return tweets;
    }),
    getSignedURLForTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { imageType }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("You are unauthenticated");
        const allowedImgTypes = ["jpeg", "jpg", "png", "webp"];
        if (!allowedImgTypes.includes(imageType))
            throw new Error("Unsupported Img type");
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `uploads/${ctx.user.id}/tweets/${Date.now().toString()}.${imageType}`,
        });
        const signedURL = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand);
        return signedURL;
    }),
};
const mutations = {
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        if (!ctx.user)
            throw new Error("You are not authenticated!!");
        const tweet = yield buzz_1.default.createTweet(Object.assign(Object.assign({}, payload), { userId: ctx.user.id }));
        return tweet;
    }),
    createComment: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        if (!ctx.user)
            throw new Error("You are not authenticated!!");
        const comment = yield db_1.prismaClient.comment.create({
            data: {
                content: payload.content,
                tweet: { connect: { id: payload.tweetId } },
                author: { connect: { id: ctx.user.id } },
            },
        });
        return comment;
    }),
    likeTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { tweetId }, ctx) {
        if (!ctx.user)
            throw new Error("You are not authenticated!!");
        yield buzz_1.default.likeTweet(tweetId, ctx.user.id);
        return true;
    }),
    unlikeTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { tweetId }, ctx) {
        var _b;
        if (!ctx.user)
            throw new Error("You are not authenticated!!");
        yield buzz_1.default.unlikeTweet(tweetId, (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id);
        return true;
    }),
};
const extraResolvers = {
    Tweet: {
        author: (parent) => user_1.default.getUserById(parent.authorId),
        isLiked: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                return false;
            const likeExists = yield db_1.prismaClient.like.findUnique({
                where: { userId_tweetId: { userId: ctx.user.id, tweetId: parent.id } },
            });
            return Boolean(likeExists);
        }),
        likeCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const cnt = yield db_1.prismaClient.like.count({
                where: { tweetId: parent.id },
            });
            return cnt;
        }),
        comments: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const comments = yield db_1.prismaClient.comment.findMany({
                where: { tweetId: parent.id },
                orderBy: { createdAt: "desc" },
            });
            return comments;
        }),
    },
    Comment: {
        author: (parent) => user_1.default.getUserById(parent.authorId),
    },
};
exports.resolvers = { queries, mutations, extraResolvers };
