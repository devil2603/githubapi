const express = require("express");
const con = require("./database");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const otpGenerator = require("otp-generator");

const router = express.Router();
// const logger = require("../logger");


const register = async (req, res, next) => {
  try {
      const { name, email, password,role,email_preference, team_member, package_id } = req.body;
      if (!name || !email || !password || !role || !email_preference || !team_member || !package_id) {
          res.status(400).send({
              message: "bad request",
          });
          return;
      }
console.log(req.body);
      const hashpassword = await bcrypt.hash(password, saltRounds);
console.log(hashpassword);
      const queryString = `INSERT INTO users (name, email, password, role,email_preference, team_member, package_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)`;

          console.log(queryString);
          const [result] = await con.promise().execute(queryString, [name, email, hashpassword,role,email_preference,  team_member, package_id]);
          console.log(result);
      if (result.affectedRows === 0) {
          res.status(400).send({
              message: "User not inserted",
          });
          return;
      }

      res.status(201).send({
          message: "User registered successfully",
          result,
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          message: "Error while creating user",
          error,
      });
  }
};

  
  function generateNumericOTP(length) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }
  

const userlogin = async (req, res, next) => {
    try {
      const { email } = req.body;
      const { password } = req.body;
  
      if (!email && !password) {
        res.status(400).send({
          message: "missing parameters",
        });
      } else {
        let string = `select email,password from users  where email=?`;
        let [result] = await con.promise().execute(string, [email]);
  
        if (result.length === 0) {
          res.status(404).send({
            message: "User not found",
          });
        }
        const hashpassword = result[0].password;
  
        const decryptpassword = await bcrypt.compare(password, hashpassword);
        if (!decryptpassword) {
          res.status(401).send({
            message: "Invalid Password",
          });
        }
  
        const token = jwt.sign({ user_id: result[0].id }, "test");
  
        const responseBody = {
          message: "Loggedin Successful",
          token,
        };
  
        res.status(200).send(responseBody);
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error while getting user",
        error,
      });
    }
  };


  const forgetpass = async (req, res, next) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).send({
          message: "Email required",
        });
      }
  
      const queryEmail = `SELECT email FROM users WHERE email = ?`;
      const [result] = await con.promise().execute(queryEmail, [email]);
  
      if (result.length === 0) {
        return res.status(404).send({
          message: "Email not found in the database",
        });
      }
  
      const otp = generateNumericOTP(4);
  
      const queryInsertOTP = `UPDATE users SET otp = ? WHERE email = ?`;
      await con.promise().execute(queryInsertOTP, [otp, email]);
  
      console.log("OTP:", otp);
  
      res.status(201).send({
        message: "OTP has been sent to your Email",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  const updatepass = async (req, res, next) => {
    const { otp, password } = req.body;
  
    try {
      if (!otp && !password) {
        res.status(400).send({
          message: "otp & password is required",
        });
      }
  
      const queryCheckOTP = `SELECT * FROM users WHERE otp = ?`;
      const [result] = await con.promise().execute(queryCheckOTP, [otp]);
  
      if (result.length === 0 || result[0].otp !== otp) {
        return res.status(400).send({
          message: "Invalid OTP",
        });
      }
      const userEmail = result[0].email;
      const queryUpdatePassword = `UPDATE users SET password = ? WHERE email = ?`;
      await con.promise().execute(queryUpdatePassword, [password, userEmail]);
  
      const queryClearOTP = `UPDATE users SET otp = NULL WHERE email = ?`;
      await con.promise().execute(queryClearOTP, [userEmail]);
  
      res.status(200).send({
        message: "Password updated successfully",
      });
    } catch (error) {
      res.status(500).send({
        message: "invalid request",
      });
    }
  };
  


  const authMiddleware = (req, res, next) => {
    if (req.headers && req.headers.token) {
      try {
        const token = req.headers.token;
        const decodedToken = jwt.verify(token, "tetseytyustu");
        console.log(decodedToken);
      } catch (err) {
        console.log({ err });
        res.status(400).send({
          message: "Invalid Token",
        });
      }
      next();
      return;
    }
    res.status(400).send({
      message: "Token Required",
    });
  };
  

router.post("/login", userlogin);
router.post("/register", register);
// router.get("/product", getnew);
router.post("/passforget", forgetpass);
router.post("/updatepass", updatepass);

module.exports = router;