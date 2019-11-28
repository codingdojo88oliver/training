from flask import Flask, render_template,request, redirect, session, flash

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
			if  len(request.form['username']) < 5:
				flash("Username should be at least 5 characters")
			if len(request.form['password']) < 8:
				flash("Password should be at least 8 characters")
			if request.form['password'] != request.form['c_password']:
				flash("Passwords do not match")
		except Exception as e:
				flash("Unknown error")
		if '_flashes' in session.keys():
			return redirect('/')
		else:
			mysql = connectToMySQL()
			query = "INSERT INTO users (name, username, password,created_at) VALUES (%(name)s, %(username)s, %(password)s,NOW());"
			data = {
				"name": request.form['name'],
				"username": request.form['username'],
				"password": request.form['password'],
			}
			user = mysql.query_db(query, data)

			flash( "User " + request.form['name'] + " with username " + request.form['username'] + " successfully registered!")

			return redirect("/dashboard")

@app.route('/login', methods=['post'])
def login():
	mysql = connectToMySQL()
	query = "SELECT * FROM users WHERE username = %(username)s LIMIT 1;"
	data = {
			"username": request.form['username']
	}
	username = mysql.query_db(query, data)

	if username:
		try:
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE username = %(username)s and  password = %(password)s;"
			data = {
					"username": request.form['username'],
					"password": request.form['password'],
			}
			user = mysql.query_db(query, data)
			session['is_logged_in'] = True
			session['name'] = user[0]['name']
			session['user_id'] = user[0]['id']
			return redirect("/dashboard")
		except Exception as e:
			flash("Invalid username and password combination")
			return redirect("/")
	else:
		flash(request, "Username does not exist in the database")
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
			return render_template("dashboard.html", user = user)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

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
