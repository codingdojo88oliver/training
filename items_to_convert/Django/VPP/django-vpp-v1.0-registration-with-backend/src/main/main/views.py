from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Interest, Language
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
		interests = []
		for post_interest in request.POST.getlist('interests', False):
			interests.append(Interest(interest=post_interest, user=user))

		Interest.objects.bulk_create(interests)

		languages = []
		for post_language in request.POST.getlist('language', False):
			languages.append(Language(language=post_language, user=user))

		Language.objects.bulk_create(languages)

		request.session['is_logged_in'] = True
		request.session['name'] = user.name
		request.session['user_id'] = user.id

		return redirect("/dashboard")

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
	cursor.execute("DELETE FROM users WHERE email in('dsquarius@greenjr.com', 'jack@tacktheritrix.com', 'ozamataz@buckshank.com', 'djasperprobincrux@thethird.com', 'leozmax@jilliumz.com', 'javarisjamarjavarison@lamar.com', 'bismo@funyuns.com', 'scoishvelociraptor@maloish.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	