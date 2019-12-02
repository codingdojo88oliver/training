from flask import Flask, render_template,request, redirect, session, flash
from datetime import datetime, date
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
			if  len(request.form['name']) < 5:
				flash("Name should be at least 5 characters")
			if len(request.form['password']) < 6:
				flash("Password should be at least 6 characters")
			if request.form['password'] != request.form['c_password']:
				flash("Passwords do not match")
		except Exception as e:
				flash("Unknown error")
		if '_flashes' in session.keys():
			return redirect('/')
		else:
			mysql = connectToMySQL()
			query = "INSERT INTO users (name, email, password,created_at) VALUES (%(name)s, %(email)s, %(password)s,NOW());"
			data = {
				"name": request.form['name'],
				"email": request.form['email'],
				"password": request.form['password'],
			}
			user = mysql.query_db(query, data)

			flash( "User " + request.form['name'] + " with email " + request.form['email'] + " successfully registered!")
			return redirect("/dashboard")

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
			session['name'] = user[0]['name']
			session['user_id'] = user[0]['id']
			return redirect("/dashboard")
		except Exception as e:
			flash("Invalid email and password combination")
			return redirect("/")
	else:
		flash(request, "Email does not exist in the database")
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
			
			mysql = connectToMySQL()
			query = "SELECT * FROM topics left join users on users.id = topics.users_id left join arguments on arguments.topics_id = topics.id WHERE arguments.users_id = %(id)s Order BY point desc;"
			data = {
				"id": session['user_id']
			}
			my_topics = mysql.query_db(query, data)

			mysql = connectToMySQL()
			query = "SELECT * FROM topics left join users on users.id = topics.users_id  left join arguments on arguments.topics_id = topics.id WHERE arguments.users_id != %(ids)s Order BY point desc;"
			data = {
				"ids": session['user_id']
			}
			fresh_topics = mysql.query_db(query, data)

			return render_template("dashboard.html", user = user, my_topics = my_topics, fresh_topics = fresh_topics)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

@app.route('/create-topic', methods=['POST'])
def createTopic():
	errors = {}
	if request.method == "POST":
		try:	
			if request.form['title'] == "":
				errors["title"] = "Title is required"
			else:
				if len(request.form['title']) < 6:
					errors["title"] = "Title should be at least 6 characters"
			if request.form['description'] == "":
					errors["description"] = "Description is required"
			else:
				if len(request.form['description']) < 6:
					errors["description"] = "Description should be at least 6 characters"	
		except Exception as e:
			errors = "Unknown error"
		if len(errors) > 0:
			for key, value in errors.items():
				flash(value)
			return redirect('/dashboard')
		else:
			print("user")
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
			query = "INSERT INTO topics (title, description, users_id,created_at) VALUES (%(title)s, %(description)s, %(users_id)s,NOW());"
			data = {
				"title": request.form['title'],
				"description": request.form['description'],
				"users_id": session['user_id'],
			}
			topic = mysql.query_db(query, data)
			return redirect('/dashboard')

@app.route('/create-argument', methods=['POST'])
def createArgument():
	errors = {}
	if request.method == "POST":
		try:	
			if request.form['argument'] == "":
				errors["argument"] = "Argument is required"
			else:
				if len(request.form['argument']) < 10:
					errors["argument"] = "Argument should be at least 10 characters"
			if request.form['stance'] == "":
					errors["stance"] = "Description is required"	
		except Exception as e:
			errors = "Unknown error"
		if len(errors) > 0:
			for key, value in errors.items():
				flash(value)
			return redirect('/dashboard')
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
			query = "SELECT * FROM users left join topics on topics.id = %(topic_id)s WHERE topics.users_id = %(user_id)s;"
			data = {
				"topic_id": request.form['topic_id'],
				"user_id": session['user_id']
			}
			topic = mysql.query_db(query, data)
			
			if len(topic) >= 1: 
				flash("You can only post 1 argument per topic")
				return redirect("/topics/" + request.form['topic_id'])
			
			mysql = connectToMySQL()
			query = "SELECT * FROM topics WHERE id = %(topic_id)s;"
			data = {
				"topic_id": request.form['topic_id']
			}
			topics = mysql.query_db(query, data)
			
			mysql = connectToMySQL()
			query = "SELECT * FROM arguments left join users on users.id = arguments.users_id left join topics on topics.id = arguments.topics_id WHERE arguments.topics_id = %(topic_id)s;"
			data = {
				"topic_id": request.form['topic_id']
			}
			argument = mysql.query_db(query, data)
			print(argument)
			if len(argument) >= 1:
				if argument[0]['stance'] != request.form['stance']:
					flash("You can only have 1 stance per topic.")
					return redirect("/topics/" + request.form['topic_id'])

			point = 0
			mysql = connectToMySQL()
			query = "INSERT INTO arguments (users_id, topics_id, stance, argument, point, created_at) VALUES (%(user_id)s, %(topic_id)s, %(stance)s, %(argument)s, %(point)s, NOW());"
			data = {
				"user_id": session['user_id'],
				"topic_id": request.form['topic_id'],
				"stance": request.form['stance'],
				"argument": request.form['argument'],
				"point": point
			}
			Argument = mysql.query_db(query, data)
			flash("You just created an argument!")
			return redirect('/topics/' + request.form['topic_id'])
			

@app.route('/topics/<id>', methods=['GET'])
def showTopic(id):
	mysql = connectToMySQL()
	query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
	data = {
		"id": session['user_id']
	}
	user = mysql.query_db(query, data)
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM topics left join users on users.id = topics.users_id WHERE topics.id = %(id)s;"
		data = {
			"id": {id}
		}
		topic = mysql.query_db(query, data)
	except Exception as e:
		flash("Topic not found")
		return redirect("/dashboard")
	
	mysql = connectToMySQL()
	query = "SELECT * FROM arguments left join topics on topics.id = arguments.topics_id  left join users on users.id = topics.users_id Order BY point;"
	arguments = mysql.query_db(query, data)
	agree_points_total = 0
	neutral_points_total = 0
	disagree_points_total = 0
	for argument in arguments:
		if argument['stance'] == "agree":
			agree_points_total += 1
	for argument in arguments:
		if argument['stance'] == "neutral":
			neutral_points_total += 1
	for argument in arguments:
		if argument['stance'] == "disagree":
			disagree_points_total += 1
	return render_template("topic.html", topic = topic, arguments = arguments, agree_points_total = agree_points_total, neutral_points_total = neutral_points_total, disagree_points_total = disagree_points_total)

@app.route('/upvote', methods=['POST'])
def upvote():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM arguments WHERE id = %(argument_id)s;"
		data = {
			"argument_id": request.form['argument_id']
		}
		argument = mysql.query_db(query, data)
	except Exception as e:
		flash("User is not logged in")
		return redirect("/")
	if argument[0]['users_id'] == session['user_id']:
		flash("You are not allowed to upvote your own argument.")
		return redirect('/topics/' + request.form['topic_id'])

	point = argument[0]['point'] + 1
	mysql = connectToMySQL()
	query = "UPDATE arguments SET point = %(point)s WHERE id = %(argument_id)s;"
	data = {
		"argument_id": request.form['argument_id'],
		"point": point,
	}
	argument = mysql.query_db(query, data)
	return redirect('/topics/' + request.form['topic_id'])

@app.route('/downvote', methods=['POST'])
def downvote():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM arguments WHERE id = %(argument_id)s;"
		data = {
			"argument_id": request.form['argument_id']
		}
		argument = mysql.query_db(query, data)
	except Exception as e:
		flash("User is not logged in")
		return redirect("/")

	if argument[0]['users_id'] == session['user_id']:
		flash("You are not allowed to upvote your own argument.")
		return redirect('/topics/' + request.form['topic_id'])

	point = argument[0]['point'] - 1
	mysql = connectToMySQL()
	query = "UPDATE arguments SET point = %(point)s WHERE id = %(argument_id)s;"
	data = {
		"argument_id": request.form['argument_id'],
		"point": point,
	}
	argument = mysql.query_db(query, data)
	return redirect('/topics/' + request.form['topic_id'])

@app.route('/logout', methods=['GET'])
def logout():
	session.clear()
	return redirect("/")

@app.route('/reset', methods=['GET'])
def reset():
	mysql = connectToMySQL()
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 0;")
	mysql.query_db("DELETE FROM users WHERE email in('mally5@yahoo.com', 'brian@gmail.com', 'james@gmail.com');")
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')

if __name__ == "__main__":
	app.run(port=8000, debug=True)
