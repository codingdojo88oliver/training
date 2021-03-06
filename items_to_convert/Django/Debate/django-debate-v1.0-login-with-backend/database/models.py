from django.db import models
from django.utils import timezone

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

class User(models.Model):
	class Meta:
		db_table = "users"

	use_in_migrations = True    
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	name = models.CharField('First Name', max_length=255, null=False)
	email = models.EmailField(max_length=255, null=False)
	password = models.CharField('Password', max_length=255)
	country = models.CharField('Country', max_length=255, null=False)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = UserManager()