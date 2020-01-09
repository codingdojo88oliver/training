const express = require('express');
const app = express();
const bodyParser= require('body-parser')
const mysql = require('mysql');  
const session = require('express-session')
const moment = require('moment');
const flash = require('express-flash');

var config = {  
    host: "localhost",  
    user: "root",  
    password: "",  
    database: "vpp" 
}

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config);

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            console.log('reconnecting...');
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

app.use(flash());
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: {}
}))

app.use(express.urlencoded({extended: true}));

app.use(express.static(__dirname + "/public"));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
    
     response.render('index');
});

app.post('/register', function(req, res) { 
    var errors = [];

    if  (req.body.name.length < 3){
        errors.push("Name should be at least 3 characters")
    }
    if  (req.body.password.length < 6){
        errors.push("Password should be at least 6 characters")
    }
    if  (req.body.password.length != req.body.c_password.length){
        errors.push("Passwords do not match")
    }
    if (req.body.country.length == "") {
         errors.push("Country is required")
    }
    if (req.body.interests == null) {
         errors.push("Should select at least 1 interest")
    }
    if (req.body.language == null) {
         errors.push("Should select at least 1 language")
    }
    if (errors.length) {
          for (var key in errors) { 
            req.flash('messages', errors[key]);
        }
        res.redirect('/');
    }
    else{

        connection.query("INSERT INTO users (name, email, password, country) VALUES(?,?,?,?)",
               [req.body.name, req.body.email, req.body.password, req.body.country], (err, user) =>{
               
               var interests = [] 
               for (var post_interest in req.body.interests){
                        interests.push(req.body.interests[post_interest])
               }
               interests = interests.toString();
               connection.query("INSERT INTO interests (user_id, interest) VALUES(?,?)",
                               [user.insertId, interests], (err, Interest) =>{
               });

               var languages = [] 
               for (var post_language in req.body.language){
                        languages.push(req.body.language[post_language])
               }
               languages = languages.toString();
               connection.query("INSERT INTO languages (user_id, language) VALUES(?,?)",
                               [user.insertId, languages], (err, Language) =>{
               });
              
                req.flash('messages', "User " + req.body.name + " with email " + req.body.email + " successfully registered!")

                res.redirect('/'); 
         });
    }          
});

app.post('/login', function (req, res) {
    res.send("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
    // Your code goes here...
});

app.get('/dashboard', function(req, res) {
     res.send("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
    // Your code goes here...
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.get("/reset", function(req, res){
    connection.query("DELETE FROM users WHERE email IN ('brian@gmail.com', 'mally@gmail.com');", function(){
        res.redirect("/")
    });
})


app.listen(8000, function(){
    console.log('Your node js server is running on PORT 8000');
});