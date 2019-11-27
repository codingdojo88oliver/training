from django.db import models
from django.utils import timezone

# TO RUN MIGRATION IN TERMINAL:
# cd pythonapp/main
# python3 manage.py makemigrations && python3 manage.py migrate

class UserManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['username']) < 5:
				errors["username"] = "Username should be at least 5 characters"
			if len(postData['password']) < 8:
				errors["password"] = "Password should be at least 8 characters"
			if postData['password'] != postData['c_password']:
				errors["c_password"] = "Passwords do not match"
		except Exception as e:
			errors["message"] = "Unknown error"

		return errors

class QuoteManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['quoted_by']) < 5:
				errors["quoted_by"] = "Quoted By should be at least 5 characters"
			if len(postData['quote']) < 10:
				errors["quote"] = "Quote should be at least 10 characters"
		except Exception as e:
			errors["message"] = "Unknown error"

		return errors

class User(models.Model):
	class Meta:
		db_table = "users"

	use_in_migrations = True    
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	name = models.CharField('First Name', max_length=255, null=False)
	username = models.CharField(max_length=255, null=False)
	password = models.CharField('Password', max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = UserManager()

class Quote(models.Model):
	class Meta:
		db_table = "quotes"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="quotes", on_delete=models.PROTECT)
	quoted_by = models.CharField('Quoted By', max_length=255, null=False)
	quote = models.TextField()
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = QuoteManager()