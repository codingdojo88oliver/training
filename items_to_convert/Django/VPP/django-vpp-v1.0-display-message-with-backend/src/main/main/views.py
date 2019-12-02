from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Plane
import ast
import django.apps

def index(request):

	return render(request, "main/index.html")

def register(request):
	user, new_user = User.objects.get_or_create(email="brian@datacompass.com", name="Brian", password="password")
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
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			# get user planes
			planes = Plane.objects.filter(user=user)
			return render(request, "main/dashboard.html", {"user": user, "planes": planes})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

def createPlane(request):
	errors = Plane.objects.basic_validator(request.POST)

	if len(errors) > 0:
		for key, value in errors.items():
			messages.error(request, value)
		return redirect('/dashboard')
	else:
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		plane = Plane.objects.create(message=request.POST['message'], user=user)
		messages.success(request, "You just created a virtual paper plane!")
		return redirect('/dashboard')

def showMyPlane(request, id):
	try:
		user = User.objects.get(id=request.session['user_id'])
		plane = Plane.objects.get(id=id, user=user)
	except Exception as e:
		return HttpResponse("You are not allowed to view this message")

	return render(request, "main/show-my-plane.html", {"plane": plane})

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("DELETE FROM users WHERE email in('brian@datacompass.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	