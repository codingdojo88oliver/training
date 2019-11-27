from flask import Flask, render_template,request, redirect, session, flash
from datetime import datetime, date
from mysqlconnection import connectToMySQL 
from pytz import timezone
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
			# utc = date.today()
			mysql = connectToMySQL()
			query = "SELECT  events.date AS event_date, events.id AS event_id,  joins.id AS join_id, users.name AS names FROM joins LEFT JOIN events ON events.id = joins.event_id LEFT JOIN users ON joins.user_id = users.id WHERE joins.user_id = %(id)s;"
			joined_events = mysql.query_db(query,data)
			
			utc = datetime.today()
			upcoming_joined_event_ids = []
			past_joined_event_ids = []
			all_joined_event_ids = []
			# print(joined_events)
			if len(joined_events) > 0:
				for joined_event in joined_events:
					all_joined_event_ids.append(joined_event['join_id'])
					if joined_event['event_date'] > utc:
						upcoming_joined_event_ids.append(joined_event['event_id'])
					else:
						past_joined_event_ids.append(joined_event['event_id'])

			# get all upcoming_joined_events
				mysql = connectToMySQL()
				query = "SELECT joins.id as joins_id, users.name, events.event_name, events.date FROM events LEFT JOIN users ON users.id = events.user_id LEFT JOIN joins ON joins.event_id = events.id WHERE events.id  IN  %(upcoming_joined_ids)s;"
				data = {
						"upcoming_joined_ids": upcoming_joined_event_ids,
						"ids": session['user_id']
				}
				upcoming_joined_events = mysql.query_db(query, data)
				# get all past_joined_events
				mysql = connectToMySQL()
				events = "SELECT * FROM events LEFT JOIN users ON users.id = events.user_id WHERE events.id IN  %(past_joined_ids)s;"
				data = {
					"past_joined_ids": past_joined_event_ids,
				}
				
				past_joined_events = mysql.query_db(events, data)
				past_joined_events = []
				# print(past_joined_events)
				mysql = connectToMySQL()
				event = "SELECT users.name as names, events.event_name as event_name, events.max_attendees as max_attendees, events.date as event_date, events.id as event_id FROM events LEFT JOIN users ON users.id = events.user_id WHERE events.id NOT IN  %(all_joined_event)s;"
				data = {
					"all_joined_event": all_joined_event_ids,
					"id": session['user_id']
				}
				events_not_yet_joined = mysql.query_db(event, data)
				print(events_not_yet_joined)
				upcoming_events = []
				count = 0
				for event in events_not_yet_joined:
					if event['max_attendees'] > count :
					 	upcoming_events.append(event)
					return render_template("dashboard.html", name = session['name'], upcoming_joined_events = upcoming_joined_events, past_joined_events = past_joined_events, events_not_yet_joined = upcoming_events)
			else:
				mysql = connectToMySQL()
				event = "SELECT users.name as names, events.event_name as event_name, events.max_attendees as max_attendees, events.date as event_date, events.id as event_id FROM events LEFT JOIN users ON users.id = events.user_id;"
				events_not_yet_joined = mysql.query_db(event)
				upcoming_events = []
				count = 0
				for event in events_not_yet_joined:
					count += 1
					if event['max_attendees'] > count:
					 	upcoming_events.append(event)
				upcoming_joined_events = []
				past_joined_events = []
				return render_template("dashboard.html", name = session['name'], upcoming_joined_events = upcoming_joined_events, past_joined_events = past_joined_events, events_not_yet_joined = upcoming_events)
			# return render_template("dashboard.html", name = session['name'], events_not_yet_joined = upcoming_events, upcoming_joined_events = upcoming_joined_events)
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
@app.route('/join-event', methods=['POST'])
def joinEvent():
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
	query = "SELECT * FROM events WHERE id = %(event_id)s;"
	data = {
		"event_id":request.form['event_id'],
	}
	event = mysql.query_db(query, data)

	mysql = connectToMySQL()
	query = "INSERT INTO joins (user_id, event_id, created_at) VALUES (%(id)s, %(event_id)s, NOW());"
	data = {
		"id": session['user_id'],
		"event_id":event[0]['id']
	}
	join = mysql.query_db(query,data)
	flash("You just joined an event!")
	return redirect('/dashboard')

@app.route('/unjoin-event', methods=['POST'])
def unjoinEvent():
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
	flash("You just Unjoined an event!")
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
