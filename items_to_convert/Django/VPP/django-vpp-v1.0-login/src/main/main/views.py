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
		messages.success(request, "User " + request.POST['name'] + " with email " + request.POST['email'] + " successfully registered!")
		return redirect("/")

def login(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def dashboard(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def logout(request):
	request.session.flush()
	return redirect("/")


def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("DELETE FROM users WHERE email in('dsquarius@greenjr.com', 'jack@tacktheritrix.com', 'ozamataz@buckshank.com', 'djasperprobincrux@thethird.com', 'leozmax@jilliumz.com', 'javarisjamarjavarison@lamar.com', 'bismo@funyuns.com', 'scoishvelociraptor@maloish.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')		