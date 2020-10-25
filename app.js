//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Level 5 security: session and cookie
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Set a plugin to hash, salt a password and save it to MongoDB
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// passport/passport-local configuration
passport.use(User.createStrategy()); // Create the local strategy to authenticate users using their username and password
passport.serializeUser(User.serializeUser()); // Create a cookie and add user's information to the cookie
passport.deserializeUser(User.deserializeUser()); // Destroy a cookie



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.render("login");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});




app.post("/register", function(req, res){

  // Use passport-local-mongoose as a middleware
  // to replace creating new user, saving and interacting with Mongoose directly
  User.register({username: req.body.username},     req.body.password, function(err, user){
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      // authenticate type: local
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});


app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")( req, res, function() {
          res.redirect("/secrets");
        });
      }
    });

});


app.listen(3000, function(){
  console.log("Server started");
});
