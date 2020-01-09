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
    database: "marketplace" 
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

    if  (req.body.first_name.length < 2){
        errors.push("First name should be at least 2 characters")
    }
    if  (req.body.last_name.length < 2){
        errors.push("Last name should be at least 2 characters")
    }
    if  (req.body.password.length < 6){
        errors.push("Password should be at least 6 characters")
    }
    if  (req.body.password.length != req.body.c_password.length){
        errors.push("Passwords do not match")
    }
    if  (req.body.email == ""){
        errors.push("Email Address is required")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/');
    }
    else{
        
        connection.query("INSERT INTO users (first_name, last_name, email, password) VALUES(?,?,?,?)",
                     [req.body.first_name, req.body.last_name, req.body.email, req.body.password], (err, user) =>{

                       req.flash('messages', "User " + req.body.first_name + " " + req.body.last_name + " with email " + req.body.email + " successfully registered!")
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
})

app.get('/dashboard', function(req, res) {
    if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                 if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                 }
                 else{
                     var categories = [
                                    "Arts & Crafts",
                                    "Computer Accessories",
                                    "Video Games & Consoles"
                                ];
                     var Available = "Available";
                     connection.query("SELECT *, users.first_name as user_first_name, users.last_name as user_last_name, products.created_at, products.id FROM products \
                                LEFT JOIN users ON users.id = products.user_id WHERE status = ?", [Available], (err, products) =>{
                                    
                                res.render('dashboard',{user: user, products: products, categories: categories});
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

app.get('/add-product', function(req, res) {
    if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
            connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                 if (err) {
                    req.flash('messages',"Invalid session")
                    res.redirect("/")
                 }
                 else{
                    res.render('add-product',{user: user});
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

app.post('/remove-product', function(req, res) {
     connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
         connection.query("SELECT *FROM products WHERE id = ? AND user_id", [req.body.product_id, user[0].id], (err, products) =>{
             if (err) {
                 req.flash('messages', "You are not allowed to remove this product");
                 res.redirect("/dashboard");
             }
             else{
                    connection.query("DELETE FROM products WHERE id = ?", [products[0].id], (err, product) =>{
                            req.flash('messages', "Product successfully removed");
                            res.redirect("/dashboard");
                    });
             }
         });
     });                  
});

app.post('/create-product', function(req, res) {
    var errors = [];

    if  (req.body.name.length < 5){
        errors.push("Product should be at least 5 characters")
    }
    if  (req.body.price.length < 1){
        errors.push("Price should be at least $1")
    }
    if  (req.body.description.length == 0){
        errors.push("Description should not be empty")
    }
    if  (req.body.description.length > 100){
        errors.push("Description should not exceed 100 characters")
    }
    if (errors.length) {
          for (var key in errors) {
            req.flash('messages', errors[key]);
        }
        res.redirect('/add-product');
    }
    else{
        connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
                 if (err) {
                    req.flash('messages',"User is not logged in")
                    res.redirect("/")
                 }
                 else{
                      connection.query("INSERT INTO products (user_id, category, name, price, description) VALUES(?,?,?,?,?)",
                                 [user[0].id, req.body.category, req.body.name, req.body.price, req.body.description], (err, product) =>{

                                   req.flash('messages', "You just created an advertisement!");
                                   res.redirect('/add-product');
                                 });
                 }
        });         
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