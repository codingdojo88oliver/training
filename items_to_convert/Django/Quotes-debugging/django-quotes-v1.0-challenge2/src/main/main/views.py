from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User
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
		user = User.objects.create(name=request.POST['name'], username=request.POST['username'], password=request.POST['password'])

		messages.success(request, "User " + request.POST['name'] + " with username " + request.POST['username'] + " successfully registered!")

		return redirect("/")

def login(request):
	try:
		request.session['is_logged_in'] = True
		request.session['name'] = request.POST['username']
		request.session['user_id'] = 1
		return redirect("/dashboard")
	except Exception as e:
		messages.error(request, "Invalid username and password combination")
		return redirect("/")

def dashboard(request):
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			return render(request, "main/dashboard.html", {"user": user})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

def logout(request):
	request.session.flush()
	return redirect("/")


def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	