console.log("read app.js");

var appDependencies = ['ui.bootstrap'];

var app = angular.module('app', appDependencies);

function ContentController($scope, $http) {
	
	
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
	
	// on page load
	var state = getParameterByName('state');
	var course_id = getParameterByName('course');
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


angular.module('app').controller('ContentController', ContentController); 