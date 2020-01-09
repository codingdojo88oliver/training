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
    if (errors.length) {
          for (var key in errors) { 
            req.flash('messages', errors[key]);
        }
        res.redirect('/');
    }
    else{

        connection.query("INSERT INTO users (name, email, password, country) VALUES(?,?,?,?)",
               [req.body.name, req.body.email, req.body.password, req.body.country], (err, user) =>{
               
                req.flash('messages', "User " + req.body.name + " with email " + req.body.email + " successfully registered!")
                res.redirect('/'); 
         });
    }          
});

app.post('/login', function (req, res) {

            connection.query("SELECT * FROM users WHERE email = ? AND password = ? ", [req.body.email, req.body.password], (err, user)=>{
                if (user.length > 0) {
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
});

app.get('/dashboard', function(req, res) {
    if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
            connection.query("SELECT *FROM users WHERE users.id = ?", [req.session.user_id], (err, user) =>{
                 if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                 }
                 else{
                     connection.query("SELECT *, planes.id FROM planes \
                             LEFT JOIN users ON users.id = planes.user_id WHERE users.id = ?", [user[0].id], (err, planes) =>{
                         connection.query("SELECT * FROM messages \
                                 LEFT JOIN users ON users.id = messages.receiver_id WHERE messages.receiver_id = ?", [user[0].id], (err, secret_messages) =>{
                             res.render('dashboard',{user: user, planes: planes, secret_messages: secret_messages});
                             
                         });
                     });
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

app.post('/create-plane', function(req, res) {
    var errors = [];

    if  (req.body.message.length < 6){
        errors.push("Message should be at least 6 characters");

    }
    if  (req.body.message.length <= 0){
        errors.push("Message is requireds");
    }
    if (errors.length) {
          for (var key in errors) { 
            req.flash('messages', errors[key]);
        }
        res.redirect('/dashboard');
    }
    else{
        connection.query("SELECT *FROM users WHERE users.id = ?", [req.session.user_id], (err, user) =>{
                   if (err) {
                        req.flash('messages', "User is not logged in");
                        res.redirect("/");
                   }
                   else{
                       connection.query("INSERT INTO planes (user_id, message) VALUES(?,?)",
                               [user[0].id, req.body.message], (err, plane) =>{
                               
                                req.flash('messages', "You just created a virtual paper plane!");
                                res.redirect('/dashboard');
                         });
                   }
        });
    }
});

app.post('/throw-plane', function(req, res) {
       connection.query("SELECT *FROM users WHERE users.id = ?", [req.session.user_id], (err, user) =>{
                connection.query("SELECT *FROM planes WHERE id = ?", [req.body.plane_id], (err, plane) =>{
                           if (err) {
                                    req.flash('messages', "User is not logged in");
                                    res.redirect("/");
                           }
                           else{
                                connection.query("SELECT *FROM users WHERE country = ? AND id != ?", [user[0].country, user[0].id], (err, the_candidate) =>{
                               
                                    if (err) {
                                        req.flash('messages', "No matching users found")
                                        res.redirect("/dashboard")    
                                    }
                                    else{
                                        connection.query("INSERT INTO messages (receiver_id, plane_id) VALUES(?,?)",
                                               [the_candidate[0].id, plane[0].id], (err, created) =>{
                                               
                                               if (err) {
                                                   req.flash('messages', "No matching users found");
                                               }
                                               else{
                                                   var plane_status = "Landed";
                                                   connection.query("UPDATE planes SET status = ? WHERE id = ?", [plane_status, plane[0].id], (err, save) =>{
                                                        req.flash('messages', "Congratulations! Your plane flew and landed!");
                                                   });
                                               }
                                                res.redirect("/dashboard");    
                                        });
                                    }
                                });
                           }

                });
      });
});

app.get('/planes/:id', function(req, res) {
      res.send("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
    // Your code goes here...
});


app.post('/delete-plane', function(req, res) {
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