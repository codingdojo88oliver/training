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
                        // get categories
                        var categories = [
                                            "Arts & Crafts",
                                            "Computer Accessories",
                                            "Video Games & Consoles"
                                        ];
                       // get user's created products
                        var product_ids = [];
                        connection.query("SELECT * FROM products WHERE products.user_id = ?", [user[0].id], (err, products) =>{
                                  if (products.length > 0) {
                                      for (var product in products) {
                                          product_ids.push(products[product].id);
                                      }
                                      connection.query("SELECT *, products.id, users.first_name as user_first_name, users.last_name as user_last_name  FROM products \
                                                    LEFT JOIN users ON users.id = products.user_id WHERE products.user_id != ?", [user[0].id], (err, other_products) =>{
                                            connection.query("SELECT *, products.name as product_name, products.user_id, users.first_name as product_user_first_name, users.last_name as product_user_last_name FROM transactions \
                                                    LEFT JOIN users ON users.id = transactions.buyer_id \
                                                    LEFT JOIN products ON products.id = transactions.product_id WHERE buyer_id = ?", [user[0].id], (err, items_bought) =>{

                                                    // get items under negotiation (both you negotiated with and products you posted)
                                                    connection.query("SELECT *, products.name as product_name, products.price as product_price, users.first_name as user_first_name, users.last_name as user_last_name, negotiations.id, negotiations.price FROM negotiations \
                                                                LEFT JOIN products ON products.id = negotiations.product_id \
                                                                LEFT JOIN users ON users.id = products.user_id WHERE negotiator_id = ? || product_id = ?", [user[0].id, product_ids], (err, negotiations) =>{
                                                        
                                                        res.render("dashboard", {"user": user, other_products: other_products, products: products, categories: categories, items_bought: items_bought, negotiations: negotiations})
                                                    });
                                            });
                                        });
                                  }
                                  else{
                                      var other_products = [];
                                      var products = [];
                                      var items_bought = [];
                                      var negotiations = [];
                                      res.render("dashboard", {"user": user, other_products: other_products, products: products, categories: categories, items_bought: items_bought, negotiations: negotiations})
                                  }

                                        
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

app.post('/negotiate', function(req, res) {
     connection.query("SELECT *FROM users WHERE id = ?", [req.session.user_id], (err, user) =>{
         connection.query("SELECT *FROM products WHERE id = ?", [req.body.product_id], (err, product) =>{
             if (err) {
                 req.send('messages', "You are not allowed to view this product");
             }
             else{
                     var seventy_percent =  parseFloat(product[0].price) * 0.7;
                     if (parseFloat(req.body.price) > parseFloat(product[0].price)) {
                        req.flash('messages', "Asking price should not be higher than the original price posted.");
                        res.redirect('/dashboard');    
                    }
                     else{
                             connection.query("INSERT INTO negotiations (product_id, negotiator_id, price) VALUES(?,?,?)",
                                     [product[0].id, product[0].user_id, req,body.price], (err, negotiations) =>{

                                     var product_status = "Under Negotiation";
                                     connection.query("UPDATE products SET status = ? WHERE id = ?", [product_status, product[0].id], (err, products) =>{
                                                req.flash('messages', "You just successfully negotiated for a product!");
                                                res.redirect('/dashboard');                                                
                                     });
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