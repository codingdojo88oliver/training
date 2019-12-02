from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Plane, Message
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
		user = User.objects.create(name=request.POST['name'], email=request.POST['email'], password=request.POST['password'], country=request.POST.get('country', False))
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
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			# get user planes
			planes = Plane.objects.filter(user=user)
			secret_messages = Message.objects.filter(receiver=user)
			return render(request, "main/dashboard.html", {"user": user, "planes": planes, "secret_messages": secret_messages})
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

def throwPlane(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		plane = Plane.objects.get(id=request.POST['plane_id'])
	except Exception as e:
		messages.error(request, "User is not logged in")
		return redirect("/")

	try:
		the_candidate = User.objects.filter(country=user.country).exclude(id=user.id)[0]

		# create the message
		message, created = Message.objects.get_or_create(receiver=the_candidate, plane=plane)

		if created:
			# update the plane
			plane.status = "Landed"
			plane.save()
			messages.success(request, "Congratulations! Your plane flew and landed!")

		else:
			messages.success(request, "No matching users found")
		
	except Exception as e:
		messages.error(request, "No matching users found")
		return redirect("/dashboard")		

	return redirect("/dashboard")


def showPlane(request, id):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def deletePlane(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE messages;")
	cursor.execute("TRUNCATE planes;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	