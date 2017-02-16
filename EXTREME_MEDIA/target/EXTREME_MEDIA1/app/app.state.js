(function() {
    'use strict';

    angular
        .module('extreme-media-gary')
        .config(stateConfig);

   stateConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

    function stateConfig($stateProvider, $urlRouterProvider) {
	     
        console.log('en app statessss');
        
        $urlRouterProvider.otherwise("/login");
        $stateProvider
            .state('login', {
                url: "/login",
               templateUrl: "../views/login/login.html"
            })
            .state('home', {
                url: "/home",
                templateUrl: "../views/home/fna/home.html",
            })
            .state('default', {
                url: "/default",
                templateUrl: "../views/login/default.html"
            }) 
        
    }    
        
})();

