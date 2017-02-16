(function () {
    'use strict';

    /*  angular
          .module('internetBanking')
          .controller('LoginController', LoginController);*/
    app.register.controller('cobis-cwc-container', LoginControllerDesvio);

    LoginControllerDesvio.$inject = ['$rootScope', '$state', '$timeout', '$scope', 'Auth'];

    function LoginControllerDesvio($rootScope, $state, $timeout, $scope, Auth) {
        //var vm = this;
        //console.log('ESTOY AQUI ELOGIN CONTROLLER');
        $scope.authenticationError = false;
        $scope.cancel = cancel;
        $scope.credentials = {};
        $scope.login = login;
        $scope.password = null;
        $scope.rememberMe = true;
        $scope.username = null;
        
        //Loading test
        cobis.showMessageWindow.loading(true);

        $timeout(function () {
            angular.element('#username').focus();
        });
        
        //Loading test
        $timeout(function () {
            cobis.showMessageWindow.loading(false);
        }, 1000);
    }
})();