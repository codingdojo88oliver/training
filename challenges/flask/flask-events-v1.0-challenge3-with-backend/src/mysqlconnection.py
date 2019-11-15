import pymysql.cursors
import os


class MySQLConnection:
	def __init__(self):
		connectionn = pymysql.connect(
			host = 'localhost',
			user = 'root',
			password = '',
			db = 'demo',
			charset = 'utf8mb4',
			cursorclass = pymysql.cursors.DictCursor,
			autocommit = True)
		self.connection = connectionn
	def query_db(self, query, data=None):
		with self.connection.cursor() as cursor:
			try:
				query = cursor.mogrify(query, data)
				print("Running Query:", query)

				executable = cursor.execute(query, data)
				if query.lower().find("insert") >= 0:
					# if the query is an insert, return the id of the last row, since that is the row we just added
					self.connection.commit()
					return cursor.lastrowid
				elif query.lower().find("select") >= 0:
					# if the query is a select, return everything that is fetched from the database
					# the result will be a list of dictionaries
					result = cursor.fetchall()
					return result
				else:
					# if the query is not an insert or a select, such as an update or delete, commit the changes
					# return nothing
					self.connection.commit()
			except Exception as e:
				# in case the query fails
				print("Something went wrong", e)
				return False

def connectToMySQL():
	return MySQLConnection()