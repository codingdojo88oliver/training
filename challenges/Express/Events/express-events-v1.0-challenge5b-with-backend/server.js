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
    database: "events" 
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
    if  (req.body.password.length < 8){
        errors.push("Password should be at least 8 characters")
    }
    if  (req.body.password.length != req.body.c_password.length){
        errors.push("Passwords do not match")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('validation', errors[key]);
        }
        res.redirect('/');
    }
    else{
        
        connection.query("INSERT INTO users (name, email, password) VALUES(?,?,?)",
                     [req.body.name, req.body.email, req.body.password] );

        req.flash('success',"User " + req.body.name + " with email " + req.body.email + " successfully registered!");
        res.redirect('/');
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
                    req.session.email = user[0].email;
                    res.redirect('/dashboard');
                }
                else{
                    req.flash('validation', "Invalid email and password combination");
                    res.redirect('/');
                }
            });
        }
        else{
            req.flash('validation', "Email does not exist in the database");
            res.redirect('/');
        }
    });
});

app.get('/dashboard', function(req, res) {
    if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                if (err) {
                    req.flash("Invalid session")
                    res.redirect("/")
                 }
                
                 connection.query("SELECT *, events.date AS event_date, events.id AS event_id,  joins.id AS join_id, users.name AS user_name FROM joins \
                    LEFT JOIN events ON events.id = joins.event_id \
                    LEFT JOIN users ON joins.user_id = users.id WHERE users.id = ?",[req.session.user_id], (err, joined_events) =>{
                   
                    var upcoming_joined_event_ids = [];
                    var past_joined_event_ids = [];
                    var all_joined_event_ids = [];
                    var utc = moment().format("YYYY-MM-DD HH:mm:ss");

                    if (joined_events.length > 0) {
                        for (var joined_event in joined_events){
                            all_joined_event_ids.push(joined_events[joined_event].event_id);
                               
                               var event_date = moment(joined_events[joined_event].event_date).format("YYYY-MM-DD HH:mm:ss")

                                if (event_date > utc){
                                    
                                    upcoming_joined_event_ids.push(joined_events[joined_event].event_id);          
                                }
                                else{
                                    past_joined_event_ids.push(joined_events[joined_event].event_id);
                                }
                        }
                    }
                    
                    connection.query('SELECT *,events.date, events.name, users.name as user_name, events.id FROM events \
                            LEFT JOIN users ON  users.id = events.user_id  WHERE events.id IN (' + upcoming_joined_event_ids + ')', (err, upcoming_joined_events) =>{
                        
                        connection.query('SELECT *,events.date, events.name as event_name, users.name as user_name, events.id FROM events \
                            LEFT JOIN users ON  users.id = events.user_id  WHERE events.id IN (' + past_joined_event_ids + ')', (err, past_joined_events) =>{
                            
                            connection.query('SELECT *,events.date, events.name as event_name, users.name as user_name, events.id FROM events \
                                LEFT JOIN users ON  users.id = events.user_id  WHERE events.id NOT IN (' + all_joined_event_ids + ')', (err, events_not_yet_joined) =>{

                                var upcoming_events = [];    
                                var count = 0;
                                for (var event in events_not_yet_joined){
                                    count += 1;
                                    if (events_not_yet_joined[event].max_attendees > count){
                                        upcoming_events.push(events_not_yet_joined[event]);
                                    }
                                }
                                res.render('dashboard',{user: user, upcoming_joined_events: upcoming_joined_events, past_joined_events: past_joined_events, events_not_yet_joined: upcoming_events}); 
                            });
                        });
                    });

                });
            });
       } 
       else{
        req.flash("User is not logged in")
        res.redirect("/")
       }
    }
    else{
        req.flash("User is not logged in")
        res.redirect("/")
    }
});

app.get('/host-event', function(req, res) {
    connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
        if (user.length > 0) {
            res.render('host-event',{user: user});
        }
        else{
            res.send("Something went wrong.")
        }
        
    });
});

app.post('/create-event', function(req, res) {
    
    var errors = [];
    var today = moment().format("DD-MM-YYYY");
    var created_at = moment().format("YYYY-MM-DD HH:mm:ss");

    if  (req.body.name.length < 5){
        errors.push("Name should be at least 5 characters")
    }
    if  (req.body.date < today){
        errors.push("Date should be future-dated")
    }
    if  (req.body.location.length < 5){
        errors.push("Location should be at least 5 characters")
    }
    if  (req.body.description.length < 10){
        errors.push("Description should be at least 10 characters")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('validation', errors[key]);
        }
        res.redirect('/host-event');
    }
    else{
        connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
            if (err) {
                req.flash('validation', "User is not logged in");
                res.redirect("/");
            }
            
            connection.query("INSERT INTO events (user_id, name, date, location, description, max_attendees, created_at) VALUES(?,?,?,?,?,?,?)",
                     [user[0].id, req.body.name, req.body.date, req.body.location, req.body.description, req.body.max_attendees, created_at] );
            req.flash('success',"You just created a new event!")
            res.redirect('/dashboard');
        });
    }

    
});

app.post('/join-event', function(req, res) {
    connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
        if (user.length > 0) {
           
        }
        else{
            req.flash('validation', "User is not logged in");
            res.redirect("/");
        }
        connection.query("SELECT * FROM events WHERE id = ?", [req.body.event_id], (err, events) =>{
          
          var created_at = moment().format("YYYY-MM-DD HH:mm:ss");
          connection.query("INSERT INTO joins (user_id, event_id, created_at) VALUES(?,?,?)",
                     [user[0].id, events[0].id, created_at] );
            req.flash('success',"You just joined an event!")
            res.redirect('/dashboard');
        });
       
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