const mysql = require('mysql');  

// GET YOUR DB CREDENTIALS VIA TERMINAL - echo ${DC_DB_HOST}
const connection   = mysql.createConnection({  
    host: process.env.DC_DB_HOST,  
    user: process.env.DC_DB_USERNAME,  
    password: process.env.DC_DB_PASSWORD,  
    database: process.env.DC_DB_NAME 
}); 

connection.connect(function(err) {  
    if (err) throw err; 
    console.log("Connected!"); 
});

module.exports = {connection: connection};