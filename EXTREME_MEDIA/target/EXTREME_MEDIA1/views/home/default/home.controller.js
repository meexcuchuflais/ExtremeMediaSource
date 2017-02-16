(function() {
    'use strict';

    app.register.controller('HomeControllerDefault', HomeControllerDefault);

    HomeControllerDefault.$inject = ['$scope', '$state', '$http','$rootScope','$sessionStorage'];

    function HomeControllerDefault ($scope, $state, $http,$rootScope,$sessionStorage) {

        $scope.account = null;
        $scope.isAuthenticated = null;
        $scope.$on('authenticationSuccess', function() {
            getAccount();
        });
        $scope.workAreaLeftStyle = {
            'overflow': 'auto',
            '-webkit-overflow-scrolling': 'touch'
        };
        $scope.pageTabsleftStyle = {};
        $scope.pageTabsleftStyle = {
            left: '1px'
        };
        $scope.workAreaLeftStyle.left = '1px';
        $scope.test = test;
        $scope.setView=setView;
        $scope.loadMenus=loadMenus;
        $scope.setParentMenuItem=setParentMenuItem;
        $rootScope.showLogoutSection = true;
        $rootScope.showPagesFooter = true;

        //Verifico si en session storage existe el url de la pagina de inicio
        var sscnfDa=cobis.userContext.getValue("configData");
        setView(null,sscnfDa.urlHome);
        $rootScope.defaultTheme=sscnfDa.theme;



        function test(){
            var data = {
                userName: 'augusto',
                password: 'augusto'
            };
            return $http.post('${contextPath}/internetbanking/resources/api/test', data);

        }
        loadMenus();


        function logOut () {
            $state.go('login');
        }
        function setView(menuItem, ibContainerUrl) {
            var frame = $('#mainIframe')[0];
            //alert(frame.contentWindow);
            frame.contentWindow.location.replace(ibContainerUrl);
            /*var url = '';
             $scope.shellTab={'url':ibContainerUrl,'isTranslated':'true','name':'Tab Uno'};
             $scope.currentTab=$scope.shellTab;*/
            //$rootScope.actualLocation='/home';


        };

        function loadMenus () {

            var jsonHome = new Object();
            jsonHome.name = "Home";
            jsonHome.url = "#/home";

            var jsonMenusTree = new Object();
            jsonMenusTree.name = "";
            jsonMenusTree.url = "";
            jsonMenusTree.children = [];

            $.ajax({
                url: "${contextPath}/cobis/web/mocks/menu/all.json",
                type: "GET",
                contentType: 'application/json',
                success: function (result) {
                    var result = JSON.parse(result);
                    if (result.result && result.data) {
                        jsonMenusTree.children = result.data.listUserDto;
                    } else {
                        console.log('ERROR IN LOAD MENU CONTEXT')

                    }
                },
                async: false
            });

            var pluginArrayArg = new Array();
            pluginArrayArg.push(jsonHome);
            pluginArrayArg.push(jsonMenusTree);

            $rootScope.collectionMenus = pluginArrayArg[1];
        };
        function setParentMenuItem (menuItem) {
            $rootScope.parentMenuItem = menuItem;
        };

    }
})();
