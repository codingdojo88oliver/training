from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.db import connection
from .models import User, Interest, Plane, Message, Stamp, Language
import ast
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

	# get user's interests and languages
	user_interests = user.interests.all()
	user_languages = user.languages.all()

	# get all users who already got the plane
	secret_messages = Message.objects.filter(plane_id=request.POST['plane_id'])
	receiver_ids = []
	if secret_messages.count() > 0:
		for message in secret_messages:
			receiver_ids.append(message.receiver_id)

	
	except_user_ids = []
	if len(receiver_ids) > 0:
		for receiver_id in receiver_ids:
			except_user_ids.append(receiver_id)

	except_user_ids.append(user.id)
	# get interests and languages of all users except owner of plane and users who already got the plane
	interests = Interest.objects.filter().exclude(user_id__in=except_user_ids)
	languages = Language.objects.filter().exclude(user_id__in=except_user_ids)

	interest_candidates = []
	language_candidates = []
	candidates = []

	#filter candidates by language and interest
	for interest in interests: #loop through other user's interests
		try:
			if interest.user: # only if this interest is currently tied to a user
				for user_interest in user_interests: # loop through user's interests
					if user_interest.interest == interest.interest: # if interests match
						interest_candidates.append(interest.user_id)
		except Exception as e:
			pass

	for language in languages: #loop through other use's languages
		try:
			if language.user: # only if this language is currently tied to a user
				for user_language in user_languages: #loop through user's languages
					if user_language.language == language.language:
						language_candidates.append(language.user_id)
		except Exception as e:
			pass

	candidates = set(interest_candidates) & set(language_candidates)
	#remove repeating user_id in candidates
	candidates = list(dict.fromkeys(candidates))

	try:
		the_candidate = User.objects.filter(id__in=candidates)[0]

		# create the message
		Message.objects.create(receiver=the_candidate, plane=plane)
		# update the plane
		plane.status = "Landed"
		plane.save()
		messages.success(request, "Congratulations! Your plane flew and landed!")
	except Exception as e:
		messages.error(request, "No matching users found")
		return redirect("/dashboard")		

	return redirect("/dashboard")

def logout(request):
	request.session.flush()
	return redirect("/")

def showReceivedPlane(request, id):
	try:
		user = User.objects.get(id=request.session['user_id'])
		message = Message.objects.get(id=id, receiver=user)
	except Exception as e:
		return HttpResponse("You are not allowed to view this message")

	message.status = "Read"
	message.save()

	plane = Plane.objects.get(id=message.plane_id)

	# stamp the plane or get if stamp.country already exists
	stamp, created = Stamp.objects.get_or_create(country=user.country, plane=plane)

	# get all stamps of the plane
	stamps = Stamp.objects.filter(plane=plane)

	return render(request, "main/show-received-plane.html", {"message" : message, "stamps" : stamps})

def showMyPlane(request, id):
	try:
		user = User.objects.get(id=request.session['user_id'])
		plane = Plane.objects.get(id=id, user=user)
	except Exception as e:
		return HttpResponse("You are not allowed to view this message")

	# get all stamps of the plane
	stamps = Stamp.objects.filter(plane=plane)

	return render(request, "main/show-my-plane.html", {"plane": plane, "stamps": stamps})

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
	cursor.execute("DELETE FROM users WHERE email in('dsquarius@greenjr.com', 'jack@tacktheritrix.com', 'ozamataz@buckshank.com', 'djasperprobincrux@thethird.com', 'leozmax@jilliumz.com', 'javarisjamarjavarison@lamar.com', 'bismo@funyuns.com', 'scoishvelociraptor@maloish.com');")
	cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

	return redirect('/')	