from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Product, Transaction, Negotiation
from django.db.models import Q
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

			# get categories
			categories = {
				"Arts & Crafts": "Arts & Crafts",
				"Computer Accessories": "Computer Accessories",
				"Video Games & Consoles": "Video Games & Consoles" 
			}

			# get user's created products
			product_ids = []
			products = Product.objects.filter(user=user)
			if products.count() > 0:
				for product in products:
					product_ids.append(product.id)

			#other products
			other_products = Product.objects.exclude(user=user)

			#get user's items bought
			items_bought = Transaction.objects.filter(buyer=user)

			#get items under negotiation (both you negotiated with and products you posted)
			negotiations = Negotiation.objects.filter(Q(negotiator=user) | Q(product_id__in=product_ids))

			return render(request, "main/dashboard.html", {"user": user, "other_products": other_products, "products": products, "categories": categories, "items_bought": items_bought, "negotiations": negotiations})
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

def negotiate(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		product = Product.objects.get(id=request.POST['product_id'])
	except Exception as e:
		return HttpResponse("You are not allowed to negotiate with this product")

	seventy_percent = float(product.price) * 0.7

	if float(request.POST['price']) > float(product.price):
		messages.error(request, "Asking price should not be higher than the original price posted.")
		return redirect('/dashboard')		

	Negotiation.objects.create(price=request.POST['price'], negotiator=user, product=product)

	# update the product
	product.status = "Under Negotiation"
	product.save()

	messages.success(request, "You just successfully negotiated for a product!")
	return redirect("/dashboard")

def approve(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		negotiation = Negotiation.objects.get(id=request.POST['negotiation_id'])
	except Exception as e:
		return HttpResponse("You are not allowed to approve this negotiation")


	# create a transaction
	Transaction.objects.create(price=negotiation.price, buyer=negotiation.negotiator, product=negotiation.product)

	# update product
	product = negotiation.product
	product.status = "Sold"

	product.save()
	messages.success(request, "Asking price approved!")
	return redirect('/dashboard')

def logout(request):
	request.session.flush()
	return redirect("/")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE products;")
	cursor.execute("TRUNCATE transactions;")
	cursor.execute("TRUNCATE negotiations;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	