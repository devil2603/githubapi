const express = require("express");
const con = require("./database");
const uuId = require("uuid").v4;
//const fs = require("fs");
// const router = express-router();
const cors = require("cors")
const userapi = require("./githubapi")

const bodyParser = require("body-parser");
// const uuId = uuidv4()
const app = express();

const options = {
  origin: "*",
  methods: "GET,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(options));

app.use((req, res, next) => {
  req.headers["request_id"] = uuId();
  next();
});
  
  app.use(bodyParser.json());

  app.use("/v1", userapi);
//   app.get("/product", getnew);
//   app.put("/updateproduct",update);


//   app.get("/getwishlist" , getwishlist)
//server listen
app.listen(3000, () => {
  console.log(`server started`);
});