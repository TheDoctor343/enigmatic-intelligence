console.log("read app.js");

var appDependencies = ['ui.bootstrap'];

var app = angular.module('app', appDependencies);

function check_auth(status_code, $rootScope) {
	if (status_code === 401) {  // Not logged in
		swal({   title: "You are not logged in",   text: "You will be redirected to login with your Google Account",   type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",   confirmButtonText: "Login",   cancelButtonText: "Cancel",   closeOnConfirm: false,   closeOnCancel: false }, function(isConfirm){   if (isConfirm) {    window.location.replace("/login")   } else {     swal("Not Logged In", "You are not logged in", "error");   } });

	} else if (status_code === 403) { // Not Admin
		swal({   title: "No Permission!",   text: "The Action Requires Admin Privileges",   type: "error",   showConfirmButton: true });
	}
}

function ContentController($scope, $http, $rootScope) {
	
	/* Dict of allowed states */
	var STATES = {
		home: true,
		search_course: true,
		view_course: true
	}
	
	$rootScope.user = "wesley";
	$rootScope.admin = false;
	$rootScope.logged_in = true;
	
	$scope.classes = [
	{
		id: 0,
		department: "CSE",
		number: 3901,
		name: "Web Apps",
		easiness: 5,
		recommend: 6,
		interest: 2,
		ratings: [
			{
				easiness: 6,
				recommend: 7,
				interest: 5,
				professor: "Bucci",
				comment: "Better than Yo",
				book: "None",
				likes: 5,
				dislikes: 1
			}
		]
	},
	{
		id: 0,
		department: "CSE",
		number: 3902,
		name: "Game"
	},
	];
	
	// Change what 'page' we are on
	$scope.change_state = function (state, data) {
		console.log(state);
		console.log(data);
		var stateObj = { page: state, data: data}
		var url = '?state='+state;
		if (data !== undefined) {
			url += "&course="+data
			getCourse(data); // get Course
		}
		history.pushState(stateObj, "CLASSR", url)
		$scope.state = state;
	}
	
	function getCourse(course_id) {
		$scope.course = $scope.classes[0];
	}
	
	// Make the back and forward buttons work
	window.onpopstate = function (event) {
		console.log(event.state);
		$scope.state = event.state.page;
		console.log($scope.state);
		
		if (event.state.data) {
			
		}
		$scope.$apply();  // this is necessary for angular to update the view
	}
	
	function getParameterByName(name) { //found on SO
		var url = window.location.href;
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return undefined;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	
	/* on page load */
	var state = getParameterByName('state');
	var course_id = getParameterByName('course');
	if (state == undefined) {
		state = "home";
	}
	if (!(state in STATES)) {
		state = "home";
	}
	console.log(state);
	console.log(course_id)
	$scope.change_state(state, course_id);
	
	
	
	// var config = {
		// method : "get",
		// url : '/university/list_courses',
	// }
	// $http(config).success(function(data, response, headers) {
// 		
	// }

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
	
	$scope.go_search = function () {
		console.log("search_course");
		$scope.change_state('search_course');
	}
	
	$scope.go_home = function () {
		console.log("home");
		$scope.change_state('home');
	}

	$scope.make_percent = function (val) {
		var width = val*10 +"%"
		return {
			width: width
		}
	}

	$scope.course_search = function() {
		$scope.courses = $scope.classes.filter(filter_courses);
	}
	
	$scope.view_course = function (course_id) {
		$scope.change_state('view_course', course_id);
	}
}


function RatingModalController($scope, $http) {
	
}

function CourseModalController($scope, $http) {
	
	$scope.submit_course = function () {
		
		if ($scope.name && $scope.dept && $scope.number) {
			
		
		var config = {
			method: 'post',
			url: '/university/list_courses',
			data: {
				university: "The Ohio State University",
				department: $scope.dept,
				number: $scope.number,
				name: $scope.name
			}
		}
		
		$http(config).success(function (data, response, headers) {
			// Clear fields 
			$scope.name = "";
			$scope.dept = "";
			$scope.number = undefined;
			$("#courseModal").modal('hide');  //hide modal (using jQuery)
		}).error(function (data, status, headers) {
			
		});
		
		}
	}
	
}

angular.module('app').controller('CourseModalController', CourseModalController);
angular.module('app').controller('RatingModalController', RatingModalController);
angular.module('app').controller('ContentController', ContentController); 

