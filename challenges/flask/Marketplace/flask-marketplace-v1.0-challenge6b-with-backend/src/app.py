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
			
			# get user all categories
			categories = {
				"Arts & Crafts": "Arts & Crafts",
				"Computer Accessories": "Computer Accessories",
				"Video Games & Consoles": "Video Games & Consoles" 
			}

			# get user's created products
			product_ids = []
			mysql = connectToMySQL()
			query = "SELECT * FROM products left join users on users.id = products.user_id  WHERE user_id = %(id)s;"
			data = {
				"id": session['user_id'],
			}
			products = mysql.query_db(query, data)

			if len(products) > 0:
				for product in products:
					product_ids.append(product['id'])
			
			#other products
			mysql = connectToMySQL()
			query = "SELECT * FROM products left join users on users.id = products.user_id  WHERE user_id != %(id)s;"
			data = {
				"id": session['user_id'],
			}
			other_products = mysql.query_db(query, data)

			#get user's items bought
			mysql = connectToMySQL()
			query = "SELECT  users.first_name, users.last_name, transactions.id, products.id, products.category, products.name, products.price FROM transactions left join products on products.id = transactions.product_id left join users on users.id = products.user_id WHERE buyer_id = %(id)s;"
			data = {
				"id": session['user_id']
			}
			items_bought = mysql.query_db(query, data)
			# print(product_ids)
			#get items under negotiation (both you negotiated with and products you posted)
			mysql = connectToMySQL()
			query = "SELECT products.category, products.status, products.name, products.price as product_price, users.first_name, users.last_name, negotiations.price, negotiations.negotiator_id,  negotiations.id FROM negotiations left join products on products.id = negotiations.product_id left join users on users.id = negotiations.negotiator_id WHERE negotiator_id = %(id)s || products.id IN %(product_ids)s;"
			data = {
				"id": session['user_id'],
				"product_ids": product_ids,
			}
			negotiations = mysql.query_db(query, data)
			
			return render_template("dashboard.html", user = user, products = products, categories = categories, items_bought = items_bought, other_products = other_products, negotiations = negotiations)
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


@app.route('/negotiate', methods=['POST'])
def negotiate():
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
		return Response("You are not allowed to negotiate with this product")

	seventy_percent = float(product[0]['price']) * 0.7


	if float(request.form['price']) > float(product[0]['price']):
		flash("Asking price should not be higher than the original price posted.")
		return redirect('/dashboard')


	mysql = connectToMySQL()
	query = "INSERT INTO negotiations (negotiator_id, product_id, price, created_at) VALUES (%(negotiator_id)s, %(product_id)s, %(price)s,  NOW());"
	data = {
		"negotiator_id": session['user_id'],
		"product_id": request.form['product_id'],
		"price":request.form['price'],
	}
	mysql.query_db(query, data)

	mysql = connectToMySQL()
	query = "UPDATE products SET status =  %(status)s WHERE id =  %(product_id)s;"
	data = {
			"status": "Under Negotiation",
			"product_id": request.form['product_id'],
	}
	mysql.query_db(query, data)
	flash("You just successfully negotiated for a product!")
	return redirect("/dashboard")

@app.route('/approve', methods=['POST'])
def approve():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}

		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM negotiations WHERE id = %(negotiation_id)s;"
		data = {
			"negotiation_id": request.form['negotiation_id'],
		}
		negotiation = mysql.query_db(query, data)
	except Exception as e:
		return Response("You are not allowed to approve this negotiation")
	
	# create a transaction
	mysql = connectToMySQL()
	query = "INSERT INTO transactions (product_id, buyer_id, price, created_at) VALUES (%(product)s, %(buyer)s, %(price)s, NOW());"
	data = {
		"buyer": negotiation[0]['negotiator_id'],
		 "product": negotiation[0]['product_id'],
		 "price":negotiation[0]['price'],
	}
	mysql.query_db(query, data)
	
	# update product
	mysql = connectToMySQL()
	query = "UPDATE products SET status =  %(status)s WHERE id =  %(product_id)s;"
	data = {
			"status": "Sold",
			"product_id": negotiation[0]['product_id'],	
	}
	mysql.query_db(query, data)
	flash("You just successfully bought the product!")
	return redirect('/dashboard')

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
