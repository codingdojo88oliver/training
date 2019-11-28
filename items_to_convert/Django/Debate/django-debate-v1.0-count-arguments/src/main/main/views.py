from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Topic, Argument
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

			# get fresh topics and my topics
			my_topics = Topic.objects.filter(user=user)
			fresh_topics = Topic.objects.filter().exclude(user=user)
			return render(request, "main/dashboard.html", {"user": user, "my_topics": my_topics, "fresh_topics": fresh_topics})
		else:
			messages.error(request, "User is not logged in")
			return redirect("/")
	else:
		messages.error(request, "User is not logged in")
		return redirect("/")

def createTopic(request):
	errors = Topic.objects.basic_validator(request.POST)

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

		topic = Topic.objects.create(title=request.POST['title'], description=request.POST['description'], user=user)
		messages.success(request, "You just created a topic!")
		return redirect('/dashboard')

def createArgument(request):
	errors = Argument.objects.basic_validator(request.POST)

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

		topic = Topic.objects.filter(id=request.POST['topic_id'], user=user)
		if topic.count() >= 1:
			messages.error(request, "You can only post 1 argument per topic")
			return redirect("/topics/" + request.POST['topic_id'])

		topic = Topic.objects.get(id=request.POST['topic_id'])
		argument = Argument.objects.filter(user=user, topic=topic)

		if argument.count() >= 1:
			if argument[0].stance != request.POST['stance']:
				messages.error(request, "You can only have 1 stance per topic.")
				return redirect("/topics/" + request.POST['topic_id'])

		Argument.objects.create(stance=request.POST['stance'], argument=request.POST['argument'], user=user, topic=topic)
		messages.success(request, "You just created an argument!")
		return redirect('/topics/' + request.POST['topic_id'])

def showTopic(request, id):
	user = User.objects.get(id=request.session['user_id'])

	try:
		topic = Topic.objects.get(id=id)
	except Exception as e:
		messages.error(request, "Topic not found")
		return redirect("/dashboard")

	arguments = topic.topic_arguments.order_by('-point').all()
	agree_points_total = sum(filter(None, [item.point for item in topic.topic_arguments.filter(stance="agree")]))
	neutral_points_total = sum(filter(None, [item.point for item in topic.topic_arguments.filter(stance="neutral")]))
	disagree_points_total = sum(filter(None, [item.point for item in topic.topic_arguments.filter(stance="disagree")]))
	return render(request, "main/topic.html", {"topic" : topic, "arguments" : arguments, "agree_points_total": agree_points_total, "disagree_points_total": disagree_points_total, "neutral_points_total": neutral_points_total})

def upvote(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def downvote(request):
	return HttpResponse("Hello, World! Make sure you remove this line of code from views.py file and replace it with your own code.")
	# Your code goes here...

def logout(request):
	request.session.flush()
	return redirect("/")


def reset(request):
	cursor = connection.cursor()
	cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
	cursor.execute("TRUNCATE users;")
	cursor.execute("TRUNCATE topics;")
	cursor.execute("TRUNCATE arguments;")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	