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
			mysql = connectToMySQL()
			query = "INSERT INTO users (name, email, country, password,created_at) VALUES (%(name)s, %(email)s,  %(country)s, %(password)s, NOW());"
			data = {
				"name": request.form['name'],
				"email": request.form['email'],
				"country": request.form['country'],
				"password": request.form['password'],
				
			}
			user = mysql.query_db(query, data)
		
			interests = []
			for post_interest in request.form.getlist('interests'):
				interests.append(post_interest)

			values = ', '.join(map(str, interests))
			mysql = connectToMySQL()
			query = "INSERT INTO interests (user, interest, created_at) VALUES (%(user)s, %(interest)s, NOW());"
			data = {
				"user": user,
				"interest": values,
			}
			interest = mysql.query_db(query, data)

			languages = []
			for post_language in request.form.getlist('language'):
				languages.append(post_language)

			languages = ', '.join(map(str, languages))
			mysql = connectToMySQL()
			query = "INSERT INTO languages (user, language, created_at) VALUES (%(user)s, %(language)s, NOW());"
			data = {
				"user": user,
				"language": languages,
			}
			Language = mysql.query_db(query, data)

			session['is_logged_in'] = True
			session['name'] = request.form['name']
			session['user_id'] = user

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
			
			mysql = connectToMySQL()
			query = "SELECT * FROM users left join interests on interests.user = users.id left join languages on languages.user = users.id WHERE users.id = %(user_id)s LIMIT 1;"
			data = {
					"user_id": session['user_id']
			}
			users = mysql.query_db(query, data)
			return render_template("dashboard.html", users = users)
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
