"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const types_1 = require("./types");
const mutations_1 = require("./mutations");
const resolvers_1 = require("./resolvers");
const queries_1 = require("../buzz/queries");
exports.Tweet = { types: types_1.types, queries: queries_1.queries, muatations: mutations_1.muatations, resolvers: resolvers_1.resolvers };
