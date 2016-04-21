"""
Data-Store Models
and a couple things to basically automatically create an API from a Model
"""
from google.appengine.ext import ndb
import datetime
import json
import logging

def university_key(name):
	return ndb.Key("University", name)

def course_id(dept, number):
	return dept+str(number)
	
def course_key(key_id):
	return ndb.Key("Course", key_id)

def can_cache_courses_key():
	"""Only one key"""
	return ndb.Key("CanCache", 1)


class CanCache(ndb.Model):
	""" Super brilliant Idea: Course list will change very infrequently, so store the date it was last updated.
	If it wasn't updated, then list is cached client side.
	"""
	updated_at = ndb.DateTimeProperty(auto_now=True)


class University(ndb.Model):
	"""Model for College/Universities"""
	full_name = ndb.StringProperty(required=True)
	abbrev = ndb.StringProperty(required=True)
	city = ndb.StringProperty()
	state = ndb.StringProperty()

	courses = ndb.KeyProperty(repeated=True)

	# Date-Time Properties
	created_at = ndb.DateTimeProperty(auto_now_add=True)
	updated_at = ndb.DateTimeProperty(auto_now=True)


class Course(ndb.Model):
	"""Model for Courses"""
	department = ndb.StringProperty()
	number = ndb.IntegerProperty()
	name = ndb.StringProperty(required=True)

	ratings = ndb.KeyProperty(repeated=True)

	# List of emails so that user can only rate once
	raters = ndb.StringProperty(repeated=True)

	# Date-Time Properties
	created_at = ndb.DateTimeProperty(auto_now_add=True)
	updated_at = ndb.DateTimeProperty(auto_now=True)


class Rating(ndb.Model):
	"""Model for Ratings"""
	easiness = ndb.IntegerProperty(required=True)
	recommend = ndb.IntegerProperty(required=True)
	interesting = ndb.IntegerProperty(required=True)

	grade = ndb.IntegerProperty()

	professor = ndb.StringProperty()
	comment = ndb.StringProperty()
	book = ndb.StringProperty();

	user_email = ndb.StringProperty()

	# list of user's emails => safe hacking/trouble
	likes = ndb.StringProperty(repeated=True)
	dislikes = ndb.StringProperty(repeated=True)

	# Date-Time Properties
	created_at = ndb.DateTimeProperty(auto_now_add=True)
	updated_at = ndb.DateTimeProperty(auto_now=True)



def encode_to_dict(obj):
	"""Encode a data-store model to a dictionary"""
	result = {}

	for attr in dir(obj):
		if not attr.startswith("_") and not callable(getattr(obj,attr)):
			value = getattr(obj, attr)
			if isinstance(value, datetime.datetime):
				value = encode_date_time(value)
			elif isinstance(value, ndb.key.Key):
				value = dict(kind=value.kind(), id=value.id())
			result[attr] = value

	return result


def encode_date_time(dt_obj):
	result = {}

	# get attributes, but only the int ones
	for attr in dir(dt_obj):
		if not attr.startswith("_") and not callable(getattr(dt_obj, attr)):
			value = getattr(dt_obj, attr)
			if isinstance(value, int):
				result[attr] = value

	return result

def prepare_body(obj, key_method):
	"""Takes a decoded JSON object and prepares it for the data-store"""
	for key in obj:
		val = obj[key]
		if isinstance(val, dict):
			if val.get('kind'): # is a key
				val = key_method(kind=val['kind'], ID=val['id'], body=None)
			elif val.get('year'): # is a date-time
				val = datetime.datetime(**val)
	return obj
        	


def API_GET(model_type, key_method, request, kind):
	"""One annoyance: for get: use key=id"""
	result_list = []

	if len(request.params) == 0: # no params, so return all stored objects -> "list mode"
		qry = model_type.query()
		for model in qry.iter():
				result_list.append(encode_to_dict(model))

	else:

		for param in request.params:
			if param == 'key':
				key = key_method(KIND=kind, ID=request.get("key"), BODY=None)
				result_list.append(encode_to_dict(key.get()))
			else:
				qry = model_type.query(getattr(model_type, param) == request.get(param))
				for model in qry.iter():
					result_list.append(encode_to_dict(model))

	#remove duplicates
	unique = []
	seen_id = {}
	for result in result_list:
		ID = result["key"]["id"]
		if not seen_id.get(ID):
			unique.append(result)
			seen_id[ID] = True


	return unique


def API_POST(model_type, key_method, request, kind):
	"""Return Success, Data
	Data is either an error message or the created key"""
	body = json.loads(request.body)

	#key = key_method(kind=kind, body=body, ID=None)

	#if key.get():
	#	return False, "Key already exists"
		# make new object in datastore
	body = prepare_body(obj=body, key_method=key_method)
	model = model_type(**body)

		#model.key = key
	model.put()

	return True, "key"


def API_PUT(model_type, key_method, request, kind):
	"""One pitfall: Whatever attribute defines the unique key CAN be changed by this method;
	these methods I'm creating put the responsibilty on the front end to ensure that
	bad things do not happen
	Return Success, MSg"""

	body = json.loads(request.body)

	if not body.get('key'):
		return False, "Required Arg Key not found"

	key = key_method(kind=body['key']['kind'], ID=body['key']['id'], body=None)

	model = key.get()

	if not model:
		return False, "Object Not Found in DB"
	else:
		del body['key']

		body = prepare_body(obj=body, key_method=key_method)

		for attr in body:
			setattr(model, attr, body[attr])

		model.put()

		return True, "Success"


def API_DELETE(model_type, key_method, request, kind):
	"Takes a 'key' in the query params"
	if request.get('key'):
		ID = request.get('key')

		key = key_method(kind=kind, ID=ID, body=None)

		key.delete()

		return True, "Successfully Deleted"
	else:
		return False, "Object not found"


"""For Now I'm not using Body"""
def Key_Method(kind, ID, body):
	if isinstance(ID, str):
		ID = int(str)
	if kind == 'Task':
		return ndb.Key('Task', ID)
	elif kind == 'Task_Entry':
		return ndb.Key('Task_Entry', ID)





		
