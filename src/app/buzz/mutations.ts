export const muatations = `#graphql
    createTweet(payload:CreateTweetData!):Tweet
    likeTweet(tweetId: ID!):Boolean
    unlikeTweet(tweetId:ID!):Boolean
`;
