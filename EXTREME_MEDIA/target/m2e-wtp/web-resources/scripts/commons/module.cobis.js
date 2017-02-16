/*global console, top, self */
/*jslint eqeq: true, nomen: true*/
(function (angular, kendo, $, kiui, cobis) {
    'use strict';
    var app = cobis.createModule(cobis.modules.CONTAINER, ["ui.bootstrap", "ngCookies"]);

    app.config(["$httpProvider",
        function ($httpProvider) {
            // ESA: fix REST respponses saved in cache.
            // initialize get if not there
            if (!$httpProvider.defaults.headers.get) {
                $httpProvider.defaults.headers.get = {};
            }
            // disable IE ajax request caching
            $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
            $httpProvider.interceptors.push('cobisHttpInterceptor');
        }]);

    app.factory('cobisHttpInterceptor', ["$q", "$timeout",
        function ($q, $timeout) {
            var interceptor = {
                'request': function (config) {
                    if (config.url.indexOf("${contextPath}/resources/") > -1) {
                        config.restUrl = true;
                        if (!config.method) {
                            config.method = "PUT";
                        }
                        if (config.params) {
                            if (!config.params.hasOwnProperty("returnOnlyData")) {
                                config.params.returnOnlyData = true;
                            }
                            if (!config.params.hasOwnProperty("exceptionHandling")) {
                                config.params.exceptionHandling = true;
                            }
                        } else {
                            config.params = {
                                returnOnlyData: true,
                                exceptionHandling: true
                            };
                        }
                    } else {
                        config.restUrl = false;
                        if (config.url.indexOf("${contextPath}/cobis/web/assets/languages/") > -1) {
                            if (config.params) {
                                if (!config.params.hasOwnProperty("returnOnlyData")) {
                                    config.params.returnOnlyData = true;
                                }
                                if (!config.params.hasOwnProperty("exceptionHandling")) {
                                    config.params.exceptionHandling = true;
                                }
                            } else {
                                config.params = {
                                    returnOnlyData: true,
                                    exceptionHandling: true
                                };
                            }
                        }
                    }
                    return config;
                },
                'response': function (response) {
                    var data = response.data,
                        messages;
                    if (response.config.restUrl && data) {
                        if (data.hasOwnProperty("sucess")) {
                            response.data.result = data.sucess;
                        } else if (data.hasOwnProperty("success")) {
                            response.data.result = data.success;
                        }
                        if (!response.data.result) {
                            messages = data.messages;
                            if (messages[0] && messages[0].code == 80103) {
                                if (top.location == self.location) {
                                    $('#lockscreen').show();
                                } else {
                                    window.parent.$('#lockscreen').show();
                                }
                                return $q.reject(response);
                            } else if (response.config.params.exceptionHandling) {
                                cobis.getMessageManager().showMessagesError(messages);
                                return $q.reject(response);
                            }
                        }
                        if (response.config.params.returnOnlyData) {
                            response.data = data.data;
                        } else {
                            response.data = data;
                        }
                    }
                    return response;
                },
                'requestError': function (rejection) {
                    if (rejection.config.params.exceptionHandling) {
                        cobis.getMessageManager().showMessagesError(rejection.statusText);
                    } else {
                        throw new cobis.CobisException(rejection.statusText);
                    }
                    return $q.reject(rejection);
                },
                'responseError': function (rejection) {
                    var message = rejection.statusText,
                        resourceParts,
                        resourceName;
                    if (angular.isDefined(rejection.config.params) && rejection.config.params.exceptionHandling) {
                        if (rejection.config.url && rejection.config.url.indexOf("${contextPath}/cobis/web/assets/languages/") > -1 && rejection.status == 404) {
                            resourceParts = rejection.config.url.split('/');
                            resourceName = resourceParts[resourceParts.length - 1];
                            $timeout(function () {
                                message = cobis.translate("COMMONS.CONTAINER.MSG_NOT_FOUND_LANGUAGE_RESOURCE") + ': ' + resourceName;
                                cobis.getMessageManager().showMessagesError(message);
                            }, 100);
                        }
                    } else {
                        if (rejection.status === 0 && rejection.data === null && rejection.statusText === '') {
                            $timeout(function () {
                                message = cobis.translate("COMMONS.CONTAINER.MSG_NETWORK_UNAVAILABLE");
                                cobis.getMessageManager().showMessagesError(message);
                            }, 100);
                        } else {
                            throw new cobis.CobisException(rejection.statusText);
                        }
                    }

                    if (rejection.config.url.indexOf("${contextPath}/cobis/web/assets/languages/") > -1) {
                        return {
                            data: {}
                        };
                    } else {
                        if (rejection.status === 0 && rejection.data === null && rejection.statusText === '') {
							$timeout(function () {
                                message = cobis.translate("COMMONS.CONTAINER.MSG_NETWORK_UNAVAILABLE");
                                cobis.getMessageManager().showMessagesError(message);
                            }, 100);
						} else {
							return $q.reject(rejection);
						}
                    }
                }
            };
            return interceptor;
        }]);

    /*
    The object structure example for report is
    For report on tab
    --------------------------------------------------
    var reportConfiguration = {
        module: 'cte',
        name: 'MoventsAccountClientFilter',
        title: 'Report on Tab',
        parameters : {
            dato1: $scope.dato1,
            dato2: $scope.dato2,
            dato3: 'juan alvarez'
        }
     };
     --------------------------------------------------
    For report on Poppup
    --------------------------------------------------
    var reportConfiguration = {
            module: 'cte',
            name: 'MoventsAccountClientFilter',
            title: 'Report on Tab',
            screen: {
                height: 500,
                width: 500
            },
            parameters : {
                dato1: 'Dato enviado 1',
                dato2: 'Dato enviado 2',
                dato3: 'Dato enviado 3'
            }
         };
     };
     --------------------------------------------------

     https://cobiscorp.atlassian.net/wiki/pages/viewpage.action?pageId=75300932
    */
    app.service(cobis.modules.CONTAINER + ".reportingService", ["$q", "$http", function ($q, $http) {
        function getUrl(reportConfiguration){

            if(reportConfiguration.module === undefined){
                cobis.showMessageWindow.alertError(cobis.translate('COMMONS.REPORT.MSG_MODULE_NAME_REQUIRED')).done(function (response) {});
                console.log('Module name is required');
                return null;
            }
            if(reportConfiguration.name === undefined){
                cobis.showMessageWindow.alertError(cobis.translate('COMMONS.REPORT.MSG_REPORT_NAME_REQUIRED')).done(function (response) {});
                console.log('Report name is required');
                return null;
            }
            if(reportConfiguration.title === undefined){
                reportConfiguration.title = reportConfiguration.module + ' ' + reportConfiguration.name;
            }

            var url = '/CTSProxy/services/cobis/web/reporting/actions/reportingService?report.module=' + reportConfiguration.module + '&report.name=' + reportConfiguration.name;
            var additionalParameters = '';

            if(reportConfiguration.parameters != undefined) {
                $.each(reportConfiguration.parameters, function (k, v) {
                    if (k != undefined && v != undefined) {
                        additionalParameters += '&' + k + '=' + v;
                    }
                });
            }

            url += additionalParameters;

            return url;
        }

        var reportingService = {
            showOnTab: function (reportConfiguration) {
                console.log('Show report on tab', reportConfiguration);
                var url = getUrl(reportConfiguration);
                if(url !== null) {
                    cobis.container.tabs.openNewTab(0, url, reportConfiguration.title, true);
                }
            },
            showOnPopup: function (reportConfiguration) {
                console.log('Show report on popup', reportConfiguration);

                if(reportConfiguration.screen.height === undefined){
                    reportConfiguration.screen.height = 500;
                }
                if(reportConfiguration.screen.width === undefined){
                    reportConfiguration.screen.width = 500;
                }

                var url = getUrl(reportConfiguration);
                if(url !== null) {
                    var params = ['height=' + reportConfiguration.screen.height, 'width=' + reportConfiguration.screen.width, 'fullscreen=yes'].join(',');

                    var popup = window.open(url, 'popup_window_' + reportConfiguration.title, params);
                    popup.moveTo(0, 0);
                }
            }
        };

        return reportingService;

    }]);
    
    app.service(cobis.modules.CONTAINER + ".menuContainer", ["$translate", "$q", "$http", "$timeout",
        function ($translate, $q, $http, $timeout) {
            var serviceMenu = {},
                resourceFiles,
                i;

            serviceMenu.getListMenuFiles = function () {
                var d = $q.defer();
                $http({
                    url: "${contextPath}/resources/cobis/web/container/menu/getListMenuFiles",
                    method: "GET",
                    data: null
                }).success(function (data, status, headers, config) {
                    var listTemp = [],
                        listResult = [],
                        messages = [],
                        validFiles = data.validFiles,
                        invalidFiles = data.invalidFiles,
                        ignoredFiles = data.ignoredFiles;

                    //show error message if exist invalid file(s)
                    if (invalidFiles) {
                        invalidFiles.forEach(function (item) {
                            messages.push({
                                message: item,
                                type: 0
                            });
                        });
                        //wait until container resources are available, then show messages
                        $timeout(function () {
                            var message = cobis.translate("COMMONS.CONTAINER.MSG_INVALID_RESOURCE_FILE") + ': ';
                            messages.unshift({
                                message: message,
                                type: 0
                            });
                            cobis.getMessageManager().showMessagesError(messages);
                        }, 200);
                    }

                    resourceFiles = [];

                    if (ignoredFiles) {
                        validFiles.forEach(function (validFile) {
                            ignoredFiles.forEach(function (ignoredFile) {
                                if (validFile.indexOf(ignoredFile) < 0) {
                                    resourceFiles.push(validFile);
                                }
                            });
                        });
                    } else {
                        resourceFiles = validFiles;
                    }

                    resourceFiles.forEach(function (value) {
                        // var positionExt = value.indexOf(".js");
                        // var nameFileFreeExtLang = value.substr(0, positionExt
                        // - 3);
                        var array = value.split('-'),
                            nameFileFreeExtLang = array[0] + '-' + array[1];

                        listTemp.push(nameFileFreeExtLang);
                    });
                    listTemp.forEach(function (value) {
                        var copyToListResult = true;
                        for (i = 0; i <= listResult.length; i += 1) {
                            if (value == listResult[i]) {
                                copyToListResult = false;
                                break;
                            }
                        }
                        if (copyToListResult == true) {
                            listResult.push(value);
                        }
                    });
                    d.resolve(listResult);
                }).error(function (data, status, headers, config) {
                    d.reject(null);
                });
                return d.promise;
            };
            return serviceMenu;
        }]);

    app.service(cobis.modules.CONTAINER + ".containerInfoService", ["$q", "$http",
        function ($q, $http) {
            var service = {};

            service.getProcessDate = function () {
                var d = $q.defer();
                $http({
                    url: "${contextPath}/resources/cobis/web/security/getProcessDate",
                    method: "PUT",
                    data: null,
                    params: {
                        returnOnlyData: false,
                        exceptionHandling: true
                    }
                }).success(function (data, status, headers, config) {
                    if (status !== "500") {
                        if (angular.isDefined(data) && data.result) {
                            d.resolve(data.data);
                        } else {
                            d.reject(null);
                        }
                    } else {
                        d.reject(null);
                    }
                }).error(function (data, status, headers, config) {
                    d.reject(null);
                });
                return d.promise;
            };
            
            service.keepAliveSessionOnCen = function () {
                var d = $q.defer();
				$http({
					url: "${contextPath}/resources/cobis/web/security/validateUserSession",
					method: "GET",
					data: null,
					params: {returnOnlyData: false, exceptionHandling: false}
				}).success(function (data, status, headers, config) {
					if (status != "500") {
						d.resolve(data);
					} else {
						d.reject(null);
					}
				}).error(function (data, status, headers, config) {
					d.reject(null);
				});
				return d.promise;
            };

            return service;
        }]);

    app.service('cobisMessage', ["$filter", "$compile", "$rootScope",
        function ($filter, $compile, $rootScope) {
            var specialCharacters = [{originalChar : '\'', replaceChar : '"'}];
    		
    		function _replaceMessage (message) {
    			var m = message;
                specialCharacters.forEach(function (currentValue) {
    				m = m.replace(new RegExp(currentValue.originalChar, 'g'), currentValue.replaceChar);
    			});
                return m;
    		}
             
            function _putParams(message, params) {
                if (message != null && params != null) {
                    message = $.validator.format(message);
                    message = message(params);
                    console.log(message);
                }
                return message;
            }           
            
            function _showMessages(messages) {
                var title,
                    id,
                    i,
                    p,
                    messagesArray = [],
                    messageText,
                    messageParams = "",
                    notifier = kiui.notifier(),
                    type,
                    msgPromise = null,
                    showAsWindowsTemp,
                    code = null;


                if (messages instanceof Array) {
                    messagesArray = messages;
                } else {
                    // messagesArray = [{message: messages, code: -1,
                    // parameters: params}];
                    messagesArray.push(messages);
                }

                for (i = 0; i < messagesArray.length; i += 1) {
                    showAsWindowsTemp = false;
                    // messsages for traduction code = -1
                    if (angular.isUndefined(messagesArray[i].code) || messagesArray[i].code === -1) {
                        if (angular.isDefined(messagesArray[i].parameters) && angular.isArray(messagesArray[i].parameters)) {
                            messageParams = "{";
                            for (p = 0; p < messagesArray[i].parameters.length; p += 1) {
                                if (p > 0) {
                                    messageParams += ",";
                                }
                                messageParams += ("\"p" + p + "\":\"" + messagesArray[i].parameters[p] + "\"");
                            }
                            messageParams += "}";
                        }
                        if (messageParams) {
                            messageText = $compile("<div>{{'" + _replaceMessage(messagesArray[i].message) + "'|translate:'" + messageParams + "'}}</div>")($rootScope);
                        } else {
                            messageText = $compile("<div>{{'" + _replaceMessage(messagesArray[i].message) + "'|translate}}</div>")($rootScope);
                        }
                    } else {
                        messageText = "<div>" + messagesArray[i].message + "</div>";
                        if (angular.isDefined(messagesArray[i].parameters) && angular.isArray(messagesArray[i].parameters)) {
                            messageText = _putParams(messageText, messages[i].parameters);
                        }
                    }

                    if ((angular.isDefined(messagesArray[i].showAsWindow) && messagesArray[i].showAsWindow)) {
                        showAsWindowsTemp = true;
                    } else {
                        showAsWindowsTemp = false;
                    }

                    type = messagesArray[i].type;
                    if (type === "undefined") {
                        type = cobis.constant.TYPEMESSAGE.INFO; // Info ;
                    }

                    switch (type) {
                    case cobis.constant.TYPEMESSAGE.ERROR:
                        /*Error*/
                        //Default behavior Redmine: #49967
                        //if showAsWindow is undefined showAsWindowsTemp must be true because is an error
						if (messagesArray[i].showAsWindow === undefined) {
							showAsWindowsTemp = true;
						}
                        if (showAsWindowsTemp) {
                            code = messagesArray[i].code;
                            messageText = cobis.translate(messagesArray[i].message, messageParams);
                            if (code != -1) {
                                messageText = messageText + '<div class="text-muted small cb-gap-top">Error ' + code + '</div>';
                            }
                            cobis.showMessageWindow.alertError(messageText).done(function (response) {});
                        } else {
                            notifier.error({
                                title: $compile("<span>{{'COMMONS.MESSAGES.MSG_ERROR'|translate}} " + messages[i].code + "!</span>")($rootScope),
                                content: messageText,
                                append: false,
                                autoHide: messagesArray[i].timeWait,
                                icon: "<span class='glyphicon glyphicon-remove-circle'></span>"
                            });
                        }
                        break;
                    case cobis.constant.TYPEMESSAGE.INFO:
                        /* Info */
                        if (showAsWindowsTemp) {
                            cobis.showMessageWindow.alertInfo(cobis.translate(messagesArray[i].message, messageParams)).done(function (response) {});
                        } else {
                            notifier.info({
                                title: $compile("<span>{{'COMMONS.MESSAGES.MSG_INFO'|translate}}!</span>")($rootScope),
                                content: messageText,
                                append: false,
                                autoHide: messagesArray[i].timeWait,
                                icon: "<span class='glyphicon glyphicon-info-sign'></span>"
                            });
                        }
                        break;

                    case cobis.constant.TYPEMESSAGE.SUCCESS:
                        /*Success*/
                        //Default behavior Redmine: #49967
						//If timewait is not defined 
						if (messagesArray[i].timeWait === undefined || messagesArray[i].timeWait === 0) {
							messagesArray[i].timeWait = cobis.constant.DEFAULT_DELAY_TIME_SUCCESS_NOTIFICATION;
						}
                        if (showAsWindowsTemp) {
                            cobis.showMessageWindow.alertSuccess(cobis.translate(messagesArray[i].message, messageParams)).done(function (response) {});
                        } else {
                            notifier.success({
                                title: $compile("<span>{{'COMMONS.MESSAGES.MSG_SUCCES'|translate}}!</span>")($rootScope),
                                content: messageText,
                                append: false,
                                autoHide: messagesArray[i].timeWait,
                                icon: "<span class='glyphicon glyphicon-ok-circle'></span>"
                            });
                        }
                        break;

                    case cobis.constant.TYPEMESSAGE.CONFIRM:
                        /* CONFIRM */
                        msgPromise = cobis.showMessageWindow.confirm(cobis.translate(messagesArray[i].message, messageParams)).done(function () {});
                        break;

                    default:
                        notifier.info({
                            title: $compile("<span>{{'COMMONS.MESSAGES.MSG_INFO'|translate}}</span>")($rootScope),
                            content: messageText,
                            append: true,
                            autoHide: messagesArray[i].timeWait
                        });
                        break;
                    }
                }

                return msgPromise;
            }

            function _showGroupMessages(groupMessages) {
                var groupId,
                    message,
                    parameters,
                    messessageManager = cobis.getMessageManager(),
                    i,
                    objMessage;
                if (groupMessages.error.length > 0) {
                    for (i = 0; i < groupMessages.error.length; i += 1) {
                        objMessage = groupMessages.error[i];
                        groupId = objMessage.groupId;
                        message = objMessage.message;
                        parameters = objMessage.parameters;
                        messessageManager.showGroupMessagesError(groupId, message, parameters);
                    }
                }
                if (groupMessages.info.length > 0) {
                    for (i = 0; i < groupMessages.info.length; i += 1) {
                        objMessage = groupMessages.info[i];
                        groupId = objMessage.groupId;
                        message = objMessage.message;
                        parameters = objMessage.parameters;
                        messessageManager.showGroupMessagesInfo(groupId, message, parameters);
                    }
                }
                if (groupMessages.success.length > 0) {
                    for (i = 0; i < groupMessages.success.length; i += 1) {
                        objMessage = groupMessages.success[i];
                        groupId = objMessage.groupId;
                        message = objMessage.message;
                        parameters = objMessage.parameters;
                        messessageManager.showGroupMessagesSuccess(groupId, message, parameters);
                    }
                }
            }

     

            function _validateIfMessageIsArray(messages) {
                var messageArray = [];
                if (messages instanceof Array) {
                    messageArray = messages;
                } else {
                    messageArray.push({
                        "message": messages
                    });
                }
                return messageArray;
            }

            function _putMessagesGroup(groupId, selector, selectorMsg, message, type) {

                if (selector.length > 0) {
                    if (selectorMsg.length > 0) {
                        selectorMsg.remove();
                    }
                    selector.last().after("<div id='" + groupId + "_msg' class='alert alert-" + type + "' role='alert'><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span><span class='sr-only'>Error:</span>" + message + "</div>");
                    selector.last().hide();
                } else {
                	cobis.logging.getLoggerManager().warn("showGroupMessages: No existe el Grupo especificado ->" + groupId);
                }
            }

            return {
            	showMessagesError: function (messages, showAsWindow, params, timeWait) {
					var messageArray = _validateIfMessageIsArray(messages);
					messageArray.forEach(function (element){
						element.type = cobis.constant.TYPEMESSAGE.ERROR;
						element.showAsWindow = angular.isUndefined(element.showAsWindow) ? showAsWindow : element.showAsWindow;
						element.timeWait = angular.isUndefined(element.timeWait) ? timeWait : element.timeWait;
						element.parameters = angular.isUndefined(element.parameters) ? params : element.parameters;
						element.code = -1;
					});
					
					_showMessages(messageArray);
                },
				//Deprecated use: showMessagesError(messages, showAsWindow,  params, timeWait)
				showTranslateMessagesError: function (messages, params, timeWait, showAsWindow) {
					this.showMessagesError(messages, showAsWindow, params, timeWait);
				},

				showMessagesInformation: function (messages,showAsWindow, params, timeWait) {
					var messageArray = _validateIfMessageIsArray(messages);
					messageArray.forEach(function (element){
						element.type = cobis.constant.TYPEMESSAGE.INFO;
						element.showAsWindow = angular.isUndefined(element.showAsWindow) ? showAsWindow : element.showAsWindow;
						element.timeWait = angular.isUndefined(element.timeWait) ? timeWait : element.timeWait;
						element.parameters = angular.isUndefined(element.parameters) ? params : element.parameters;
						element.code = -1;
					});
                    _showMessages(messageArray);
				},

                showMessagesConfirm: function (messages) {
                    var messageArray = _validateIfMessageIsArray(messages),
                        promiseMgs;
                    messageArray.forEach(function (element) {
                        element.type = cobis.constant.TYPEMESSAGE.CONFIRM;
                    });
                    promiseMgs = _showMessages(messageArray);
                    return promiseMgs;
                },

              //Deprecated use: showMessagesInformation(messages, showAsWindow,  params, timeWait)
				showTranslateMessagesInfo: function (messages,params, timeWait, showAsWindow) {
					this.showMessagesInformation(messages,showAsWindow, params, timeWait);
				},
				 
				showMessagesSuccess: function (messages, showAsWindow, params, timeWait) {
					var messageArray = _validateIfMessageIsArray(messages);
					messageArray.forEach(function (element){
						element.type = cobis.constant.TYPEMESSAGE.SUCCESS;
						element.showAsWindow = angular.isUndefined(element.showAsWindow) ? showAsWindow : element.showAsWindow;
						element.timeWait = angular.isUndefined(element.timeWait) ? timeWait : element.timeWait;
						element.parameters = angular.isUndefined(element.parameters) ? params : element.parameters;
						element.code = -1;
					});
					_showMessages(messageArray);
				},
				//Deprecated use: showMessagesSuccess(messages, showAsWindow,  params, timeWait)
                showTranslateMessagesSuccess: function (messages, params, timeWait, showAsWindow) {
					this.showMessagesSuccess(messages, showAsWindow, params, timeWait);

				},

                showMessages: function (messages) {
                    var messageArray = _validateIfMessageIsArray(messages);
                    _showMessages(messageArray);
                },

                showAllMessages: function (messages) {
                    var messagesError = [],
                        messagesInfo = [],
                        messagesSuccess = [],
                        groupMessages = {
                            error: [],
                            info: [],
                            success: []
                        },
                        i;
                    for (i = 0; i < messages.length; i += 1) {
                        switch (messages[i].type) {
                        case 0: // error
                            if (!messages[i].groupId || messages[i].groupId == "") {
                                messagesError.push(messages[i]);
                            } else {
                                groupMessages.error.push(messages[i]);
                            }
                            break;
                        case 1: // info
                            if (!messages[i].groupId || messages[i].groupId == "") {
                                messagesInfo.push(messages[i]);
                            } else {
                                groupMessages.info.push(messages[i]);
                            }
                            break;
                        case 2: // success
                            if (!messages[i].groupId || messages[i].groupId == "") {
                                messagesSuccess.push(messages[i]);
                            } else {
                                groupMessages.success.push(messages[i]);
                            }
                            break;
                        }
                    }

                    if (messagesError.length > 0) {
                        _showMessages(messagesError, 0);
                    }
                    if (messagesInfo.length > 0) {
                        _showMessages(messagesInfo, 1);
                    }
                    if (messagesSuccess.length > 0) {
                        _showMessages(messagesSuccess, 2);
                    }
                    _showGroupMessages(groupMessages);
                },

                showGroupMessagesError: function (groupId, messages, params) {
                    var selector = $("[ng-class*=" + groupId + "]"),
                        selectorMsg = $("#" + groupId + "_msg"),
                        message;
                    if (messages.length > 0 && selectorMsg.length === 0) {
                        message = cobis.translate(messages, params);
                        _putMessagesGroup(groupId, selector, selectorMsg, message, "danger");
                    } else if (selectorMsg.length > 0 && messages.length === 0) {
                        selectorMsg.remove();
                        selector.last().show();
                    }

                },

                showGroupMessagesInfo: function (groupId, messages, params) {
                    var selector = $("[ng-class*=" + groupId + "]"),
                        selectorMsg = $("#" + groupId + "_msg"),
                        message;

                    if (messages.length > 0 && selectorMsg.length === 0) {
                        message = cobis.translate(messages, params);
                        _putMessagesGroup(groupId, selector, selectorMsg, message, "info");
                    } else if (selectorMsg.length > 0 && messages.length === 0) {
                        selectorMsg.remove();
                        selector.last().show();
                    }

                },

                showGroupMessagesSuccess: function (groupId, messages, params) {
                    var selector = $("[ng-class*=" + groupId + "]"),
                        selectorMsg = $("#" + groupId + "_msg"),
                        message;
                    if (messages.length > 0 && selectorMsg.length === 0) {
                        message = cobis.translate(messages, params);
                        _putMessagesGroup(groupId, selector, selectorMsg, message, "success");
                    } else if (selectorMsg.length > 0 && messages.length === 0) {
                        selectorMsg.remove();
                        selector.last().show();
                    }
                }
            };
        }
        ]);

    /**
     * Modal service
     */
    app.service(cobis.modules.CONTAINER + '.modalService', ['$modal',
        function ($modal) {
            var modalDefaults = {
                    backdrop: true,
                    keyboard: true,
                    modalFade: true,
                    templateUrl: '${contextPath}/cobis/web/views/commons/templates/modal.html'
                },
                modalOptions = {
                    closeButtonText: 'Close',
                    actionButtonText: 'OK',
                    headerText: 'Proceed?',
                    bodyText: 'Perform this action?'
                };

            this.showModal = function (customModalDefaults, customModalOptions) {
                if (!customModalDefaults) {
                    customModalDefaults = {};
                }
                customModalDefaults.backdrop = 'static';
                return this.show(customModalDefaults, customModalOptions);
            };

            this.show = function (customModalDefaults, customModalOptions) {
                // Create temp objects to work with
                // since we're in a singleton
                // service
                var tempModalDefaults = {},
                    tempModalOptions = {};

                // Map angular-ui modal custom
                // defaults to modal defaults
                // defined in service
                angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

                // Map modal.html $scope custom
                // properties to defaults defined in
                // service
                angular.extend(tempModalOptions, modalOptions, customModalOptions);

                if (!tempModalDefaults.controller) {
                    tempModalDefaults.controller = function ($scope, $modalInstance) {
                        $scope.modalOptions = tempModalOptions;
                        $scope.modalOptions.ok = function (result) {
                            $modalInstance.close(result);
                        };
                        $scope.modalOptions.close = function (result) {
                            $modalInstance.dismiss('cancel');
                        };
                    };
                }

                return $modal.open(tempModalDefaults);
            };

        }]);
        
    app.controller("keepAliveCen.Controller",["$scope", cobis.modules.CONTAINER + ".containerInfoService", function($scope, containerInfoService){
		angular.element(document).ready(function(){
			if(cobis.userContext.getValue(cobis.constant.RUNNINGONCEN) == '"yes"' || cobis.userContext.getValue(cobis.constant.RUNNINGONCEN) == 'yes'){
				var executeKeepAlive = window.external.KeepAliveSessionCobis5();
				if(executeKeepAlive || typeof window.keepAliveInterval === 'undefined' || window.keepAliveInterval === null){
					window.keepAliveInterval = setInterval(containerInfoService.keepAliveSessionOnCen, 180000);
				}
			}
		});
	}]);

}(window.angular, window.kendo, window.kendo.jQuery, window.kiui, window.cobis));