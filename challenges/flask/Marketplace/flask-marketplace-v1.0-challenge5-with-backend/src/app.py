from flask import Flask, render_template,request, redirect, session, flash, Response

from mysqlconnection import connectToMySQL 

app = Flask(__name__)
app.secret_key = 'keep it secret, keep it safe'

@app.route("/")
def index():
	
	return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
	errors = {}
	if request.method == "POST":
		try:
			if len(request.form['first_name']) < 2:
				errors["first_name"] = "First name should be at least 2 characters"
			if len(request.form['last_name']) < 2:
				errors["last_name"] = "Last name should be at least 2 characters"
			if len(request.form['password']) < 6:
				errors["password"] = "Password should be at least 6 characters"
			if request.form['password'] != request.form['c_password']:
				errors["c_password"] = "Passwords do not match"
			if  request.form["email"] == "":
				errors["email"] = "Email Address is required"
		except Exception as e:
				errors = "Unknown error"
		if len(errors) > 0:
			for key, value in errors.items():
				flash(value)
			return redirect('/')
		
		else:
			mysql = connectToMySQL()
			query = "INSERT INTO users (first_name, last_name, email, password, created_at) VALUES (%(first_name)s, %(last_name)s, %(email)s, %(password)s, NOW());"
			data = {
				"first_name": request.form['first_name'],
				"last_name": request.form['last_name'],
				"email": request.form['email'],
				"password": request.form['password'],
			}
			user = mysql.query_db(query, data)
			flash("User " + request.form['first_name'] + " " + request.form['last_name'] + " with email " + request.form['email'] + " successfully registered!")
			return redirect("/")

@app.route('/login', methods=['post'])
def login():
	mysql = connectToMySQL()
	query = "SELECT * FROM users WHERE email = %(email)s LIMIT 1;"
	data = {
			"email": request.form['email']
	}
	email = mysql.query_db(query, data)

	if len(email) > 0:
		try:
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE email = %(email)s and  password = %(password)s;"
			data = {
					"email": request.form['email'],
					"password": request.form['password'],
			}
			user = mysql.query_db(query, data)
			session['is_logged_in'] = True
			session['user_id'] = user[0]['id']
			return redirect("/dashboard")
		except Exception as e:
			flash("Invalid email and password combination")
			return redirect("/")
	else:
		flash("Email does not exist in the database")
		return redirect("/")

@app.route("/dashboard", methods = ["GET"])
def dashboard():
	if 'is_logged_in' in session:
		if session['is_logged_in'] == True:
			try:
				mysql = connectToMySQL()
				query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
				data = {
					"id": session['user_id']
				}

				user = mysql.query_db(query, data)
			except Exception as e:
				flash("Invalid session")
				return redirect("/")
			
			#get user's items bought
			mysql = connectToMySQL()
			query = "SELECT transactions.id, products.id, products.category, products.name, products.price FROM transactions left join products on products.id = transactions.product_id left join users on users.id = products.user_id WHERE buyer_id = %(id)s;"
			data = {
				"id": session['user_id']
			}
			items_bought = mysql.query_db(query, data)

			# get user all categories
			categories = {
				"Arts & Crafts": "Arts & Crafts",
				"Computer Accessories": "Computer Accessories",
				"Video Games & Consoles": "Video Games & Consoles" 
			}
			mysql = connectToMySQL()
			query = "SELECT * FROM products left join users on users.id = products.user_id  WHERE status = %(status)s;"
			data = {
				"status": "Available",
			}
			products = mysql.query_db(query, data)
			
			return render_template("dashboard.html", user = user, products = products, categories = categories, items_bought = items_bought)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

@app.route('/add-product', methods=['GET'])
def addProduct():
	if 'is_logged_in' in session:
		if session['is_logged_in'] == True:
			try:
				mysql = connectToMySQL()
				query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
				data = {
					"id": session['user_id']
				}

				user = mysql.query_db(query, data)
			except Exception as e:
				flash("Invalid session")
				return redirect("/")
			
			return render_template("add-product.html", user = user)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

@app.route('/remove-product', methods=['POST'])
def removeProduct():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}

		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM products WHERE id = %(product_id)s and user_id = %(id)s;"
		data = {
			"product_id": request.form['product_id'],
			"id": session['user_id'],
		}
		product = mysql.query_db(query, data)
	except Exception as e:
		flash("You are not allowed to remove this product")
		return redirect("/dashboard")
	
	mysql = connectToMySQL()
	query = "DELETE FROM products WHERE id = %(product_id)s;"
	data = {
		"product_id":product[0]['id'],
	}
	products = mysql.query_db(query, data)
	flash("Product successfully removed")
	
	return redirect("/dashboard")

@app.route('/buy', methods=['POST'])
def buy():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}

		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM products WHERE id = %(product_id)s;"
		data = {
			"product_id": request.form['product_id'],
		}
		product = mysql.query_db(query, data)
	except Exception as e:
		return Response("You are not allowed to view this product")

	mysql = connectToMySQL()
	query = "INSERT INTO transactions (product_id, buyer_id, created_at) VALUES (%(product_id)s, %(buyer_id)s, NOW());"
	data = {
		 "product_id": request.form['product_id'],
		 "buyer_id": session['user_id'],
	}
	mysql.query_db(query, data)
	
	mysql = connectToMySQL()
	query = "UPDATE products SET status =  %(status)s WHERE id =  %(product_id)s;"
	data = {
			"status": "Sold",
			"product_id": request.form['product_id'],	
	}
	mysql.query_db(query, data)
	flash("You just successfully bought the product!")
	return redirect('/dashboard')

@app.route('/create-product', methods=['POST'])
def createProduct():
	errors = {}
	if request.method == "POST":
		try:
			if len(request.form['name']) < 5:
				errors["name"] = "Product Name should be at least 5 characters"
			if len(request.form['price']) < 1:
				errors["price"] = "Price should be at least $1"
			if len(request.form['description']) == 0:
				errors["description"] = "Description should not be empty"
			if len(request.form['description']) > 100:
				errors["description"] = "Description should not exceed 100 characters"
		except Exception as e:
				errors = "Unknown error"
		
		if len(errors) > 0:
			for key, value in errors.items():
				flash(value)
			return redirect('/add-product')
		else:
			try:
				mysql = connectToMySQL()
				query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
				data = {
					"id": session['user_id']
				}

				user = mysql.query_db(query, data)
			except Exception as e:
				flash("User is not logged in")
				return redirect("/")

			mysql = connectToMySQL()
			query = "INSERT INTO products (user_id, category, name, price, description, status, created_at) VALUES (%(user_id)s, %(category)s, %(name)s, %(price)s, %(description)s, %(statu)s, NOW());"
			data = {
				"user_id": session['user_id'],
				"category": request.form['category'],
				"name": request.form['name'],
				"price": request.form['price'],
				"description": request.form['description'],
				"statu": "Available",
				
			}
			product = mysql.query_db(query, data)
			flash("You just created an advertisement!")
			return redirect('/add-product')

@app.route('/logout', methods=['GET'])
def logout():
	session.clear()
	return redirect("/")

@app.route('/reset', methods=['GET'])
def reset():
	mysql = connectToMySQL()
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 0;")
	mysql.query_db("TRUNCATE users;")
	mysql.query_db("TRUNCATE products;")
	mysql.query_db("TRUNCATE transactions;")
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')

if __name__ == "__main__":
	app.run(port=8000, debug=True)
