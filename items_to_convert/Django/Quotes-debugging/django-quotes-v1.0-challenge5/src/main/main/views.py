from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Quote, Favorite
import functools
print = functools.partial(print, flush=True)
import django.apps

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
		user = User.objects.get(username=request.POST['username'], password=request.POST['password'])
		request.session['is_logged_in'] = True
		request.session['name'] = user.name
		request.session['user_id'] = user.id
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

			# get all favorite quotes
			favorite_quotes = user.user_favorites.all()

			# get all quotes except favorites
			except_quote_ids = []
			if favorite_quotes.count() > 0:
				for favorite_quote in favorite_quotes:
					except_quote_ids.append(favorite_quote.quote_id)

			quotes = Quote.objects.filter().exclude(id__in=except_quote_ids)
			return render(request, "main/dashboard.html", {"user": user, "quotes": quotes, "favorite_quotes" : favorite_quotes})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

	return redirect("/dashboard")

def createQuote(request):
	errors = Quote.objects.basic_validator(request.POST)

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

		quote = Quote.objects.create(quoted_by=request.POST['quoted_by'], user=user, quote=request.POST['quote'])
		messages.success(request, "You just shared a new quote!")
		return redirect('/dashboard')

def moveToFavorites(request):
		quote = Quote.objects.get(id=request.POST['quote_id'])

		try:
			user = User.objects.get(id=request.session['user_id'])
			favorite = Favorite.objects.create(user=user, quote=quote)
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		favorite = Favorite.objects.create(user=user, quote=quote)
		messages.success(request, "You just favorited a quote!")
		return redirect('/dashboard')	

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE quotes;")
	cursor.execute("TRUNCATE favorites;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	