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
              
                req.session.is_logged_in = true;
                req.session.name = req.body.name;
                req.session.user_id = user.insertId;
                res.redirect('/dashboard'); 
         });
    }          
});

app.post('/login', function (req, res) {
    connection.query("SELECT * FROM users WHERE email = ?", [req.body.email], (err, user) =>{
        if (user.length > 0) {
            connection.query("SELECT * FROM users WHERE email = ? AND password = ? ", [req.body.email, req.body.password], (err, users)=>{
                if (users.length > 0) {
                   
                    req.session.is_logged_in = true;
                    req.session.name= user[0].name;
                    req.session.user_id = user[0].id;
                    res.redirect('/dashboard');
                }
                else{
                    req.flash('messages', "Invalid email and password combination");
                    res.redirect('/');
                }
            });
        }
        else{
            req.flash('messages', "Email does not exist in the database");
            res.redirect('/');
        }
    });
});

app.get('/dashboard', function(req, res) {
    if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
            connection.query("SELECT *FROM users \
                 LEFT JOIN interests ON interests.user_id = users.id \
                 LEFT JOIN languages ON languages.user_id = users.id \ WHERE users.id = ?", [req.session.user_id], (err, user) =>{
                 if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                 }
                 else{
                     res.render('dashboard',{user: user});
                 }
            });
       } 
       else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
       }
    }
    else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
    }
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