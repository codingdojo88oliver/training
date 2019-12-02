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
			if 'country' not in postData:
				errors["language"] = "Country is required"
			if 'interests' not in postData:
				errors["interests"] = "Should select at least 1 interest"
			if 'language' not in postData:
				errors["language"] = "Should select at least 1 language"
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

class Interest(models.Model):
	class Meta:
		db_table = "interests"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="interests", on_delete=models.PROTECT)
	interest = models.CharField(max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)

class Language(models.Model):
	class Meta:
		db_table = "languages"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="languages", on_delete=models.PROTECT)
	language = models.CharField(max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)