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
    database: "debate" 
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
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/');
    }
    else{
        
        connection.query("INSERT INTO users (name, email, password) VALUES(?,?,?)",
                     [req.body.name, req.body.email, req.body.password], (err, user) =>{

                        req.flash('messages',"User " + req.body.name + " with email " + req.body.email + " successfully registered!");
                        res.redirect('/');
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
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                }
                else{
                     connection.query("SELECT *, topics.id FROM topics \
                        LEFT JOIN arguments ON  arguments.user_id = topics.user_id \
                        LEFT JOIN users ON  users.id = topics.user_id WHERE topics.user_id = ?", [user[0].id], (err, my_topics) =>{
               
                         connection.query("SELECT *,users.name as user_name, topics.id FROM topics \
                                LEFT JOIN arguments ON  arguments.user_id = ? \
                                LEFT JOIN users ON  users.id = topics.user_id  WHERE topics.user_id != ?",[user[0].id, user[0].id], (err, fresh_topics) =>{
                            res.render('dashboard',{user: user, my_topics: my_topics, fresh_topics:fresh_topics});
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

app.post('/create-topic', function(req, res) {
   var errors = [];

    if  (req.body.title.length == ""){
        errors.push("Title is required")
    }
    else{
        if (req.body.title.length < 6) {
            errors.push("Title should be at least 6 characters")
        }
    }
    if  (req.body.description.length == ""){
        errors.push("Description is required")
    }
    else{
        if (req.body.description.length < 6 ) {
             errors.push("Description should be at least 6 characters")
        }
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/dashboard');
    }
    else{
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                if (err) {
                    req.flash('messages',"User is not logged in")
                    res.redirect("/")
                }
                else{
                    connection.query("INSERT INTO topics (user_id, title, description) VALUES(?,?,?)",
                        [user[0].id, req.body.title, req.body.description], (err, topic) =>{

                         req.flash('messages',"You just created a topic!");
                         res.redirect('/dashboard');
                    });
                }
            });
    }
});

app.post('/create-argument', function(req, res) {
     var errors = [];

    if  (req.body.argument.length == ""){
        errors.push("Argument is required")
    }
    else{
        if (req.body.argument.length < 10) {
            errors.push("Argument should be at least 10 characters")
        }
    }
    if  (req.body.stance.length == ""){
        errors.push("Stance is required")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/topics/' + req.body.topic_id);
    }
    else{
         connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
               if (err) {
                      req.flash('messages',"User is not logged in");
                      res.redirect('/');
                }
                else{
                        connection.query("SELECT * FROM users \
                                LEFT JOIN topics ON topics.user_id = users.id WHERE topics.id = ? AND users.id = ?", [req.body.topic_id, user[0].id], (err, topic) =>{
                                    if (topic.length >= 1 ) {
                                        req.flash('messages',"You can only post 1 argument per topic");
                                        res.redirect("/topics/" + req.body.topic_id);
                                    }
                                    else{
                                        connection.query("SELECT * FROM topics WHERE id = ?", [req.body.topic_id], (err, topics) =>{
                                                connection.query("SELECT *,topics.id FROM arguments \
                                                    left join users on users.id = arguments.user_id \
                                                    left join topics on topics.id = arguments.topic_id WHERE topics.id = ?", req.body.topic_id, (err, argument) =>{
                                                    if (argument.length >=1) {
                                                        if (argument[0].stance == req.body.stance) {
                                                              req.flash('messages',"You should stick to your original Stance");
                                                              res.redirect("/topics/" + req.body.topic_id);
                                                        }
                                                        else{
                                                            connection.query("INSERT INTO arguments (user_id, topic_id, stance, argument) VALUES(?,?,?,?)",
                                                                        [req.session.user_id, req.body.topic_id, req.body.stance, req.body.argument], (err, Arguments) =>{   
                                                                        req.flash('messages',"You said: " + req.body.stance + " on this topic");
                                                                        res.redirect("/topics/" + req.body.topic_id);
                                                            });
                                                        }
                                                    }
                                                    else{
                                                        connection.query("INSERT INTO arguments (user_id, topic_id, stance, argument) VALUES(?,?,?,?)",
                                                                        [req.session.user_id, req.body.topic_id, req.body.stance, req.body.argument], (err, Arguments) =>{   
                                                                        req.flash('messages',"You said: " + req.body.stance + " on this topic");
                                                                        res.redirect("/topics/" + req.body.topic_id);
                                                         });
                                                    }
                                                    
                                                });
                                        });
                                    }

                        });  
                }
         });
    }
});

app.get('/topics/:id', function(req, res) {
    connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{});
        connection.query("SELECT *, users.name as user_name, topics.id FROM topics \
                    LEFT JOIN users ON users.id = topics.user_id WHERE topics.id = ?", [req.params.id], (err, topic) =>{
                if (err) {
                    req.flash('messages',"Topic not found");
                    res.redirect('/dashboard');
                 }
                 else{
                     connection.query("SELECT *,users.name as user_name, arguments.user_id, arguments.id FROM arguments\
                        LEFT JOIN topics ON topics.id = arguments.topic_id \
                        LEFT JOIN users ON users.id = topics.user_id ORDER BY point DESC", (err, arguments) =>{
                          
                        var agree_points_total = 0;
                        var neutral_points_total = 0;
                        var disagree_points_total = 0;

                        for (var argument in arguments) {
                            if (arguments[argument].stance == "agree") {
                                agree_points_total += arguments[argument].point;
                            }
                        }
                        for (var argument in arguments) {
                            if (arguments[argument].stance == "neutral") {
                                neutral_points_total += arguments[argument].point;
                            }
                        }

                        for (var argument in arguments) {
                            if (arguments[argument].stance == "disagree") {
                                disagree_points_total += arguments[argument].point;
                            }
                        }
                        res.render('topic', { topic:topic, arguments: arguments, agree_points_total: agree_points_total, disagree_points_total: disagree_points_total, neutral_points_total: neutral_points_total})

                     });
                 }
        }); 
});

app.post('/upvote', function(req, res) {
    connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
        connection.query("SELECT * FROM arguments WHERE id = ?", [req.body.argument_id], (err, argument) =>{
              if (err) {
                       req.flash('messages', "User is not logged in");
                       res.redirect("/");
              }
              else{
                  if (argument[0].user_id == req.session.user_id) {
                      req.flash('messages', "You are not allowed to upvote your own argument.")
                      res.redirect("/topics/" + req.body.topic_id);
                  }
                  else{
                        argument_point = argument[0].point + 1
                           connection.query("UPDATE arguments SET point = ? WHERE id = ?", [argument_point, req.body.argument_id], (err, arguments) =>{
                               res.redirect("/topics/" + req.body.topic_id);
                           });
                  }
              }
        }); 
    });
});

app.post('/downvote', function(req, res) {
    connection.query("SELECT * FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
        connection.query("SELECT * FROM arguments WHERE id = ?", [req.body.argument_id], (err, argument) =>{
              if (err) {
                       req.flash('messages', "User is not logged in");
                       res.redirect("/");
              }
              else{
                  if (argument[0].user_id == req.session.user_id) {
                      req.flash('messages', "You are not allowed to downvote your own argument.")
                      res.redirect("/topics/" + req.body.topic_id);
                  }
                  else{
                        argument_point = argument[0].point - 1
                           connection.query("UPDATE arguments SET point = ? WHERE id = ?", [argument_point, req.body.argument_id], (err, arguments) =>{
                               res.redirect("/topics/" + req.body.topic_id);
                           });
                  }
              }
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