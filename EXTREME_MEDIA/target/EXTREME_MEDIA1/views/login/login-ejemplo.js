/**
 * 
 */

var PropertiesService = angular.module('LoginService', [])
PropertiesService.factory('LoginService', ['$http', function ($http) {

    var urlBase = 'http://192.168.83.175:9080/CTSProxy/services/resources/cobis/cwc/properties/properties';
    var PropertiesData = {};

    PropertiesData.getProperties = function () {
        return $http.get(urlBase);
    };
    return PropertiesData;
    

}]);