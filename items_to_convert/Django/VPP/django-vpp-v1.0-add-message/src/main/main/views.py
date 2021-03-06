from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Plane
import django.apps
import functools
print = functools.partial(print, flush=True)

def index(request):

	return render(request, "main/index.html")

def register(request):
	errors = User.objects.basic_validator(request.POST)

	if len(errors) > 0:
		for key, value in errors.items():
			messages.error(request, value)
		return redirect('/')
	else:
		user = User.objects.create(name=request.POST['name'], email=request.POST['email'], password=request.POST['password'])
		messages.success(request, "User " + request.POST['name'] + " with email " + request.POST['email'] + " successfully registered!")
		return redirect("/")

def login(request):
	try:
		user = User.objects.get(email=request.POST['email'], password=request.POST['password'])
		request.session['is_logged_in'] = True
		request.session['name'] = user.name
		request.session['user_id'] = user.id
		return redirect("/dashboard")
	except Exception as e:
		messages.error(request, "Invalid email and password combination")
		return redirect("/")		

def dashboard(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...	

def createPlane(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("DELETE FROM users WHERE email in('brian@datacompass.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	