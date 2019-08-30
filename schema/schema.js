const graphql = require("graphql");
const _ = require("lodash");
const uuidv1 = require("uuid/v1");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Event = require("../models/event");
const mongoose = require("mongoose");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const EventType = new GraphQLObjectType({
  name: "Event",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLFloat },
    date: { type: GraphQLString },
    user: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.userId);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    events: {
      type: new GraphQLList(EventType),
      resolve(parent, args) {
        return Event.find({ userId: parent.id });
      }
    }
  })
});

// ROOT QUERY
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    event: {
      type: EventType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //Code to get data from db/other source
        return Event.findById(args.id);
      }
    },
    user: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve(parent, args) {
        const getValidUser = async () => {
          const validUser = new Promise((resolve, reject) => {
            User.findOne(
              { email: args.email },
              "password email",
              async function(err, user) {
                if (err) reject(err);
                else if (await bcrypt.compare(args.password, user.password)) {
                  resolve(user);
                } else {
                  reject("Invalid Password");
                }
              }
            );
          });
          return await validUser;
        };
        return getValidUser();
      }
    },
    events: {
      type: new GraphQLList(EventType),
      resolve(parent, args) {
        // return events;
        return Event.find({});
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        // return users.map(user => {
        //   return { ...user, password: null };
        // });
        return User.find({});
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addEvent: {
      type: EventType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        price: { type: new GraphQLNonNull(GraphQLFloat) },
        date: { type: new GraphQLNonNull(GraphQLString) },
        userId: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, args) {
        let event = new Event({
          title: args.title,
          description: args.description,
          price: args.price,
          date: new Date(args.date),
          userId: args.userId
        });
        return event.save();
      }
    },
    addUser: {
      type: UserType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLString }
      },
      resolve(parent, args) {
        return bcrypt.hash(args.password, 12).then(res => {
          let passwordSafe = res;
          if (passwordSafe) {
            let user = new User({
              email: args.email,
              password: passwordSafe
            });
            return user.save();
            //fix return only email, not password
          }
        });
      }
    }
  }
});
//EXPORTING ROOT QUERY
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
