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
			query = "INSERT INTO users (name, email, password,created_at) VALUES (%(name)s, %(email)s, %(password)s,NOW());"
			data = {
				"name": request.form['name'],
				"email": request.form['email'],
				"password": request.form['password'],
			}
			mysql.query_db(query, data)
			flash("User " + request.form['name'] + " with email " + request.form['email'] + " successfully registered!")
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
			return render_template("dashboard.html", name = session['name'], email = session['email'])
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

@app.route("/login", methods = ["POST"])
def login():
	mysql = connectToMySQL()
	query = "SELECT * FROM users WHERE email = %(email)s LIMIT 1;"
	data = {
		"email": request.form['email'],
	}
	user = mysql.query_db(query, data)
	if user:
		try:
			flash("Invalid email and password combination")
			return redirect("/")
		except Exception as e:
			flash("Invalid email and password combination")
			return redirect("/")
	else:
		flash( "Email does not exist in the database")
		return redirect("/")
@app.route('/logout', methods=['GET'])
def logout():
	request.session.flush()
	return redirect("/")

if __name__ == "__main__":
	app.run(debug=True)
