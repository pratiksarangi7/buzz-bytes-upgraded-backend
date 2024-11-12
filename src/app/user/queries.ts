export const queries = `#graphql
    verifyGoogleToken(token: String!):String
    getCurrentUser: User
    getCurrentUserTweets: [Tweet]
    getUserById(id:ID!):User
`;
