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
			flash( "User " + request.form['name'] + " with email " + request.form['email'] + " successfully registered!")
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
			# events_im_hosting = Event.objects.filter(user=user)
			mysql = connectToMySQL()
			query = "SELECT * FROM events;"
			events_im_hosting = mysql.query_db(query, data)
			events_im_hosting_ids = []
			if events_im_hosting:
				for event in events_im_hosting:
					events_im_hosting_ids.append(event['id'])

			mysql = connectToMySQL()
			events = "SELECT * FROM events left join users ON  users.id = events.user_id WHERE events.id NOT IN %(id_s)s; "
			data = {
				"id_s": events_im_hosting_ids
			}
			upcoming_events = mysql.query_db(events,data)

			return render_template("dashboard.html", name = session['name'], upcoming_events = upcoming_events, events_im_hosting = events_im_hosting)
		else:
			flash("User is not logged in")
			return redirect("/")
	else:
		flash("User is not logged in")
		return redirect("/")

	return redirect("/dashboard")
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
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE email = %(email)s AND password = %(password)s LIMIT 1;"
			data = {
				"email": request.form['email'],
				"password": request.form['password'],
			}
			user = mysql.query_db(query, data)
			session['is_logged_in'] = True
			session['name'] = user[0]['name']
			session['user_id'] = user[0]['id']
			session['email'] = user[0]['email']
			return redirect("/dashboard")
		except Exception as e:
			flash("Invalid email and password combination")
			return redirect("/")
	else:
		flash( "Email does not exist in the database")
		return redirect("/")

@app.route('/host-event', methods=['GET'])
def hostEvent():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)
	except Exception as e:
		flash("Something went wrong.")
		return redirect("/dashboard")

	return render_template("host-event.html", user = user,name = session['name'])


@app.route('/create-event', methods=['POST'])
def createEvent():
	errors = {}
	today = date.today()
	if request.method == "POST":
		try:
			if  len(request.form['name']) < 5:
				flash("Event name should be at least 5 characters")
			if 	datetime.strptime(request.form['date'], "%Y-%m-%d").date() < today:
				flash("Date should be future-dated")
			if  len(request.form['location']) < 5:
				flash("Location should be at least 5 characters")
			if  len(request.form['description']) < 10:
				flash("Description should be at least 10 characters")
		except Exception as e:
			flash("Unknown error")
		if '_flashes' in session.keys():
			return redirect('/host-event')
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
			query = "INSERT INTO events (user_id, event_name, date, location, description, max_attendees, created_at) VALUES (%(user_id)s, %(eventname)s, %(date)s, %(location)s, %(description)s, %(max_attendees)s,NOW());"
			data = {
				"user_id": session['user_id'],
				"eventname": request.form['name'],
				"date": request.form['date'],
				"location": request.form['location'],
				"description": request.form['description'],
				"max_attendees": request.form['max_attendees'],
			}
			event = mysql.query_db(query, data)
			flash("You just created a new event!")
			return redirect('/dashboard')
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
