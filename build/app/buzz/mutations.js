"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.muatations = void 0;
exports.muatations = `#graphql
    createTweet(payload:CreateTweetData!):Tweet
    likeTweet(tweetId: ID!):Boolean
    unlikeTweet(tweetId:ID!):Boolean
    createComment(payload:CreateCommentData):Comment
`;
