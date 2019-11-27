from django.db import models
from django.utils import timezone
import datetime

# TO RUN MIGRATION IN TERMINAL:
# cd pythonapp/main
# python3 manage.py makemigrations && python3 manage.py migrate

class UserManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['name']) < 5:
				errors["name"] = "Name should be at least 5 characters"
			if len(postData['password']) < 8:
				errors["password"] = "Password should be at least 8 characters"
			if postData['password'] != postData['c_password']:
				errors["c_password"] = "Passwords do not match"
		except Exception as e:
			errors["message"] = "Unknown error"

		return errors

class EventManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		today = datetime.date.today()
		try:
			if len(postData['name']) < 5:
				errors["name"] = "Event name should be at least 5 characters"
			if datetime.datetime.strptime(postData['date'], "%Y-%m-%d").date() < today:
				errors["date"] = "Date should be future-dated"
			if len(postData['location']) < 5:
				errors["location"] = "Location should be at least 5 characters"
			if len(postData['description']) < 10:
				errors["description"] = "Description should be at least 10 characters"
		except Exception as e:
			print(e)
			errors["message"] = "Unknown error"

		return errors

class User(models.Model):
	class Meta:
		db_table = "users"

	use_in_migrations = True    
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	name = models.CharField('First Name', max_length=255, null=False)
	email = models.EmailField('Email', max_length=255, null=False)
	password = models.CharField('Password', max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = UserManager()

class Event(models.Model):
	class Meta:
		db_table = "events"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="events", on_delete=models.PROTECT)
	name = models.CharField('Event Name', max_length=255, null=False)
	date = models.DateTimeField(default=timezone.now)
	location = models.CharField('Location', max_length=255, null=False)
	description = models.TextField()
	max_attendees = models.IntegerField()
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = EventManager()