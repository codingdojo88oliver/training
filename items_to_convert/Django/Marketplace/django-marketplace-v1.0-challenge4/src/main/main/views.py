from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Product
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
		user = User.objects.create(first_name=request.POST['first_name'], last_name=request.POST['last_name'], email=request.POST['email'], password=request.POST['password'])
		
		messages.success(request, "User " + request.POST['first_name'] + " " + request.POST['last_name'] + " with email " + request.POST['email'] + " successfully registered!")

		return redirect("/")

def login(request):
	email = User.objects.filter(email=request.POST['email'])

	if email.count():
		try:
			user = User.objects.get(email=request.POST['email'], password=request.POST['password'])
			request.session['is_logged_in'] = True
			
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

			# get user all categories
			categories = {
				"Arts & Crafts": "Arts & Crafts",
				"Computer Accessories": "Computer Accessories",
				"Video Games & Consoles": "Video Games & Consoles" 
			}
			products = Product.objects.filter(status="Available").order_by('-created_at')
			return render(request, "main/dashboard.html", {"user": user, "products": products, "categories": categories})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

def addProduct(request):
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			return render(request, "main/add-product.html", {"user": user})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

def removeProduct(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...


def createProduct(request):
	errors = Product.objects.basic_validator(request.POST)

	if len(errors) > 0:
		for key, value in errors.items():
			messages.error(request, value)
		return redirect('/add-product')
	else:
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		product = Product.objects.create(name=request.POST['name'], price=request.POST['price'], description=request.POST['description'], category=request.POST['category'], user=user)
		messages.success(request, "You just created an advertisement!")
		return redirect('/add-product')

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE products;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	