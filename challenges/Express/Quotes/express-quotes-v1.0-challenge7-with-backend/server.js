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
    database: "qoutes" 
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

    if  (req.body.name.length < 5){
        errors.push("Name should be at least 5 characters")
    }
    if  (req.body.username.length < 5){
        errors.push("Username should be at least 5 characters")
    }
    if  (req.body.password.length < 8){
        errors.push("Password should be at least 8 characters")
    }
    if  (req.body.password.length != req.body.c_password.length){
        errors.push("Passwords do not match")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/');
    }
    else{
        
        connection.query("INSERT INTO users (name, username, password) VALUES(?,?,?)",
                   [req.body.name, req.body.username, req.body.password], (err, user) =>{

                   req.flash('messages',"User " + req.body.name + " with username " + req.body.username + " successfully registered!");
                   res.redirect('/');
        });
    }          
});

app.post('/login', function (req, res) {
    connection.query("SELECT * FROM users WHERE username = ?", [req.body.username], (err, user) =>{
        if (user.length > 0) {
            connection.query("SELECT * FROM users WHERE username = ? AND password = ? ", [req.body.username, req.body.password], (err, users)=>{
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
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                }
                else{
                    connection.query("SELECT *, users.name as user_name, quotes.id, favorites.id as favorites_id FROM favorites\
                            LEFT JOIN users ON users.id = favorites.user_id \
                            LEFT JOIN quotes ON quotes.id = favorites.quote_id WHERE favorites.user_id = ?",user[0].id, (err, favorite_quotes) =>{
                            var except_quote_ids = [];
                            
                            if (favorite_quotes.length > 0) {
                                for (var favorite_quote in favorite_quotes){
                                    except_quote_ids.push(favorite_quotes[favorite_quote].quote_id)
                                }
                            } 
                            connection.query('SELECT *, users.name as user_name, quotes.id FROM quotes \
                                    LEFT JOIN users ON  users.id = quotes.user_id  WHERE quotes.id NOT IN (' + except_quote_ids + ')', (err, quotes) =>{
                                    
                                    res.render('dashboard',{user: user, quotes: quotes, favorite_quotes: favorite_quotes});
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

app.post('/create-quote', function(req, res) {
    var errors = [];

    if  (req.body.quoted_by.length < 5){
        errors.push("Quoted By should be at least 5 characters")
    }
    if  (req.body.quote.length < 10){
        errors.push("Quote should be at least 10 characters")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/dashboard');
    }
    else{
        connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
            if (err) {
                req.flash('messages', "User is not logged in")
                res.redirect("/");
            }
            else{
                connection.query("INSERT INTO quotes (user_id, quoted_by, quote) VALUES(?,?,?)",
                           [user[0].id, req.body.quoted_by, req.body.quote], (err, quote) =>{

                           req.flash('messages',"You just shared a new quote!");
                           res.redirect('/dashboard');
                });
            }
        });
    }          
});

app.post('/move-to-favorites', function(req, res) {
    connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
            if (err) {
                req.flash('messages', "User is not logged in")
                res.redirect("/");
            }
            else{
                connection.query("SELECT * FROM quotes WHERE id = ?", [req.body.quote_id], (err, quote) =>{
                    connection.query("INSERT INTO favorites (user_id, quote_id) VALUES(?,?)",
                           [user[0].id, quote[0].id], (err, favorite) =>{
                           req.flash('messages', "You just favorited a quote!")
                           res.redirect('/dashboard')
                    });
                });
            }
    });
});

app.post('/remove-from-favorites', function(req, res) {
        connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                if (err) {
                    req.flash('messages', "User is not logged in")
                    res.redirect("/");
                }
                else{
                    connection.query("DELETE FROM favorites WHERE id = ?", [req.body.favorite_id], (err, favorite) =>{
                        req.flash('messages', "You just removed a quote from favorites!")
                        res.redirect('/dashboard')    
                    });
                }
        });
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