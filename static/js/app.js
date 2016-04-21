console.log("read app.js");

var appDependencies = ['ui.bootstrap'];

var app = angular.module('app', appDependencies);

function ContentController($scope, $http) {
	
	// Change what 'page' we are on
	$scope.change_state = function (state) {
		var stateObj = { page: state}
		history.pushState(stateObj, "CLASSR", '?state='+state)
		$scope.state = state;
	}
	
	// Make the back and forward buttons work
	window.onpopstate = function (event) {
		console.log(event.state);
		$scope.state = event.state.page;
		console.log($scope.state);
		$scope.$apply();  // this is necessary for angular to update the view
	}
	
	// initially
	$scope.change_state('home');
	


	$scope.classes = [
	{
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
		department: "CSE",
		number: 3902,
		name: "Game"
	},
	];
	
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
	
	$scope.view_course = function (course) {
		$scope.change_state('view_course');
		$scope.course = course;
	}
}


angular.module('app').controller('ContentController', ContentController); 