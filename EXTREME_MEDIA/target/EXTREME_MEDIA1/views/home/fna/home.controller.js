(function() {
    'use strict';
    
    angular
    .module('extreme-media-gary')
    .controller('HomeController', HomeController);

    //app.register.controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope','$scope'];
    
    

    function HomeController ($rootScope,$scope) {
    	
    	var initPage = '../views/init.html';
    	
        console.log('en home');
        function loadMenus() {

            var jsonHome = {
                    name: "Home",
                    url: "#/home"
                },
                jsonMenusTree = {
            		id:"",
                    name: "",
                    url: "",
                    children: []
                };
                

            $.ajax({
                url: '../mocks/menu/recargas.json',
                type: "GET",
                contentType: 'application/json',
                success: function (result) {
                	console.log('menuResult',result);
                	
                    var menuResult = JSON.stringify(result.data);
                    //console.log('menuPrueba',menuPrueba.MenuItems);
                    var menuPrueba=JSON.parse(menuResult);
                    console.log('menuPrueba',menuPrueba.MenuItems);
                    if (result.result) {
                        jsonMenusTree.children = menuPrueba.MenuItems;
                    } else {
                        console.log('ERROR IN LOAD MENU CONTEXT');

                    }
                },
                async: false
            });

            var pluginArrayArg = new Array();
        	pluginArrayArg.push(jsonHome);
        	pluginArrayArg.push(jsonMenusTree);
        	
        	console.log('array',pluginArrayArg);

        	$rootScope.collectionMenus = pluginArrayArg;
        }
        
        function setParentMenuItem(menuItem) {
    		$rootScope.parentMenuItem = menuItem;
    	}

    	function toggleMenuMain() {
    		$rootScope.isMenuMain = !$rootScope.isMenuMain;
    		setParentMenuItem(null);
    	}
    	
    	function isActive(item) {
			var posUrl, frame;
			frame = $('#mainIframe')[0];
			if (angular.isDefined(item)) {
				posUrl = item.url.indexOf("_TASK.html");
				if (posUrl !== -1) {
					return frame.contentWindow.location.href.indexOf(item.url.substring(0, posUrl)) !== -1;
				}
			}
			return false;
		}
    	
    	function setView(menuItem, ibContainerUrl) {
            var url = '',
                frame;

            document.getElementById("menu-main").children[1].style.top = "";
			document.getElementById("menu-main").children[1].style.transform = "";

			angular.element('#mainIframe').focus();
			
            if (typeof $rootScope.isMenuMain === 'undefined') {
                $rootScope.isMenuMain = false;
            }

            if (ibContainerUrl !== null) {
                url = ibContainerUrl;
            }
            if (menuItem !== null) {
                //url = $DESIGNER_VIEW_ROOT + menuItem.url;
            	url =  menuItem.url;
            }
            frame = $('#mainIframe')[0];
            frame.contentWindow.location.replace(url);
        }
    	/********************************* SCOPE *******************************************/
    	$scope.isAuthenticated = null;
		$scope.workAreaLeftStyle = {
			'overflow': 'auto',
			'-webkit-overflow-scrolling': 'touch'
		};
		$scope.pageTabsleftStyle = {};
		$scope.pageTabsleftStyle = {
			left: '1px'
		};
		$scope.workAreaLeftStyle.left = '1px';
		//$scope.test = test;
		$scope.setView = setView;
		$scope.isActive = isActive;
		$scope.loadMenus = loadMenus;
		$scope.setParentMenuItem = setParentMenuItem;
		//$scope.toggleMenuMain=toggleMenuMain;
		//$scope.logOut=logOut;
		$rootScope.showLogoutSection = true;
		$rootScope.showPagesFooter = true;
		$rootScope.isLogout = false;
		
		if (initPage === null) {
			initPage = servicePath.initPage;
		}
		if (initPage === null || initPage === undefined || initPage === "") {
			initPage = '../views/init.html';
		}
		setView(null, initPage);
		
		$rootScope.userInfo = {
				name: 'edison',
				lastAccess: 'new',
                fullName: 'edison moreta',
				userIp: '192.168.1.1'
			};
		
		loadMenus();

    	
    	
       
    }
})();
