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
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static verifyGoogleAuthToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleToken = token;
            const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
            googleOauthURL.searchParams.set("id_token", googleToken);
            const { data } = yield axios_1.default.get(googleOauthURL.toString(), {
                responseType: "json",
            });
            const user = yield db_1.prismaClient.user.findUnique({
                where: { email: data.email },
                include: {
                    tweets: true,
                },
            });
            let newUser;
            if (!user) {
                newUser = yield db_1.prismaClient.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageURL: data.picture,
                    },
                });
            }
            const finalUser = user ? user : newUser;
            if (!finalUser)
                return "No user found";
            const userToken = yield jwt_1.default.generateTokenForUser(finalUser);
            return userToken;
        });
    }
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.prismaClient.user.findUnique({
                where: { id },
                include: { tweets: true },
            });
            console.log(user);
            return user;
        });
    }
    static followUser(from, to) {
        return db_1.prismaClient.follows.create({
            data: {
                follower: {
                    connect: { id: from },
                },
                following: {
                    connect: { id: to },
                },
            },
        });
    }
    static unfollowUser(from, to) {
        return db_1.prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } },
        });
    }
}
exports.default = UserService;
