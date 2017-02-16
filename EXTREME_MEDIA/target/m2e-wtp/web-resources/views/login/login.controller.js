(function () {
	'use strict';

	angular
		.module('extreme-media-gary')
		.controller('LoginController', LoginController);
	//app.register.controller('LoginController', LoginController);

	LoginController.$inject = ['$location', 'AuthenticationService'];

	function LoginController($location, AuthenticationService) {

		var vm = this;

		vm.login = login;


		console.log('hola desde login controller');

		(function initController() {
			// reset login status
			//AuthenticationService.ClearCredentials();
		})();


		function login() {
			//username:$scope.username,
			//password:$scope.password

			console.log('TRATANDO DE LOGEAR');
			vm.dataLoading = true;
			AuthenticationService.Login(vm.username, vm.password, function (response) {
				
				console.log('response',response);
				if (response.success) {
					//AuthenticationService.SetCredentials(vm.username, vm.password);
					$location.path('/'+response.nextStep);
					//$state.go('home');
					console.log('paso state');
					
					
				} else {
					FlashService.Error(response.message);
					vm.dataLoading = false;
				}
			});

		}


	}
})();