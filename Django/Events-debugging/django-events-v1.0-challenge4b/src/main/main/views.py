from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Event
import django.apps
import datetime
import pytz
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
	email = User.objects.filter(email=request.POST['email'])

	if email.count():
		try:
			user = User.objects.get(email=request.POST['email'], password=request.POST['password'])
			request.session['is_logged_in'] = True
			request.session['name'] = user.name
			request.session['user_id'] = user.id
			return redirect("/dashboard")
		except Exception as e:
			messages.error(request, "Invalid email and password combination")
			return redirect("/")
	else:
		messages.error(request, "Email does not exist in the database")
		return redirect("/")

def dashboard(request):
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			events_im_hosting = Event.objects.all()
			events_im_hosting_ids = []
			if events_im_hosting.count() > 0:
				for event in events_im_hosting:
					events_im_hosting_ids.append(event.id)

			upcoming_events = Event.objects.filter(user=user).exclude(id__in=events_im_hosting_ids)

			return render(request, "main/dashboard.html", {"user": user, "upcoming_events": upcoming_events, "events_im_hosting": events_im_hosting})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

	return redirect("/dashboard")

def hostEvent(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
	except Exception as e:
		return HttpResponse("Something went wrong.")

	return render(request, "main/host-event.html", {"user" : user})

def createEvent(request):
	errors = Event.objects.basic_validator(request.POST)

	if len(errors) > 0:
		for key, value in errors.items():
			messages.error(request, value)
		return redirect('/host-event')
	else:
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")
			
		event = Event.objects.create(name=request.POST['name'], user=user, date=request.POST['date'], location=request.POST['location'], description=request.POST['description'], max_attendees=request.POST['max_attendees'])
		messages.success(request, "You just created a new event!")
		return redirect('/dashboard')

def logout(request):
	request.session.flush()
	return redirect("/")


def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE events;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	