from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Product, Transaction, Negotiation
import ast
import django.apps
from django.db.models import Q

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
		login(request, request.POST['email'], request.POST['password'])

		return redirect("/dashboard")

def login(request, email=None, password=None):
	if email is None and password is None:
		email = request.POST['email']
		password = request.POST['password']

	try:
		user = User.objects.get(email=email, password=password)
		request.session['is_logged_in'] = True
		request.session['first_name'] = user.first_name
		request.session['user_id'] = user.id
		return redirect("/dashboard")
	except Exception as e:
		print(e)
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

def myTransactions(request):
	if 'is_logged_in' in request.session:
		if request.session['is_logged_in'] == True:
			try:
				user = User.objects.get(id=request.session['user_id'])
			except Exception as e:
				messages.error(request, "Invalid session")
				return redirect("/")

			# get user's created products
			product_ids = []
			products = Product.objects.filter(user=user)
			if products.count() > 0:
				for product in products:
					product_ids.append(product.id)

			# get user's sold products
			items_sold = Transaction.objects.filter(product_id__in=product_ids)

			#get user's items bought
			items_bought = Transaction.objects.filter(buyer=user)

			#get items under negotiation (both you negotiated with and products you posted)
			negotiations = Negotiation.objects.filter(Q(negotiator=user) | Q(product_id__in=product_ids))
			return render(request, "main/mytransactions.html", {"user": user, "items_sold": items_sold, "items_bought": items_bought, "negotiations": negotiations})
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
		return redirect('/mytransactions')
	else:
		try:
			user = User.objects.get(id=request.session['user_id'])
		except Exception as e:
			messages.error(request, "User is not logged in")
			return redirect("/")

		product = Product.objects.create(name=request.POST['name'], price=request.POST['price'], description=request.POST['description'], category=request.POST['category'], user=user)
		messages.success(request, "You just created an advertisement!")
		return redirect('/mytransactions')

def logout(request):
	request.session.flush()
	return redirect("/")

def showProduct(request, id):
	try:
		user = User.objects.get(id=request.session['user_id'])
		product = Product.objects.get(id=id)
	except Exception as e:
		return HttpResponse("You are not allowed to view this product")

	return render(request, "main/show-product.html", {"product" : product, "user": user})

def buy(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		product = Product.objects.get(id=request.POST['product'])
	except Exception as e:
		return HttpResponse("You are not allowed to view this product")

	Transaction.objects.create(price=product.price, buyer=user, product=product)

	# update product
	product.status = "Sold"
	product.save()
	messages.success(request, "You just successfully bought the product!")
	return redirect('/mytransactions')

def negotiate(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		product = Product.objects.get(id=request.POST['product'])
	except Exception as e:
		return HttpResponse("You are not allowed to negotiate with this product")

	seventy_percent = float(product.price) * 0.7

	if float(request.POST['price']) > float(product.price):
		messages.error(request, "Asking price should not be higher than the original price posted.")
		return redirect('/products/'+request.POST['product'])
	elif float(request.POST['price']) < seventy_percent:
		messages.error(request, "Asking price should not be lower than 70% of the original price.")
		return redirect('/products/'+request.POST['product'])

	Negotiation.objects.create(price=request.POST['price'], negotiator=user, product=product)

	# update the product
	product.status = "Under Negotiation"
	product.save()

	messages.success(request, "You just successfully negotiated for a product!")
	return redirect("/mytransactions")

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
	return redirect('/mytransactions')

def dismiss(request):

	try:
		user = User.objects.get(id=request.session['user_id'])
		negotiation = Negotiation.objects.get(id=request.POST['negotiation_id'])
	except Exception as e:
		return HttpResponse("You are not allowed to approve this negotiation")

	# update product
	product = negotiation.product
	product.status = "Available"
	product.save()

	# delete the negotiation
	negotiation.delete()
	messages.success(request, "Asking price dismissed!")
	return redirect('/mytransactions')

def deletePlane(request):
	try:
		user = User.objects.get(id=request.session['user_id'])
		plane = Plane.objects.get(id=request.POST['plane_id'], user=user)
	except Exception as e:
		messages.error(request, "You are not allowed to delete this virtual paper plane")
		return redirect("/dashboard")

	#first let's remove the stamps and messages of the plane
	Stamp.objects.filter(plane=plane).delete()
	Message.objects.filter(plane=plane).delete()
	plane.delete()
	messages.success(request, "Plane successfully deleted")

	return redirect("/dashboard")

def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("DELETE FROM users WHERE email in('dsquarius@greenjr.com', 'jack@tacktheritrix.com', 'ozamataz@buckshank.com', 'djasperprobincrux@thethird.com', 'javarisjamarjavarison@lamar.com', 'bismo@funyuns.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	