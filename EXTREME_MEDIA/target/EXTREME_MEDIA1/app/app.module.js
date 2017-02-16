(function() {
	'use strict';

	angular.module('extreme-media-gary', [ 'ngRoute', 'ngCookies' ]).config(
			config).run(run);

	run.$inject = [ '$rootScope', '$location', '$http', '$cookies' ];
	config.$inject = [ '$routeProvider', '$locationProvider', '$httpProvider' ];

	function run($rootScope, $location, $http, $cookies) {
		$http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;

		// console.log('iniciamos', $state);
		// stateHandler.initialize();
	}
	;

	function config($routeProvider, $locationProvider, $httpProvider) {
		$httpProvider.defaults.withCredentials = true;

		console.log("states");
		$routeProvider
		.when('/home', {
			controller : 'HomeController',
			templateUrl : '../views/home/fna/home.html',
			controllerAs : 'vm'
		}).when('/login', {
			controller : 'LoginController',
			templateUrl : '../views/login/login.html',
			controllerAs : 'vm'
		}).otherwise({
			redirectTo : '/login'
		});
	}

})();