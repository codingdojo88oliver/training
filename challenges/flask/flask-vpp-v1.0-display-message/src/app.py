from flask import Flask, render_template,request, redirect, session, flash, Response

from mysqlconnection import connectToMySQL 

app = Flask(__name__)
app.secret_key = 'keep it secret, keep it safe'

@app.route("/")
def index():
	
	return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
	mysql = connectToMySQL()
	query = "INSERT INTO users (name, email, password,created_at) VALUES (%(name)s, %(email)s, %(password)s, NOW());"
	data = {
		"name": "Brian",
		"email": "brian@datacompass.com",
		"password": "password",
	}
	user = mysql.query_db(query, data)
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

			return render_template("dashboard.html", user = user, planes = planes)
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

@app.route('/planes/<plane_id>', methods=['GET'])
def showPlane(plane_id):
	return Response("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...


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
