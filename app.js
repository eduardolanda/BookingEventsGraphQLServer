const express = require("express");
const graphqlHTTP = require("express-graphql");
const schema = require("./schema/schema");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");

const mongo = mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-u3hbs.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
  { useNewUrlParser: true }
);
mongo
  .then(() => {
    console.log("connected");
  })
  .catch(err => {
    console.log("err", err);
  });

app.use(cors());

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(4000, () => {
  console.log("Listening request on port 4000");
});
