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
			if len(request.form['name']) < 3:
				errors["name"] = "Name should be at least 3 characters"
			if len(request.form['password']) < 6:
				errors["password"] = "Password should be at least 6 characters"
			if request.form['password'] != request.form['c_password']:
				errors["c_password"] = "Passwords do not match"
		except Exception as e:
				errors = "Unknown error"
		if len(errors) > 0:
			print(errors)
			for key, value in errors.items():
				flash(value)
			return redirect('/')
		else:
			mysql = connectToMySQL()
			query = "INSERT INTO users (name, email, country, password,created_at) VALUES (%(name)s, %(email)s, %(country)s, %(password)s, NOW());"
			data = {
				"name": request.form['name'],
				"email": request.form['email'],
				"password": request.form['password'],
				"country": request.form['country'],
			}
			user = mysql.query_db(query, data)
			flash("User " + request.form['name'] + " with email " + request.form['email'] + " successfully registered!")
			return redirect("/")


@app.route('/login', methods=['post'])
def login():
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
			query = "SELECT * FROM planes WHERE user = %(id)s;"
			planes = mysql.query_db(query, data)

			mysql = connectToMySQL()
			query = "SELECT * FROM messages WHERE receiver = %(id)s;"
			secret_messages = mysql.query_db(query, data)
			return render_template("dashboard.html", user = user, planes = planes, secret_messages =secret_messages)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

@app.route('/create-plane', methods=['POST'])
def createPlane():
	errors = {}
	if request.method == "POST":
		try:
			if len(request.form['message']) < 6:
				errors["message"] = "Message should be at least 6 characters"
			if len(request.form['message']) <= 0:
				errors["message"] = "Message is required"
		except Exception as e:
			errors["message"] = "Unknown error"

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
			query = "INSERT INTO planes (user, message, created_at) VALUES (%(user_id)s, %(message)s, NOW());"
			data = {
				"user_id": session['user_id'],
				"message": request.form['message'],
				
			}
			mysql.query_db(query, data)

			flash("You just created a virtual paper plane!")
			return redirect('/dashboard')

@app.route('/throw-plane', methods=['POST'])
def throwPlane():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM planes WHERE id = %(plane_id)s AND user = %(user_id)s;"
		data = {
			"plane_id": request.form['plane_id'],
			"user_id": session['user_id'],
		}
		plane = mysql.query_db(query, data)
	except Exception as e:
		flash("User is not logged in")
		return redirect("/")
	
	try:

		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s;"
		data = {
			"id": session['user_id']
		}
		the_candidate = mysql.query_db(query, data)


		mysql = connectToMySQL()
		query = "INSERT INTO messages (receiver, plane, created_at) VALUES (%(user_id)s, %(plane_id)s, NOW());"
		data = {
			"user_id": session['user_id'],
			"plane_id": request.form['plane_id'],	
		}
		created = mysql.query_db(query, data)

		if created:
			# update the plane
			mysql = connectToMySQL()
			query = "UPDATE planes SET status =  %(status)s WHERE id =  %(plane_id)s;"
			data = {
				"status": "Landed",
				"plane_id": request.form['plane_id'],	
			}
			mysql.query_db(query, data)
			flash("Congratulations! Your plane flew and landed!")

		else:
			flash("No matching users found")
		
	except Exception as e:
		flash("No matching users found")
		return redirect("/dashboard")		

	return redirect("/dashboard")


@app.route('/planes/<plane_id>', methods=['GET'])
def showPlane(plane_id):
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)
		mysql = connectToMySQL()
		query = "SELECT * FROM planes WHERE id = %(plane_id)s AND user = %(user_id)s LIMIT 1;"
		data = {
			"plane_id": plane_id,
			"user_id": session['user_id']
		}
		plane = mysql.query_db(query, data)
	except Exception as e:
		return Response("You are not allowed to view this message")
	print(plane)
	return render_template("show-my-plane.html", plane =plane )

@app.route('/delete-plane', methods=["POST"])
def deletePlane():
	if request.method == "POST":
		try:
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
			data = {
				"id": session['user_id']
			}

			user = mysql.query_db(query, data)

			mysql = connectToMySQL()
			query = "SELECT * FROM planes WHERE id = %(plane_id)s AND user = %(user_id)s LIMIT 1;"
			data = {
				"plane_id": request.form['plane_id'],
				"user_id": session['user_id']
			}
			
			plane = mysql.query_db(query, data)
		except Exception as e:
			flash("Something went wrong")
			return redirect("/dashboard")

		mysql = connectToMySQL()
		query = "DELETE FROM messages WHERE plane = %(plane_id)s;"
		data = {
				"plane_id": request.form['plane_id'],
		}
		mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "DELETE FROM planes WHERE id = %(plane_id)s;"
		data = {
				"plane_id": request.form['plane_id'],
		}
		mysql.query_db(query, data)
		flash("Plane successfully deleted")
		return redirect("/dashboard")

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
