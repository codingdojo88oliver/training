from django.db import models
from django.utils import timezone

# TO RUN MIGRATION IN TERMINAL:
# cd pythonapp/main
# python3 manage.py makemigrations && python3 manage.py migrate

class UserManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['name']) < 3:
				errors["name"] = "Name should be at least 3 characters"
			if len(postData['password']) < 6:
				errors["password"] = "Password should be at least 6 characters"
			if postData['password'] != postData['c_password']:
				errors["c_password"] = "Passwords do not match"
		except Exception as e:
			errors["message"] = "Unknown error"

		return errors

class TopicManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}	
		if 'title' not in postData:
			errors["title"] = "Title is required"
		else:
			if len(postData['title']) < 6:
				errors["title"] = "Title should be at least 6 characters"
		if 'description' not in postData:
			errors["description"] = "Description is required"
		else:
			if len(postData['description']) < 6:
				errors["description"] = "Description should be at least 6 characters"	

		return errors

class User(models.Model):
	class Meta:
		db_table = "users"

	use_in_migrations = True    
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	name = models.CharField('First Name', max_length=255, null=False)
	email = models.EmailField(max_length=255, null=False)
	password = models.CharField('Password', max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = UserManager()

class Topic(models.Model):
	class Meta:
		db_table = "topics"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	title = models.CharField('Title', max_length=255, null=False)
	description = models.TextField()
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	user = models.ForeignKey(User, related_name="user_topics", on_delete=models.PROTECT)
	objects = TopicManager()

class Argument(models.Model):
	class Meta:
		db_table = "arguments"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	stance = models.CharField('Stance', max_length=255, null=False)
	argument = models.CharField('Argument', max_length=255, null=False)
	topic = models.ForeignKey(Topic, related_name="topic_arguments", on_delete=models.PROTECT)
	user = models.ForeignKey(User, related_name="user_arguments", on_delete=models.PROTECT)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)