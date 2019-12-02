from django.db import models
from django.utils import timezone

# TO RUN MIGRATION IN TERMINAL:
# cd pythonapp/main
# python3 manage.py makemigrations && python3 manage.py migrate

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

class PlaneManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['message']) < 6:
				errors["message"] = "Message should be at least 6 characters"
			if len(postData['message']) <= 0:
				errors["message"] = "Message is required"
		except Exception as e:
			errors["message"] = "Unknown error"
			
		return errors	

class Plane(models.Model):
	class Meta:
		db_table = "planes"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="planes", on_delete=models.PROTECT)
	message = models.TextField()
	status = models.CharField(max_length=55, default="Ready")
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = PlaneManager()