from flask import Flask, render_template, request, redirect, session, flash
from mysqlconnection import connectToMySQL
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'flask secret key'

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
	errors = {}
	if request.method == "POST":
		try:
			if len(request.form['name']) < 3:
				flash("Name should be at least 3 characters")
			if len(request.form['password']) < 6:
				flash("Password should be at least 6 characters")
			if request.form['password'] != request.form['c_password']:
				flash("Passwords do not match")
			if 'country' not in request.form:
				flash("Country is required")
			if 'interests' not in request.form:
				flash("Should select at least 1 interest")
			if 'language' not in request.form:
				flash("Should select at least 1 language")
		except Exception as e:
			flash("Unknown error")

		if '_flashes' in session.keys():
			return redirect('/')
		else:
			mysql = connectToMySQL()
			query = "INSERT INTO users (name, email, password, country, created_at) VALUES (%(name)s, %(email)s, %(password)s, %(country)s, %(created_at)s);"
			data = {
				"name": request.form['name'],
				"email": request.form['email'],
				"password": request.form['password'],
				"country": request.form['country'],
				"created_at": datetime.now()
			}

			user_id = mysql.query_db(query, data)

			for post_interest in request.form.getlist('interests'):
				mysql = connectToMySQL()
				query = "INSERT INTO interests (interest, user_id, created_at) VALUES (%(i)s, %(u_id)s, %(c_at)s);"
				data = {
					"i": post_interest,
					"u_id": user_id,
					"c_at": datetime.now(),
				}
				mysql.query_db(query, data)

			for post_language in request.form.getlist('language'):
				mysql = connectToMySQL()
				query = "INSERT INTO languages (language, user_id, created_at) VALUES (%(l)s, %(u_id)s, %(c_at)s);"
				data = {
					"l": post_language,
					"u_id": user_id,
					"c_at": datetime.now(),
				}
				mysql.query_db(query, data)

			flash("User " + request.form['name'] + " with email " + request.form['email'] + " successfully registered!")

	return redirect("/")

@app.route('/login', methods=['POST'])
def login():
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE email = %(e)s AND password = %(p)s LIMIT 1;"
		data = {
			"e": request.form['email'],
			"p": request.form['password'],
		}
		user = mysql.query_db(query, data)
		session['is_logged_in'] = True
		session['name'] = user[0]['name']
		session['user_id'] = user[0]['id']
		return redirect("/dashboard")
	except Exception as e:
		flash("Invalid email and password combination")
		return redirect("/")

@app.route('/logout', methods=['GET'])
def logout():
	session.clear()
	return redirect("/")

@app.route('/dashboard', methods=['GET'])
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

			# get user planes
			mysql = connectToMySQL()
			query = "SELECT * FROM planes WHERE user_id = %(id)s;"
			planes = mysql.query_db(query, data)

			# get each plane's stamps
			plane_ids = []
			stamps = []
			if len(planes) > 0:
				for plane in planes:
					plane_ids.append(plane['id'])

			if len(plane_ids) > 0:
				mysql = connectToMySQL()
				query = "SELECT * FROM stamps WHERE plane_id IN %(p_ids)s;"
				data = {
					"p_ids": plane_ids
				}
				stamps = mysql.query_db(query, data)


			mysql = connectToMySQL()
			query = "SELECT users.country as country, messages.id as id, messages.created_at as created_at, messages.status as status FROM messages LEFT JOIN planes ON messages.plane_id = planes.id LEFT JOIN users ON planes.user_id = users.id WHERE messages.receiver_id = %(id)s;"
			data = {
				"id": session['user_id']
			}
			secret_messages = mysql.query_db(query, data)	

			return render_template("dashboard.html", user=user[0], secret_messages=secret_messages, planes=planes, stamps=stamps)
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
			query = "INSERT INTO planes (message, user_id, status, created_at) VALUES (%(m)s, %(u_id)s, %(s)s, %(c_at)s);"
			data = {
				"u_id": session['user_id'],
				"m": request.form['message'],
				"s": "Ready",
				"c_at": datetime.now(),

			}

			mysql.query_db(query, data)
			flash("You just created a virtual paper plane!")
			
	return redirect('/dashboard')

@app.route('/throw-plane', methods=['POST'])
def throwPlane():
	if request.method == "POST":
		try:
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
			data = {
				"id": session['user_id']
			}
			user = mysql.query_db(query, data)

			mysql = connectToMySQL()
			query = "SELECT * FROM planes WHERE id = %(p_id)s LIMIT 1;"
			data = {
				"p_id": request.form['plane_id'],
			}
			plane = mysql.query_db(query, data)
		except Exception as e:
			flash("User is not logged in")
			return redirect("/")

		# get user's interests and languages
		mysql = connectToMySQL()
		data = {
			"id": session['user_id']
		}
		query = "SELECT * FROM interests WHERE user_id = %(id)s;"
		user_interests = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM languages WHERE user_id = %(id)s;"
		user_languages = mysql.query_db(query, data)

		# get all users who already got the plane
		mysql = connectToMySQL()
		query = "SELECT * FROM messages WHERE plane_id = %(p_id)s;"
		data = {
			"p_id": request.form['plane_id'],
		}
		secret_messages = mysql.query_db(query, data)
		receiver_ids = []

		if len(secret_messages) > 0:
			for message in secret_messages:
				receiver_ids.append(message['receiver_id'])

		
		except_user_ids = []
		if len(receiver_ids) > 0:
			for receiver_id in receiver_ids:
				except_user_ids.append(receiver_id)

		except_user_ids.append(user[0]['id'])
		# get interests and languages of all users except owner of plane and users who already got the plane
		mysql = connectToMySQL()
		query = "SELECT * FROM interests WHERE user_id NOT IN %(u_id)s;"
		data = {
			"u_id": except_user_ids
		}
		interests = mysql.query_db(query, data)
		mysql = connectToMySQL()
		query = "SELECT * FROM languages WHERE user_id NOT IN %(u_id)s;"
		languages = mysql.query_db(query, data)

		interest_candidates = []
		language_candidates = []
		candidates = []

		#filter candidates by language and interest
		if interests:
			for interest in interests: #loop through other user's interests
				try:
					for user_interest in user_interests: # loop through user's interests
						if user_interest['interest'] == interest['interest']: # if interests match
							interest_candidates.append(interest['user_id'])
				except Exception as e:
					pass

		if languages:
			for language in languages: #loop through other use's languages
				try:
					for user_language in user_languages: #loop through user's languages
						if user_language['language'] == language['language']:
							language_candidates.append(language['user_id'])
				except Exception as e:
					pass

		candidates = set(interest_candidates) & set(language_candidates)
		#remove repeating user_id in candidates
		candidates = list(dict.fromkeys(candidates))

		try:
			mysql = connectToMySQL()
			query = "SELECT * FROM users WHERE id IN %(id)s LIMIT 1;"
			data = {
				"id": candidates
			}
			the_candidate = mysql.query_db(query, data)

			# create the message
			mysql = connectToMySQL()
			query = "INSERT INTO messages (receiver_id, plane_id, status, created_at) VALUES (%(r_id)s, %(p_id)s, %(status)s, %(c_at)s);"
			data = {
				"r_id": the_candidate[0]['id'],
				"p_id": plane[0]['id'],
				"c_at": datetime.now(),
				"status": "Unread"
			}
			mysql.query_db(query, data)

			# update the plane
			mysql = connectToMySQL()
			query = "UPDATE planes SET status = 'Landed' WHERE id = %(id)s;"
			data = {
				"id": plane[0]['id']
			}
			mysql.query_db(query, data)
			flash("Congratulations! Your plane flew and landed!")
		except Exception as e:
			flash("No matching users found")
			return redirect("/dashboard")		

	return redirect("/dashboard")

@app.route('/my-planes/<plane_id>', methods=['GET'])
def showMyPlane(plane_id):
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT * FROM planes WHERE id = %(p_id)s AND user_id = %(u_id)s LIMIT 1;"
		data = {
			"p_id": plane_id,
			"u_id": session['user_id']
		}
		plane = mysql.query_db(query, data)
	except Exception as e:
		flash("You are not allowed to view this message")
		return redirect('/dashboard')

	if len(plane) > 0:
		pass
	else:
		flash("You are not allowed to view this message")
		return redirect('/dashboard')		

	# get all stamps of the plane
	mysql = connectToMySQL()
	query = "SELECT * FROM stamps WHERE plane_id = %(p_id)s;"
	data = {
		"p_id": plane_id
	}
	stamps = mysql.query_db(query, data)

	return render_template("show-my-plane.html", plane=plane[0], stamps=stamps)

@app.route('/received-planes/<message_id>', methods=['GET'])
def showReceivedPlane(message_id):
	try:
		mysql = connectToMySQL()
		query = "SELECT * FROM users WHERE id = %(id)s LIMIT 1;"
		data = {
			"id": session['user_id']
		}
		user = mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "SELECT users.country as country, planes.message as message, messages.plane_id as plane_id FROM messages LEFT JOIN planes ON messages.plane_id = planes.id LEFT JOIN users ON planes.user_id = users.id WHERE messages.id = %(m_id)s AND messages.receiver_id = %(r_id)s LIMIT 1;"
		data = {
			"m_id": message_id,
			"r_id": user[0]['id']
		}
		message = mysql.query_db(query, data)
	except Exception as e:
		flash("You are not allowed to view this message")
		return redirect('/dashboard')

	mysql = connectToMySQL()
	query = "UPDATE messages SET status = 'Read' WHERE id = %(m_id)s;"
	data = {
		"m_id": message_id
	}
	mysql.query_db(query, data)

	mysql = connectToMySQL()
	query = "SELECT * FROM planes WHERE id = %(p_id)s LIMIT 1;"
	data = {
		"p_id": message[0]['plane_id']
	}
	plane = mysql.query_db(query, data)

	# stamp the plane or get if stamp.country already exists
	mysql = connectToMySQL()
	query = "SELECT * FROM stamps WHERE country = %(country)s AND plane_id = %(p_id)s LIMIT 1;"
	data = {
		"country": user[0]['country'],
		"p_id": plane[0]['id']
	}
	stamp = mysql.query_db(query, data)

	if len(stamp) <= 0:
		mysql = connectToMySQL()
		query = "INSERT INTO stamps (country, plane_id, created_at) VALUES (%(country)s, %(p_id)s, %(c_at)s);"
		data = {
			"country": user[0]['country'],
			'p_id': plane[0]['id'],
			'c_at': datetime.now()
		}
		mysql.query_db(query, data)

	# get all stamps of the plane
	mysql = connectToMySQL()
	query = "SELECT * FROM stamps WHERE plane_id = %(p_id)s;"
	data = {
		"p_id": plane[0]['id']
	}
	stamps = mysql.query_db(query, data)

	return render_template("show-received-plane.html", message=message[0], stamps=stamps)

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
			query = "SELECT * FROM planes WHERE id = %(p_id)s AND user_id = %(u_id)s LIMIT 1;"
			data = {
				"p_id": request.form['plane_id'],
				"u_id": session['user_id']
			}
			
			plane = mysql.query_db(query, data)
		except Exception as e:
			flash("Something went wrong")
			return redirect("/dashboard")

		if len(plane) > 0:
			pass
		else:
			flash("You are not allowed to delete this virtual paper plane")
			return redirect('/dashboard')

		#first let's remove the stamps and messages of the plane
		mysql = connectToMySQL()
		query = "DELETE FROM stamps WHERE plane_id = %(p_id)s;"
		data = {
			"p_id": request.form['plane_id']
		}
		mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "DELETE FROM messages WHERE plane_id = %(p_id)s;"
		mysql.query_db(query, data)

		mysql = connectToMySQL()
		query = "DELETE FROM planes WHERE id = %(p_id)s;"
		mysql.query_db(query, data)

		flash("Plane successfully deleted")

	return redirect("/dashboard")

@app.route('/reset', methods=['GET'])
def reset():
	mysql = connectToMySQL()
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 0;")
	mysql.query_db("DELETE FROM users WHERE email in('dsquarius@greenjr.com', 'jack@tacktheritrix.com', 'ozamataz@buckshank.com', 'djasperprobincrux@thethird.com', 'leozmax@jilliumz.com', 'javarisjamarjavarison@lamar.com', 'bismo@funyuns.com', 'scoishvelociraptor@maloish.com');")
	mysql.query_db("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')

if __name__ == "__main__":
	app.run("0.0.0.0", port=8000, debug=True)