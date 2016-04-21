import webapp2
import models
from google.appengine.api import users
import json
import logging


def login_required(handler_method):


    def wrapper(self, *args, **kwargs):

        user = users.get_current_user()

        if user:

            # Google login

            handler_method(self, *args, **kwargs)

        else:

            self.response.set_status(401)



    return wrapper


def key_obj(key):
    return dict(kind=key.kind(), id=key.id())


class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'

        user = users.get_current_user()

        if user:
            self.redirect('/static/index.html#/')
        else:
            self.redirect(users.create_login_url(self.request.uri))


class GetUser(webapp2.RequestHandler):
    @login_required
    def get(self):

        user = users.get_current_user()

        obj = dict(email=user.email(), nickname=user.nickname())

        self.response.content_type = 'application/json'

        self.response.out.write(json.dumps(obj))

class UniversityRequest(webapp2.RequestHandler):
    def get(self):
        """ List all Universities for Search """

        qry = models.University.query()

        obj = []
        data = {}

        for uni in qry.iter():
            uni_json = dict(full_name=uni.full_name, abbrev=uni.abbrev, city=uni.city, state=uni.state)
            obj.append(uni_json)

        user = users.get_current_user()
        data['user'] = user.email() if user else None

        data['universities'] = obj
        self.response.content_type = 'application/json'
        self.response.out.write(json.dumps(data))

    @login_required
    def post(self):
        """ Create a University """
        body = json.loads(self.request.body)
        university = models.University()

        university.full_name = body['full_name']
        university.abbrev = body['abbrev']
        university.city = body['city']
        university.state = body['state']

        key = models.university_key(body['full_name'])

        if key.get():
            self.abort(409, detail="University already exists")  # 409: Conflict, already exists
        else:
            university.key = key
            university.put()

            self.response.set_status(201) # 201: Entity Created 



class CourseRequest(webapp2.RequestHandler):
    def get(self):
        """ List all Courses for a University """
        logging.info(self.request.params)
        
        university_key = models.university_key(self.request.get("university"))

        university = university_key.get()

        if not university:
            pass

        obj = []

        user = users.get_current_user()
        data = {}
        data['user'] = user.email() if user else None

        for course_key in university.courses:
            course = course_key.get()
            course_json = dict(department=course.department, number=course.number, name=course.name, id=course.key.id)
            obj.append(course_json)

        data['courses'] = obj

        self.response.content_type = 'application/json'
        self.response.out.write(json.dumps(data))

    @login_required
    def post(self):
        """ Create a Course """
        body = json.loads(self.request.body)

        university = models.university_key(body['university']).get()
        if not university:
            pass #TODO: Error

        course = Course()
        course.department = body['department']
        course.number = body['number']
        course.name = body['name']

        course_key = models.course_key(course_id(dept=body['department'], number=body['number']))

        university.courses.append(course_key)

        if course_key.get():
            self.abort(409, detail="Course already exists") # 409: Conflict
        else:
            course.key = course_key
            course.put()
            university.put()
            self.response.set_status(201) # 201: Entity Created


class RatingRequest(webapp2.RequestHandler):
    def get(self):
        """ List all Ratings for a Course and the Course """
        course_id = self.request.get("course_id")

        course = models.course_key(course_id).get()

        if not course:
            pass # TODO: Error

        ratings = []
        easiness = 0
        recommend = 0
        interesting = 0
        grade = 0    # grade is optional
        grades = 0

        user = users.get_current_user()
        obj['user'] = user.email() if user else None

        for rating_key in course.ratings:
            rating = rating_key.get()
            easiness += rating.easiness
            interesting += rating.interesting
            recommend += rating.recommend
            if rating.grade:
                grades += 1
                grade += rating.grade
            rating_json = dict(id=rating.key.id(), easiness=rating.easiness, recommend=rating.recommend, interesting=rating.interesting, grade=rating.grade, book=rating.book, professor=rating.professor, comment=rating.comment, likes=len(rating.likes), dislikes=len(rating.dislikes), liked_this=False, disliked_this=False)
            
            if user:
                if user.email() in rating.likes:
                    rating_json['liked_this'] = True
                if user.email() in rating.dislikes:
                    rating_json['disliked_this'] = True

            ratings.append(rating_json)

        easiness = easiness/len(course.ratings)
        recommend = recommend/len(course.ratings)
        interesting = interesting/len(course.ratings)
        grade = grade/grades
        obj = dict(department=course.department, number=course.number, name=course.name, easiness=easiness, interesting=interesting, recommend=recommend, raters=course.raters)
        obj['ratings'] = ratings

        self.response.content_type = 'application/json'
        self.response.out.write(json.dumps(obj))

    @login_required
    def post(self):
        """ Create Rating """
        body = json.loads(self.request.body)

        course = models.course_key(body['course']).get()

        if not course:
            self.abort(400, detail="course not found")

        rating = Rating()
        rating.easiness = body['easiness']
        rating.recommend = body['recommend']
        rating.interesting = body['interesting']

        rating.grade = body['grade'] if body.get('grade') else None

        rating.professor = body['professor']
        rating.comment = body['comment']
        rating.book = body['book']

        user = users.get_current_user()

        rating.user_email = user.email()

        rating_key = rating.put()

        # modify course
        course.ratings.append(rating_key)
        course.raters.append(user.email())

        course.put()

        self.response.set_status(201)


    @login_required
    def put(self):
        """ Update a rating -- only for likes for now """
        body = json.loads(self.request.body)
        rating_key = ndb.key("Rating". body['rating'])
        rating = rating_key.get()

        user = users.get_current_user()
        email = user.email()

        if email in rating.likes or email in rating.dislikes:  # user has already liked/disliked
            if body.get('liked_this') and email not in rating.likes:
            	rating.likes.append(email)
            	rating.dislikes.remove(email)
            if body.get('disliked_this') and email not in rating.dislikes:
            	rating.dislikes.append(email)
            	rating.likes.remove(email)
        else:
        	if body.get("liked_this") and not body.get("disliked_this"):
        		rating.likes.append(email)
        	if body.get("disliked_this") and not body.get("liked_this"):
        		rating.dislikes.append(email)


class DoStuffForDebug(webapp2.RequestHandler):
    """Its useful for me to have a URL like this during Development"""
    def get(self):
        pass
        # Route for debug
        self.response.out.write("Success!")

class Logout(webapp2.RequestHandler):
    def get(self):
        self.redirect(users.create_logout_url('/'))



app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/university', UniversityRequest),
    ('/university/list_courses', CourseRequest),
    ('/course/rating', RatingRequest),
    ('/dostuff', DoStuffForDebug),
    ('/logout', Logout)
], debug=True)