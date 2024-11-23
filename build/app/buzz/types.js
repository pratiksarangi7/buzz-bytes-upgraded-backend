"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
    enum Tag {
        FFCS
        CABSHARING
        LOST_AND_FOUND
        CAREER
        EVENTS
        EXAM_DISCUSSIONS
    }

    input CreateTweetData {
        content: String!
        imageURL: String
        tag: Tag!
    }
    input CreateCommentData{
        content:String!
        tweetId:ID!
    }
    type Tweet {
        id: ID!
        content: String!
        imageURL: String
        author: User
        isLiked: Boolean
        likeCount: Int
        tag: Tag!
        comments:[Comment]
    }
    type Comment {
        id: ID!
        content: String!
        author: User
        createdAt: String!
        updatedAt: String!
    }

`;
