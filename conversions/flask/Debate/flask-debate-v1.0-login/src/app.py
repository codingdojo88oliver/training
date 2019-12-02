from flask import Flask, render_template,request, redirect, session, flash, Response


from mysqlconnection import connectToMySQL 

app = Flask(__name__)
app.secret_key = 'keep it secret, keep it safe'

@app.route("/")
def index():
	
	return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
	return Response("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")

@app.route("/login", methods = ["POST"])
def login():
	return Response("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")

@app.route("/dashboard", methods = ["GET"])
def dashboard():
	return Response("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")

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
