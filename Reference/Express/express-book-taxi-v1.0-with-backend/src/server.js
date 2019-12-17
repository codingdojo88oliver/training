const express = require('express');
const app = express();
const bodyParser= require('body-parser')
const cookieParser = require('cookie-parser');
const mysql = require('mysql');  
const session = require('express-session')
const moment = require('moment');

var config = {  
    host: process.env.DC_DB_HOST,  
    user: process.env.DC_DB_USERNAME,  
    password: process.env.DC_DB_PASSWORD,  
    database: process.env.DC_DB_NAME 
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

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: {}
}))

app.use(cookieParser('dcexpressninjagold88'))
app.use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//Do not edit the '/' route below
app.get('/', function(req, res) {
    if(req.session.user_name == undefined)
        res.render('index', {session : req.session});
    else
        res.redirect("/projects")
});

app.post('/register', function(req, res) {
    var post_data = req.body;
    var errors = [];
    
    if(post_data.name.length == 0) {
        errors.push('Name should not be blank');
    }

    if(post_data.username.length == 0) {
        errors.push('Username should not be blank');
    }

    if(post_data.password.length == 0) {
        errors.push('Password should not be blank');
    }

    req.session.reg_errors = errors;

    if(!errors.length) {
        connection.query("SELECT username FROM users WHERE username = ?", [post_data.username], function(err, user_result){
            if(user_result.length > 0){
                req.session.reg_errors = ["Username is already in use!"]
                res.redirect("/")
            }
            else{
                connection.query("INSERT INTO users(name, username, password, designation_type) VALUES(?,?,?,?)", 
                [post_data.name, post_data.username, post_data.password, post_data.designation], 
                function(err, insert_user_result){
                    req.session.reg_success = "User Successfully registered!" 
                    res.redirect("/")
                })
            }
        })
    } else {
        res.redirect("/");
    }

});

app.post('/login', function(req, res) {
    var post_data = req.body;
    connection.query("SELECT * FROM users WHERE username = ? AND password = ? ", [post_data.username, post_data.password], function(err, user_result){
        if(user_result.length > 0){
            req.session.user_id = user_result[0].id;
            req.session.name = user_result[0].name;
            req.session.designation_type = user_result[0].designation_type;
            req.session.state = post_data.state;

            connection.query("UPDATE users set state = ? WHERE id = ?", [post_data.state, user_result[0].id], function(err, update_user_result){
                if(user_result[0].designation_type == "driver") {
                    res.redirect("/driver_dashboard");
                } else {
                    res.redirect("/commuter_dashboard");
                }
                
            })
        }
        else{
            req.session.error_message_login = "Invalid Username or Password!"
            res.redirect("/")
        }        
    })
});

app.get('/driver_dashboard', function(req, res) {
    if(req.session.designation_type != undefined){
        if(req.session.designation_type == 'driver'){
            connection.query("SELECT books.*, commuters.name as commuter_name, drivers.name as driver_name FROM books \
            LEFT JOIN users as commuters ON commuters.id = books.commuter_user_id \
            LEFT JOIN users as drivers ON drivers.id = books.driver_user_id \
            WHERE books.driver_user_id = ? AND books.state = ?", [req.session.user_id, req.session.state], function(err, books_result){
                res.render("driver_dashboard", {user_session : req.session, books : books_result});
            })
        }
        else{
            res.redirect("/")
        }
    }
    else{
        res.redirect("/")
    }
});

app.get('/commuter_dashboard', function(req, res) {
    if(req.session.designation_type != undefined){
        if(req.session.designation_type == 'commuter'){
            connection.query(
                "SELECT users.*, sum(star_rate) / count(driver_ratings.id) as total_rating FROM users \
                LEFT JOIN driver_ratings ON driver_ratings.driver_user_id = users.id \
                WHERE state = ? AND designation_type = 'driver' \
                GROUP BY users.id ", 
                [req.session.state], 
                function(err, driver_result){
                connection.query(
                    "SELECT books.*, commuters.name as commuter_name, books.driver_user_id as driver_id, books.commuter_user_id as commuter_id, drivers.name as driver_name FROM books \
                    LEFT JOIN users as commuters ON commuters.id = books.commuter_user_id \
                    LEFT JOIN users as drivers ON drivers.id = books.driver_user_id \
                    WHERE books.commuter_user_id = ? AND books.is_drop_off != 2 AND books.state = ? ", 
                    [req.session.user_id, req.session.state], 
                    function(err, my_booking_result){
                    res.render("commuter_dashboard", {user_session : req.session, drivers : driver_result, my_booking : my_booking_result});
                 })
            })
        }   
        else{
            res.redirect("/")
        } 
    }
    else{
        res.redirect("/")
    }

})

app.post("/book", function(req, res){
    var post_data = req.body;
    
    connection.query("DELETE FROM books WHERE commuter_user_id = ?",
    [req.session.user_id], 
    function(err, delete_result){
        connection.query("INSERT INTO books(commuter_user_id, driver_user_id, state, pick_up, drop_off, status, created_at, is_drop_off) VALUES (?,?,?,?,?,1,NOW(), 1)",
        [req.session.user_id, post_data.driver_id, post_data.state, post_data.pick_up, post_data.drop_off], 
        function(err, book_result){
            res.redirect("/commuter_dashboard")
        })
    })
})

app.post("/update_location", function(req, res){
    var post_data = req.body;

    connection.query("UPDATE users set state = ? WHERE id = ?", [post_data.state, req.session.id], function(err, update_user_result){
        req.session.state = post_data.state;
        res.redirect("/commuter_dashboard")
    })
})


app.post("/update_book_status", function(req,res){
    var post_data = req.body;
    connection.query("UPDATE books set status = ?, updated_at = NOW() WHERE id = ?", [post_data.book_status, post_data.book_id], function(err, update_user_result){
        res.redirect("/driver_dashboard");
    })
});





app.post("/drop_off", function(req, res){
    var post_data = req.body;

    connection.query("UPDATE books set is_drop_off = ?, updated_at = NOW() WHERE id = ?", [post_data.is_drop_off    , post_data.book_id], function(err, update_user_result){
        res.redirect("/driver_dashboard")
    })
})

app.get("/logout", function(req, result){
    req.session.destroy(function(){

        result.redirect("/");
    })
})

app.post("/driver_rating", function(req, res){
    var post_data = req.body;
    connection.query("INSERT INTO driver_ratings(commuter_user_id, driver_user_id, star_rate, comment) VALUES (?, ?, ?, ?)",
    [req.session.user_id, post_data.driver_id, post_data.rating_star, post_data.comment], 
    function(err, book_result){
        res.redirect("/commuter_dashboard")
    })
})

app.get("/drivers/:driver_id", function(req, res){
    connection.query("SELECT * FROM users WHERE id = ? ", req.params.driver_id , function(err, solo_driver_result){
        connection.query("SELECT *, commuters.name as commuter_name, drivers.name as driver_name FROM driver_ratings \
        LEFT JOIN users as commuters ON commuters.id = driver_ratings.commuter_user_id \
        LEFT JOIN users as drivers ON drivers.id = driver_ratings.driver_user_id \
        WHERE driver_ratings.driver_user_id = ? ", req.params.driver_id ,function(err, driver_result){
            res.render("drivers", {drivers : driver_result, solo_driver : solo_driver_result[0]})
        })
    })
})

//Do not edit the routes below this line. These are used for testing purposes
app.get("/check_session", function (req, res){
    res.send(req.session)
})

app.get("/reset", function(req, result){
    connection.query("DELETE FROM users WHERE username IN ('pamela', 'oliver', 'mike');", function(){
        result.redirect("/")
    });
})

app.listen(8000, function(){
    console.log('Your node js server is running on PORT 8000');
});