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
			if request.form['country'] == "":
				errors["country"] = "Country is required"
			if 'interests' not in request.form:
				errors["interests"] = "Should select at least 1 interest"
			if 'language' not in request.form:
				errors["language"] = "Should select at least 1 language"
		except Exception as e:
				errors = "Unknown error"
		if len(errors) > 0:
			print(errors)
			for key, value in errors.items():
				flash(value)
			return redirect('/')
		else:
			# mysql = connectToMySQL()
			# query = "INSERT INTO users (name, email, country, password,created_at) VALUES (%(name)s, %(email)s, %(password)s, %(country)s, NOW());"
			# data = {
			# 	"name": request.form['name'],
			# 	"email": request.form['email'],
			# 	"password": request.form['password'],
			# 	"country": request.form['country'],
			# }
			# user = mysql.query_db(query, data)
			interest = {
					"list":request.form['interests']
			}
			interests = []
			for post_interest in interest[0]:
				print("me")

			print(interests)
			# session['is_logged_in'] = True
			# session['name'] = request.form['name']
			# session['user_id'] = user

			return redirect("/dashboard")


@app.route('/login', methods=['post'])
def login():
	return Response("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

@app.route("/dashboard", methods = ["GET"])
def dashboard():
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
