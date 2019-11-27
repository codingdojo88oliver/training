from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Event, Join
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

			utc = pytz.UTC
			# get all joined events
			joined_events = user.joined_events.all()

			upcoming_joined_event_ids = []
			past_joined_event_ids = []
			all_joined_event_ids = []

			if joined_events.count() > 0:
				for joined_event in joined_events:
					all_joined_event_ids.append(joined_event.event_id)
					if joined_event.event.date.replace(tzinfo=utc) > datetime.datetime.today().replace(tzinfo=utc):
						upcoming_joined_event_ids.append(joined_event.event_id)
					else:
						past_joined_event_ids.append(joined_event.event_id)

			# get all upcoming_joined_events
			upcoming_joined_events = Event.objects.filter(id__in=upcoming_joined_event_ids)

			# get all past_joined_events
			past_joined_events = Event.objects.filter(id__in=past_joined_event_ids)

			# get all events not yet joined
			events_not_yet_joined = Event.objects.filter().exclude(id__in=all_joined_event_ids)
			upcoming_events = []
			# events_not_yet_joined's max_attendees should be greater than event.attendees.count()
			for event in events_not_yet_joined:
				if event.max_attendees > event.attendees.count():
					upcoming_events.append(event)

			return render(request, "main/dashboard.html", {"user": user, "upcoming_joined_events": upcoming_joined_events, "past_joined_events": past_joined_events, "events_not_yet_joined": upcoming_events})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

	return redirect("/dashboard")
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
		join = Join.objects.create(user=user, event=event)
		messages.success(request, "You just created a new event!")
		return redirect('/dashboard')

def joinEvent(request):
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		event = Event.objects.get(id=request.POST['event_id'])
		join = Join.objects.create(user=user, event=event)
		messages.success(request, "You just joined an event!")
		return redirect('/dashboard')	

def unjoinEvent(request):
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		messages.success(request, "You just Unjoined an event!")
		return redirect('/dashboard')

def logout(request):
	request.session.flush()
	return redirect("/")


def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE events;")
	cursor.execute("TRUNCATE joins;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	