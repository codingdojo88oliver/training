from django.db import models
from django.utils import timezone

# TO RUN MIGRATION IN TERMINAL:
# cd pythonapp/main
# python3 manage.py makemigrations && python3 manage.py migrate

class UserManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['first_name']) < 2:
				errors["first_name"] = "First name should be at least 2 characters"
			if len(postData['last_name']) < 2:
				errors["last_name"] = "Last name should be at least 2 characters"
			if len(postData['password']) < 6:
				errors["password"] = "Password should be at least 6 characters"
			if postData['password'] != postData['c_password']:
				errors["c_password"] = "Passwords do not match"
			if 'email' not in postData:
				errors["email"] = "Email Address is required"
		except Exception as e:
			errors["message"] = "Unknown error"

		return errors

class User(models.Model):
	class Meta:
		db_table = "users"

	use_in_migrations = True    
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	first_name = models.CharField('First Name', max_length=255, null=False)
	last_name = models.CharField('Last Name', max_length=255, null=False)
	email = models.EmailField(max_length=255, null=False)
	password = models.CharField('Password', max_length=255)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = UserManager()

class ProductManager(models.Manager):
	def basic_validator(self, postData):
		errors = {}
		try:
			if len(postData['name']) < 5:
				errors["name"] = "Product Name should be at least 5 characters"
			if float(postData['price']) < 1:
				errors["price"] = "Price should be at least $1"
			if len(postData['description']) == 0:
				errors["description"] = "Description should not be empty"
			if len(postData['description']) > 100:
				errors["description"] = "Description should not exceed 100 characters"
		except Exception as e:
			errors["message"] = "Unknown error"
			
		return errors

class Product(models.Model):
	class Meta:
		db_table = "products"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	user = models.ForeignKey(User, related_name="user_products", on_delete=models.PROTECT)
	category = models.CharField(max_length=255)
	name = models.CharField(max_length=255)
	price = models.FloatField()
	description = models.TextField()
	status = models.CharField(max_length=50, default="Available")
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)
	objects = ProductManager()

class Transaction(models.Model):
	class Meta:
		db_table = "transactions"

	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	product = models.ForeignKey(Product, related_name="product_transactions", on_delete=models.PROTECT)
	buyer = models.ForeignKey(User, related_name="purchases", on_delete=models.PROTECT)
	price = models.FloatField()
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)

class Negotiation(models.Model):
	class Meta:
		db_table = "negotiations"
		
	use_in_migrations = True
	id = models.AutoField(auto_created=True, null=False, primary_key=True)
	product = models.ForeignKey(Product, related_name="product_negotiation", on_delete=models.PROTECT)
	negotiator = models.ForeignKey(User, related_name="negotiations", on_delete=models.PROTECT)
	price = models.FloatField()
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(default=timezone.now)