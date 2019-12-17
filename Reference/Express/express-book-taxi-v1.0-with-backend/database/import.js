const mysql_import = require('mysql-import');

mysql_import.config({  
	host: process.env.DC_DB_HOST,  
    user: process.env.DC_DB_USERNAME,  
    password: process.env.DC_DB_PASSWORD,  
    database: process.env.DC_DB_NAME 
}).import("dctaxi.sql").then(()=> {
	console.log('All statements have been executed')
});