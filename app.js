 /* main execution javascript file for the node.js
  * using node version-4.1.2
 *
 *Coding convention:
 *  javascript identifiers should be camelCased
 *  proper comments and indentation should be given
 *
*/


//==============================================================================
//                            DOCUMENT DESCRIPTION                            //
//==============================================================================


// NAME: APP.JS
// USE : SERVER SIDE SCRIPT
// PROJECT: STUDENT PORTAL


//==============================================================================
//                            DEPENDENCIES                                    //
//==============================================================================


//express initialization...........................
var express = require('express');
var app = express();
// import express-params
    // used for regexp route handling
    var params = require('express-params');
// import event module
var events = require('events');
// file system module import ................
var fs = require('fs');
// path module import ......................
var path = require('path');
// body-parser module for submitting forms......
var bodyParser = require('body-parser');
// database system
var mongoose=require('mongoose');
// password hashing system
var bcrypt=require('bcryptjs');
// session management system import...........
var session=require('client-sessions');
// mongojs system for integrating native mongodb style queries
// set the database Url that will be used to connect to mongodb
var databaseUrl="mongodb://localhost/svcc";
// set all the collections we have or may have in the array var below
var collections=["users","feedback"];
// require mongojs and return an object
var mongojs = require("mongojs");
// connect database url with the collections and authenticate with SramSHA1
/// for mongodb3
var db=mongojs(databaseUrl, collections, {authMechanism: 'ScramSHA1'});


//==============================================================================
//                                 MONGOJS                                    //
//==============================================================================





//==============================================================================
//                               CONFIGURATION                                //
//==============================================================================


// use sessions
app.use(session({
    cookieName:'session',
    secret: 'adwjjbdhgdawuygwy$dfhw5666&&%%w4^7**^$#%',
    duration: 30*60*1000, // in milliseconds
    activeDuration: 5*60*1000
    }));


//==============================================================================
//                       DEFAULT TEMPLATING ENGINE                            //
//==============================================================================


app.set('view engine', 'ejs');


//==============================================================================
//                              MONGOOSE                                      //
//==============================================================================


//connect mongoose to mongodb database
mongoose.connect('mongodb://localhost/svcc');

// mongoose models using Schema
var Schema= mongoose.Schema;
var ObjectId=Schema.ObjectId;
// create model user from the Schema
var User=mongoose.model('User',new Schema({

    // set by database system
    id : ObjectId,
    // set by user
    name : String,
    email : {type:String,unique:true},
    registrationNumber : {type:String,unique:true},
    degree : String,
    department : String,
    password : String,

  //  set by admin
    batch: String,
    semester:String,
    validStudent:Boolean,
    isAdmin:Boolean,
     // set automatically
    createdOn: {type:Date,default:Date.now()},
    modifiedOn:{type:Date,default:Date.now()}

}));
var feedbackModel =mongoose.model('Feedback', new Schema({
  // set by database system
  id : ObjectId,
  // set automatically to identify the user
  registrationNumber:{type:String},
  email:{type:String},
  // set by user feedback
  studentFeedback:{
  knowledgeTeacher:String,
  communicationSkill:String,
  commitment:String,
  interestGenerated:String,
  integrateCourseMaterial:String,
  integrateContent:String,
  accessibility:String,
  integrateDesign:String,
  provisionTime:String


},
  // set automatically to identify the feedback
  createdOn: {type:Date,default:Date.now()},
  modifiedOn:{type:Date,default:Date.now()}


}));





//==============================================================================
//                         MIDDLEWARES START HERE                             //
//==============================================================================
// CONTENTS:
//         |_STATIC FILES MIDDLEWARE
//         |_CUSTOM MIDDLEWARES





//==============================================================================
//                        SERVE STATIC FILES MIDDLEWARE                       //
//==============================================================================


  // put all the static files in the /views/rwd folder
  app.use(express.static(__dirname + '/views/rwd'));
  // body-parser middleware setting

  app.use(bodyParser.urlencoded({ extended : true }));
  // for parsing application form /json
  app.use(bodyParser.json());




//==============================================================================
//                             CUSTOM MIDDLEWARES                             //
//==============================================================================
//CONTAINS:
//        |_REQUIRE LOGIN MIDDLEWARE
//        |_REQUIRE ADMIN LOGIN MIDDLEWARE




//==============================================================================
//                          REQUIRE LOGIN MIDDLEWARE                          //
//==============================================================================


  //force authentication middleware
        function requireLogin(req,res,next){

    // if the user isn't logged in then
   // redirect to login page with flash message
  // current user is set after the user has logged in

        console.log('session user is');
        console.log('req.session.user');
        if (!req.session.user) {
            res.redirect('/signin');
            console.log('login required to gain access ');

        }
        // else if the user is logged in then let them pass
        else   {
            next();
        }
        };


//==============================================================================
//                       REQUIRE ADMIN LOGIN MIDDLEWARE                       //
//==============================================================================


        // force admin authentication middleware
        function requireAdminLogin(req,res,next){
          // if the logged user is not a valid admin then redirect to index page
          if(!req.session.admin.isAdmin===true || !req.session.admin ||
            req.session.admin===undefined)
          {
            //if the session user is not admin then redirect  to index
            res.redirect('/');
            console.log('admin login failed ..... redirecting to index');
          }
          // else allow the user to pass
          else{

               next();
          }
        };




//==============================================================================
//                          MAIN EXECUTION BLOCK                              //
//==============================================================================
//CONTENTS:
//        |_BASIC ROUTING
//        |_USER SIGN-UP
//        |_USER SIGN-IN
//        |_ADMIN SIGN-IN
//        |_FEEDBACK FORM

//==============================================================================
//                          ROUTING DEFINED HERE                              //
//==============================================================================


app.get('/',function(req,res){
    // render the index.ejs when the root is called
    res.render('index.ejs');
});
app.get('/signin',function(req,res){
    // render the sign in page
    res.render('signin.ejs');

});
app.get('/signup',function(req,res){
    // render the sign up page
    res.render('signup.ejs');
});

 // if the user fills up the register form and hits submit
    app.post('/signup',function(req,res){
        //send the form body in a json format
        //use only for debugging
        //comment or delete it in production format
       // console.log('Sign up request')
        //console.log(req.body);
        //res.json(req.body);
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password,salt);

        //create new user with mongoose Schema
        var user = new User({
            name:req.body.name,
            email:req.body.email,
            registrationNumber:req.body.registrationNumber,
            degree:req.body.degree,
            department:req.body.department,
            password:hash,
         // set isAdmin and validStudent to false to prevent security holes
            isAdmin:false,
            validStudent:false
            });
        user.save(function(err){
            if (err) {
                var error="something bad happened :(";
                if (error.code===11000) {
                    error="need unique email and registration number";
                    }
                console.log(error);
                res.redirect('/signup');
            }
            else{
                console.log('user created successfully');
                res.redirect('/feedback');
            }

            });
    });


//==============================================================================
//                              USER SIGN-IN                                  //
//==============================================================================


//EXECUTED: if the user fills up the sign in form and hits submit
app.post('/signin', function(req,res){
   console.log('Sign in request \n' );
   console.log(req.body);
  // res.json(req.body);
  //check the database based on email then verify the user
  User.findOne({email:req.body.email},function(err,user){
    if(!user){
        res.render('signin.ejs');
        console.log('login failed');}
        else{

// ALLOW LOGIN: if the hashed password matches and the registration number match

            if (bcrypt.compareSync(req.body.password, user.password)
                &&(user.registrationNumber === req.body.registrationNumber)
                &&(user.validStudent===true))  {

                req.session.user=user.registrationNumber;
                req.session.userEmail=user.email;
                console.log('logging email of user');
                console.log(req.session.userEmail);
                res.redirect('/feedback');
                console.log('login successfull');



            }
            else{
                console.log('Login unsuccessfull');
                res.render('signin.ejs');
            }
        }
    });

});

app.get('/return-home',function(req,res){
  // redirect to home page
  res.redirect('/');
  });


//==============================================================================
//                            FEEDBACK FORM DISPLAY                           //
//==============================================================================


// Login is required to access the feedback form
app.get('/feedback',requireLogin,function(req,res){

  if (req.session && req.session.user) {
    console.log(req.session);
    console.log(req.session.user);
User.findOne({ registrationNumber: req.session.user }, function(err, user) {
if (!user) {
req.session.reset();

res.render('signin.ejs',{errorMsg :'Log in to enter feedback form'});
} else {
res.locals.user = user;
res.render('feedbackForm.ejs',{
    // send details to be flashed onto the form
                    name:user.name,
                    registrationNumber:user.registrationNumber,
                    degree:user.degree,
                    department:user.department
                    });
}
});
} else {
res.render('signin.ejs');
// delete the user just in case one creeps in
req.session.user=undefined;
console.log("destroying any creepy user");
}
});


//==============================================================================
//                         FEEDBACK FORMM POST                                //
//==============================================================================

// EXECUTED : IF the user fills up the feedbackForm and hits submit
app.post('/feedback',function(req,res){
var feedbackSubmitted = new feedbackModel({
  // since the registrationNumber is saved as the session user during signin
  registrationNumber:req.session.user,
  // since the email is saved as req.session.userEmail during signin
  email:req.session.userEmail,
  studentFeedback:{
  knowledgeTeacher:req.body.knowledgeTeacher,
  communicationSkill:req.body.communicationSkill,
  commitment:req.body.commitment,
  interestGenerated:req.body.interestGenerated,
  integrateCourseMaterial:req.body.integrateCourseMaterial,
  integrateContent:req.body.integrateContent,
  accessibility:req.body.accessibility,
  integrateDesign:req.body.integrateDesign,
  provisionTime:req.body.provisionTime
  }
});


  feedbackSubmitted.save(function (err) {
    if (err) {
      console.log('Could not save userFeedback');

    }
    else {
      console.log('User feedback submission successfull');
      res.redirect('/logout');
    }
  });


});





//==============================================================================
//                               ADMIN LOGIN                                  //
//==============================================================================


//admin Login
app.get('/adminLogin',function(req,res){
  res.render('adminLogin.ejs');
});


// admin routing
// EXECUTE: if admin is logged in
app.get('/adminIndex',requireAdminLogin,function(req,res){
    res.render('adminIndex.ejs');
});


//==============================================================================
//                            ADMIN SIGN-IN                                   //
//==============================================================================


//EXECUTED: if the user fills up the sign in form and hits submit

app.post('/adminLogin', function(req,res){
   console.log('Admin Sign in request \n' );
   console.log(req.body);
  // res.json(req.body);
  //check the database based on email then verify the user
  User.findOne({email:req.body.email},function(err,user){
    if(!user){
        res.render('adminLogin.ejs');
        console.log('login failed');}
        else{
// ALLOW ADMIN LOGIN:
// if :
// the hashed password matches
// and
// the registration number matches

            if (bcrypt.compareSync(req.body.password, user.password)
                                    &&(user.isAdmin===true))  {

                req.session.admin=user;
                console.log('Admin:');
                console.log(req.session.admin);
                //ejs implementation
                res.redirect('/adminIndex');

            }
            else{
                console.log('admin login unsuccessfull');
                res.redirect('/');
            }
        }
    });

});

//==============================================================================
//                  ADMIN DASHBOARD GET REQUEST                               //
//==============================================================================

// must validate that the session user is logged in and an admin
// requireAdminLogin validates the session user as admin before rendering
// the dashboard


// empty array to store messages
// this array is passed to adminDashboard.ejs as {messages:messages}
var invalidStudents = [{}];

app.get('/adminDashboard',requireAdminLogin,function(req,res){
  // WARNING**********************************************************************
  // PUT THIS CODE BLOCK IN ADMIN SIGN-IN TO MAKE SURE THAT THE CODE GETS EXECUTED
  // EVERY TIME THE SESSION IS REFRESHED



  db.users.find({validStudent:false},{name:1,registrationNumber:1,
                                      validStudent:1},function(err,student){

      if (err || !student) {
          console.log("student doesnt exist");
      }
      else
          student.forEach(function(studentUser){

              console.log(studentUser);
              console.log('__________________________________________________');
              invalidStudents[invalidStudents.length]={name:studentUser.name ,
                    registrationNumber: studentUser.registrationNumber};
              console.log("logging invalidStudents")
              console.log(invalidStudents);

          });
          // the response has to be put after the modification of the array
          // so that NODE.JS can asynchronously pass the messages after they are
          // ready
          res.render('adminDashboard.ejs',{messages:invalidStudents});
          console.log('admin login successfull');
  });
  // now clear the messages array
  // to prevent duplicate additions when the page is refreshed
  invalidStudents=[{}];
});


//==============================================================================
//                WILDCARD USER ROUTING FOR ADMIN DASHBOARD                   //
//==============================================================================


// id wildcard selective user routing for admin dashoard

app.get('/adminIndex/:id?',function(req,res){
    if (req.params.id) {
        // set the wildcard route id to a variable 'id'
        var id=req.params.id;
       //if user is found after clicking the link then render his/her details
       // but dont show password,hence(password:0)
      db.users.findOne({registrationNumber:id},{password:0},
                                                function(err,wildRouteCb){
        // callback returned by the mongojs query is wildRouteCb
        if (err || !wildRouteCb) {
            console.error(err);
        }else
        // set a default variable
        var studentProfile=[];
        // render the studentProfile for the admin to view
        studentProfile[studentProfile.length]=wildRouteCb;
        res.render('studentProfile.ejs',{studentProfile:studentProfile});


        });
    }
    else
    res.send("failed");

    });


//==============================================================================
//               WILDCARD USER MODIFICATION FROM ADMIN DASHBOARD              //
//==============================================================================


app.post('/adminIndex/:id?',function(req,res,err){
  if (err) {
    console.error(err);
} else
    console.log(req.params.id);
    db.users.update({registrationNumber:req.params.id},
              {$set:{validStudent:req.body.validStudent}},
      function(err,postStudentProfile){
        if (err) {
          console.log('studentProfile post failure ........');
          console.error(err);
        }else {
          res.redirect('/adminIndex');
          console.log('studentProfile post successfull ...');
          console.log('...... redirecting to adminIndex');
        }
      });

  });



//==============================================================================
//                           LOGOUT ROUTING                                   //
//==============================================================================
app.get('/logout',function(req,res){
    // req.session.user = undefined; will delete the user and log out
   //make sure to put it inside the feedback form post method
   // so that when the user logs out or submits the form and we want
   // the user to log out then we can call it to destroy the user

   req.session.user=undefined;
    console.log('logout message :');
    console.log(req.session.user);
    res.redirect('/');
    console.log("redirecting to root");
    });




//==============================================================================
//                            ROUTING ENDS HERE                               //
//==============================================================================




// start listening on port 3000..............
app.listen(3000);

console.log('Listening on port 3000');
