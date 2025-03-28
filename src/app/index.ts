import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { User } from "./user";
import { Tweet } from "./buzz";
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/jwt";

export async function initServer() {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.get("/", (req, res) =>
    res.status(200).json({ message: "Everything is good" })
  );
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
       ${User.types}
       ${Tweet.types}

        type Query {
            ${User.queries}
            ${Tweet.queries}
        }

        type Mutation {
          ${Tweet.muatations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    },
  });

  await graphqlServer.start();

  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWTService.decodeToken(req.headers.authorization.split(" ")[1])
            : undefined,
        };
      },
    })
  );

  return app;
}
