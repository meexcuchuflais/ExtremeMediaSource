(function() {
    'use strict';

    angular
        .module('extreme-media-gary')
        .factory('stateHandler', stateHandler);

    stateHandler.$inject = ['$rootScope', '$state', '$sessionStorage', '$window', 'VERSION'];

    function stateHandler($rootScope, $state, $sessionStorage, $window, VERSION) {
        return {
            initialize: initialize
        };

        function initialize() {
            $rootScope.VERSION = VERSION;
            console.log('VERSION',$rootScope.VERSION);
            
            
            
            var stateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams, fromState) {
            	 $rootScope.toState = toState;
                 $rootScope.toStateParams = toStateParams;
                 $rootScope.fromState = fromState;
                
                //console.log('INICIANDO STATES',$state);

                if (toState.external) {
                    event.preventDefault();
                    $window.open(toState.url, '_self');
                }
                if(angular.isUndefined($rootScope.isLogout)){
                    $rootScope.isLogout=false;
                }

                

            });

            var stateChangeSuccess = $rootScope.$on('$stateChangeSuccess',  function(event, toState, toParams, fromState, fromParams) {
                $rootScope.previousStatus = fromState.name;

                
                
                
            });

            $rootScope.$on('$destroy', function () {
                if(angular.isDefined(stateChangeStart) && stateChangeStart !== null){
                    stateChangeStart();
                }
                if(angular.isDefined(stateChangeSuccess) && stateChangeSuccess !== null){
                    stateChangeSuccess();
                }
            });
            
            
            
            
           
        }
    }
})();
