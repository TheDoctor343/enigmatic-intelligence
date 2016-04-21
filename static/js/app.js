console.log("read app.js");

var appDependencies = ['ui.bootstrap'];

var app = angular.module('app', appDependencies);

function check_auth(status_code, $rootScope) {
	if (status_code === 401) {// Not logged in
		swal({
			title : "You are not logged in",
			text : "You will be redirected to login with your Google Account",
			type : "warning",
			showCancelButton : true,
			confirmButtonColor : "#DD6B55",
			confirmButtonText : "Login",
			cancelButtonText : "Cancel",
			closeOnConfirm : false,
			closeOnCancel : false
		}, function(isConfirm) {
			if (isConfirm) {
				window.location.replace("/login")
			} else {
				swal("Not Logged In", "You are not logged in", "error");
			}
		});
		$rootScope.logged_in = false;
	} else if (status_code === 403) {// Not Admin
		swal({
			title : "No Permission!",
			text : "The Action Requires Admin Privileges",
			type : "error",
			showConfirmButton : true
		});
		$rootScope.admin = false;
	}
}

function ContentController($scope, $http, $rootScope) {

	/* Dict of allowed states */
	var STATES = {
		home : true,
		search_course : true,
		view_course : true
	}

	// Change what 'page' we are on
	$scope.change_state = function(state, data) {
		console.log(state);
		console.log(data);
		var stateObj = {
			page : state,
			data : data
		}
		var url = '?state=' + state;
		if (state === "view_course" && data !== undefined) {
			url += "&course=" + data
			getCourse(data);
			// get Course
		} else if (state === "view_course" && !data) {
			// an error must have occurred - redirect home
			state = "home";
			url = '?state=' + state;
		}
		history.pushState(stateObj, "CLASSR", url)
		$scope.state = state;

		if (state == "search_course") {
			$rootScope.classes = [];
			listCourses()
		}
	}
	function getCourse(course_id) {
		/* Check Cache First */

		//TODO: CHECK

		var config = {
			method : 'get',
			url : '/course/rating',
			params : {
				course_id : course_id
			}
		}

		$http(config).success(function(data) {
			$scope.course = data

			$rootScope.user = data['user'];
			$rootScope.admin = data['admin'];

			if (data['user']) {
				$rootScope.logged_in = true;
			} else {
				$rootScope.logged_in = false;
			}

		}).error(function() {
			swal({
				title : "Sorry!",
				text : "Error: Could not find " + course_id,
				type : "error",
				showConfirmButton : true
			});
		});
	}

	function listCourses() {
		/* First Check cache */

		var cache = localStorage.getItem("classes");

		if (cache) {
			var config = {
				method : 'get',
				url : '/can_use_cache/courses',
			}

			$http(config).success(function(data) {
				$rootScope.user = data['user'];
				$rootScope.admin = data['admin'];
				
				var last_cache = new Date(localStorage.getItem('classes_cached'))
				if (!last_cache) {
					makeClassRequest();
					return;
				}
				var updated = data['updated_at'];
				
				/* For JS and Python do the month slightly differently */
				var tstring = (updated['month'])+"/"+(updated['day'])+"/"+updated['year']+" "+updated['hour']+":"+updated['minute']+":"+updated['second']+" UTC";
				var last_updated = new Date(tstring);
				//var date = new Date('6/29/2011 4:52:48 PM UTC');
				
				var time_diff = last_updated - last_cache;
				
				console.log(last_updated);
				console.log(last_cache);
				
				if (time_diff > 0) {
					console.log("Cache is stale");
					makeClassRequest();
				} else {
					console.log("Cache is still valid");
					$rootScope.classes = JSON.parse(cache);
				}
			}).error(function () {
				makeClassRequest();
			})
		} else {
			makeClassRequest();
		}

		function makeClassRequest() {
			
			console.log("requested class list");

			/* Get Class List */
			var config = {
				method : 'get',
				url : '/university/courses',
				params : {
					university : "The Ohio State University"
				}
			}

			$http(config).success(function(data) {
				$rootScope.classes = data['courses'];
				$rootScope.user = data['user'];
				$rootScope.admin = data['admin'];

				/* Add to Cache */
				localStorage.setItem('classes', JSON.stringify(data['courses']))
				localStorage.setItem('classes_cached', new Date());

				if (data['user']) {
					$rootScope.logged_in = true;
				} else {
					$rootScope.logged_in = false;
				}

			}).error(function() {
				swal({
					title : "Error!",
					text : "An Unknown Error Occurred",
					type : "error",
					showConfirmButton : true
				});

			});

		}

	}

	// Make the back and forward buttons work
	window.onpopstate = function(event) {
		console.log(event.state);
		$scope.state = event.state.page;
		console.log($scope.state);

		if (event.state.data) {

		}
		$scope.$apply();
		// this is necessary for angular to update the view
	}
	function getParameterByName(name) {//found on SO
		var url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		    results = regex.exec(url);
		if (!results)
			return undefined;
		if (!results[2])
			return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function init() {
		var state = getParameterByName('state');
		var course_id = getParameterByName('course');
		if (state == undefined) {
			state = "home";
		}
		if (!( state in STATES)) {
			state = "home";
		}
		console.log(state);
		console.log(course_id)
		$scope.change_state(state, course_id);
	}

	/* On Page Load */
	init();

	$scope.courses = [];

	function filter_courses(val) {
		searches = $scope.course_search_bar.split(" ");
		if ($scope.course_search_bar.length == 0) {
			return false;
		}
		var is_result = false;
		var matches = 0;
		for (var i = 0; i < searches.length; i = i + 1) {
			is_result = val.name.toLowerCase().includes(searches[i]) || String(val.number).toLowerCase().includes(searches[i]) || val.department.toLowerCase().includes(searches[i])
			if (is_result) {
				matches += 1;
			}
		}
		if (matches == searches.length) {
			return true;
		} else {
			return false;
		}
	}


	$scope.go_search = function() {
		console.log("search_course");
		$scope.change_state('search_course');
	}

	$scope.go_home = function() {
		console.log("home");
		$scope.change_state('home');
	}

	$scope.make_percent = function(val) {
		var width = val * 10 + "%"
		return {
			width : width
		}
	}

	$scope.course_search = function() {
		$scope.courses = $rootScope.classes.filter(filter_courses);
	}

	$scope.view_course = function(course_id) {
		$scope.change_state('view_course', course_id);
	}
}

function RatingModalController($scope, $http) {

}

function CourseModalController($scope, $http, $rootScope) {
	console.log("Course Modal Controller Active");

	$scope.submit_course = function() {
		console.log("submit");

		if ($scope.new_course.name && $scope.new_course.dept && $scope.new_course.number) {

			var config = {
				method : 'post',
				url : '/university/courses',
				data : {
					university : "The Ohio State University",
					department : $scope.new_course.dept.toUpperCase(),
					number : $scope.new_course.number,
					name : $scope.new_course.name
				}
			}

			$http(config).success(function(data, response, headers) {
				/* Add to class list so that we don't have to refresh the page */
				var new_course = {
					department : $scope.new_course.dept.toUpperCase(),
					number : $scope.new_course.number,
					name : $scope.new_course.name,
					id : $scope.new_course.dept.toUpperCase() + $scope.new_course.number
				}

				$rootScope.classes.push(new_course);

				// Clear fields
				$scope.new_course.name = "";
				$scope.new_course.dept = "";
				$scope.new_course.number = undefined;
				$("#courseModal").modal('hide');
				//hide modal (using jQuery)
			}).error(function(data, status, headers) {
				check_auth(status, $rootScope);
				if (status == 409) {// conflict
					swal({
						title : "Conflict!",
						text : "Course Already Exists",
						type : "error",
						showConfirmButton : true
					});

				}
			});

		}
	}
}


angular.module('app').controller('CourseModalController', CourseModalController);
angular.module('app').controller('RatingModalController', RatingModalController);
angular.module('app').controller('ContentController', ContentController);

