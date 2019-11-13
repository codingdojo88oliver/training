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

# for database table that will store stamps, make sure that there is a plane_id column
class Stamp(models.Model):
	class Meta:
		db_table = "stamps"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	country = models.CharField(max_length=25)
	plane = models.ForeignKey(Plane, related_name="stamps", on_delete=models.PROTECT)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)

class Message(models.Model):
	class Meta:
		db_table = "messages"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	receiver = models.ForeignKey(User, related_name="user_messages", on_delete=models.PROTECT)
	plane = models.ForeignKey(Plane, related_name="messages", on_delete=models.PROTECT)
	status = models.CharField(max_length=55, default="Unread")
	updated_at = models.DateTimeField(auto_now=True)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)	