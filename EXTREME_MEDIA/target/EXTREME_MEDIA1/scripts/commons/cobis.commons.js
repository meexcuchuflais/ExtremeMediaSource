/*global console, Cordova */
/*jslint eqeq: true, nomen: true, bitwise: true*/
(function (angular, kendo, $) {
    'use strict';

    if (!window.cobis) {
        window.cobis = {};
    }

    if (!window.cobis.userContext) {
        window.cobis.userContext = {};
    }

    // Create the namespaces
    var cobis = window.cobis,
        nsUserContext = cobis.userContext,
        getLoggerManager = function () {
            var injector = angular.element(document.querySelector("html")).injector(),
                logger = injector.get('$log');
            return logger;
        },
        isRunningOnCen,
        runningOnCEN,
        logJsErrorOnCen,
        isCENLogEnabled;

    cobis.version = "1.0.0.0";
    cobis.modules = {
        CONTAINER: "container",
        DESIGNER: "designerModule",
        LOANS: "loans",
        BRANCH: "branch",
        CUSTOMER: "customer",
        INTTRADE: "inttrade",
        ADMCLIENTVIEWER: "adminclientviewer",
        CLIENTVIEWER: "clientviewer",
        BUSINESSRULES: "businessrules",
        INBOX: "inbox",
        FPM: "fpm",
        WORKFLOW: "workflow",
        MKCHK: "mkchk"
    };
    cobis.panelTypes = {
        MENU: 0,
        FAVORITES: 1
    };
    cobis.containerScope = window.parent.cobis.containerScope || null;
    cobis.createModule = function (name, modules, partsResourcesNames) {
        var app, newModules, i, j, exists, culture;
        try {
            app = angular.module(name);
            if (name === cobis.modules.CONTAINER && partsResourcesNames) {
                app.config(["$translateProvider", "$translatePartialLoaderProvider", "$locationProvider",
                    function ($translateProvider, $translatePartialLoaderProvider, $locationProvider) {
                        app.translateProvider = $translateProvider;
                        if (partsResourcesNames !== null) {
                            partsResourcesNames.forEach(function (resourceName) {
                                $translatePartialLoaderProvider.addPart(resourceName);
                            });
                        }
                        app.translateProvider.useLoader('$translatePartialLoader', {
                            urlTemplate: '/CTSProxy/services/cobis/web/assets/languages/{part}-{lang}.js'
                        });
                        app.translateProvider.useMissingTranslationHandler('cobisMissingTranslationHandler');
                        culture = cobis.userContext.getValue(cobis.constant.CULTURE);
                        if (culture) {
                            app.translateProvider.preferredLanguage(culture);
                        } else {
                            app.translateProvider.preferredLanguage('es');
                        }
                        app.translateProvider.useLocalStorage();
                    }]);
            }
        } catch (err) {
            newModules = ["ngRoute", "kendo.directives", "pascalprecht.translate"];
            if (modules) {
                for (i = 0; i < modules.length; i += 1) {
                    exists = false;
                    for (j = 0; j < newModules.length; j += 1) {
                        if (modules[i] === newModules[j]) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        newModules.push(modules[i]);
                    }
                }
            }
            app = angular.module(name, newModules);
            
            app.service(cobis.modules.CONTAINER + ".preferencesService", ["$translate", "$q", "$http",
                function ($translate, $q, $http) {
                    var service = {};

                    service.switchCulture = function (culture) {
                        $translate.use(culture);
                    };

                    service.loadGlobalization = function () {

                        var d = $q.defer();
                        $http({
                            url: "${contextPath}/resources/cobis/web/container/getGlobalizationInformation",
                            method: "GET",
                            params: {
                                returnOnlyData: false
                            }
                        }).success(function (data, status, headers, config) {
                            if (data && data.data) {
                                // Set default values configured in g11n-service-config.xml
                                if (!((window.sessionStorage.getItem(cobis.constant.RUNNINGONCEN) === 'yes') || (window.sessionStorage.getItem(cobis.constant.RUNNINGONCEN) === '"yes"'))){
                                    cobis.userContext.setValue(cobis.constant.CULTURES, data.data.i18n.cultures);
                                    cobis.userContext.setValue(cobis.constant.CULTURE, data.data.i18n.defaultCultureId);
                                    cobis.userContext.setValue(cobis.constant.DATE_FORMAT, data.data.l10n.dateFormat);
                                    cobis.userContext.setValue(cobis.constant.DATE_FORMAT_PLACEHOLDER, data.data.l10n.dateFormatPlaceholder);
                                    cobis.userContext.setValue(cobis.constant.CURRENCY_SYMBOL, data.data.l10n.currency.symbol);
                                    cobis.userContext.setValue(cobis.constant.CURRENCY_GROUP_SEPARATOR, data.data.l10n.currency.groupSeparator);
                                    cobis.userContext.setValue(cobis.constant.CURRENCY_DECIMAL_SEPARATOR, data.data.l10n.currency.decimalSeparator);
                                    cobis.userContext.setValue(cobis.constant.CURRENCY_DECIMAL_PLACES, data.data.l10n.currency.decimalPlaces);
                                }
                                cobis.userContext.setValue(cobis.constant.TIME_ZONE_RAW_OFFSET, data.data.l10n.timeZoneRawOffset);
                            }
                            d.resolve(data);
                        }).error(function (data, status, headers, config) {
                            d.reject(null);
                        });
                        return d.promise;
                    };

                    service.getGlobalization = function (key) {
                        var current = cobis.userContext.getValue(key);
                        return current;
                    };

                    service.getUserPreferences = function () {
                        var login = cobis.userContext.getValue(cobis.constant.USER_NAME),
                            d = $q.defer();
                        $http({
                            url: "${contextPath}/resources/cobis/web/container/preferences/getUserPreferences",
                            method: "PUT",
                            data: login
                        }).success(function (data, status, headers, config) {
                            d.resolve(data);
                        }).error(function (data, status, headers, config) {
                            d.reject(null);
                        });
                        return d.promise;
                    };

                    service.saveUserPreferences = function () {
                        var userId = cobis.userContext.getValue(cobis.constant.USER_NAME),
                            language = cobis.userContext.getValue(cobis.constant.CULTURE),
                            autoHideMenu = cobis.userContext.getValue(cobis.constant.USER_AUTO_HIDE_MENU),
                            d = $q.defer();
                        $http({
                            url: "${contextPath}/resources/cobis/web/container/preferences/saveUserPreferences",
                            method: "PUT",
                            data: [userId, language, autoHideMenu]
                        }).success(function (data, status, headers, config) {
                            d.resolve(data);
                        }).error(function (data, status, headers, config) {
                            d.reject(null);
                        });
                        return d.promise;
                    };

                    service.getConfigurationInfo = function () {
                        var d = $q.defer();
                        $http({
                            url: "${contextPath}/resources/cobis/web/container/getConfigurationInfo",
                            method: "GET",
                            data: null
                        }).success(function (data, status, headers, config) {
                            d.resolve(data);
                        }).error(function (data, status, headers, config) {
                            d.reject(null);
                        });
                        return d.promise;
                    };

					return service;
                }]);

            /* Default configuration for the module */
            app.config(["$translateProvider", "$translatePartialLoaderProvider", "$locationProvider",
                function ($translateProvider, $translatePartialLoaderProvider, $locationProvider) {
                    app.translateProvider = $translateProvider;
                    /* When the application send multiple resource parts */
                    if (partsResourcesNames != null) {
                        partsResourcesNames.forEach(function (resourceName) {
                            if (!$translatePartialLoaderProvider.isPartAvailable(resourceName)) {
                                $translatePartialLoaderProvider.addPart(resourceName);
                            }
                        });
                    } else {
                        if (!$translatePartialLoaderProvider.isPartAvailable(name)) {
                            $translatePartialLoaderProvider.addPart(name);
                        }
                    }
                    app.translateProvider.useLoader('$translatePartialLoader', {
                        urlTemplate: '/CTSProxy/services/cobis/web/assets/languages/{part}-{lang}.js'
                    });
                    app.translateProvider.useMissingTranslationHandler('cobisMissingTranslationHandler');
                    var culture = cobis.userContext.getValue(cobis.constant.CULTURE),
                        temCult;

                    if (culture) {
                        temCult = culture.substring(0, 2);
                        app.translateProvider.preferredLanguage(culture);
                        $.getScript("${contextPath}/cobis/web/scripts/lib/kendo/cultures/kendo.culture." + temCult + ".min.js", function () {});
                        $.getScript("${contextPath}/cobis/web/scripts/lib/kendo/lang/kendo.messages." + temCult + ".js", function () {});
                        kendo.culture(temCult);

                    } else {
                        app.translateProvider.preferredLanguage('es');
                        $.getScript("${contextPath}/cobis/web/scripts/lib/kendo/cultures/kendo.culture.es.min.js", function () {});
                        $.getScript("${contextPath}/cobis/web/scripts/lib/kendo/lang/kendo.messages.es.js", function () {});
                        kendo.culture('es');
                    }
                    app.translateProvider.useLocalStorage();
                }]);
            
         

            app.run([cobis.modules.CONTAINER + ".preferencesService", '$rootScope', '$translate', '$route', '$location',
                     function (preferencesService, $rootScope, $translate, $route, $location) {
            		var initialLocation = $location.path();
            		$rootScope.$on('$locationChangeSuccess', function() {
            			$rootScope.actualLocation = $location.path();
            		});
					$rootScope.$on("$locationChangeStart", function(event, newUrl, oldUrl){
						if(cobis.userContext.getValue("flagBackButton") === true && newUrl.indexOf("login.html") > 0){
							cobis.userContext.setValue("flagBackButton", false);
							window.top.location.href = cobis.constant.HOME_PAGE_URL;
						}
					});
            		$rootScope.$watch(function () {return $location.path()}, function (newLocation, oldLocation) {
            			if(oldLocation !== initialLocation && $rootScope.actualLocation === newLocation && initialLocation != "") {
            				window.top.location.href  = cobis.constant.HOME_PAGE_URL;
            			} else if (newLocation.indexOf("container.html") > 0){
							cobis.userContext.setValue("flagBackButton", true);
						} else if (newLocation.indexOf("login.html") > 0){
							cobis.userContext.setValue("flagBackButton", false);
						}
            		});
                    if (isRunningOnCen) {
                        $rootScope.flagFromCENToDesigner = true;
                    }
                    // manejo de culturas para los controles kendo
                    if (preferencesService.getGlobalization(cobis.constant.DATE_FORMAT)) {
                        kendo.cultures.current.calendar.patterns.d = preferencesService.getGlobalization(cobis.constant.DATE_FORMAT);
                    } else {
                        kendo.cultures.current.calendar.patterns.d = 'yyyy/MM/dd';
                    }
                    if (preferencesService.getGlobalization(cobis.constant.CURRENCY_SYMBOL)) {
                        kendo.cultures.current.numberFormat.currency.symbol = preferencesService.getGlobalization(cobis.constant.CURRENCY_SYMBOL);
                    } else {
                        kendo.cultures.current.numberFormat.currency.symbol = '$';
                    }
                    if (preferencesService.getGlobalization(cobis.constant.CURRENCY_GROUP_SEPARATOR)) {
                        kendo.cultures.current.numberFormat[','] = preferencesService.getGlobalization(cobis.constant.CURRENCY_GROUP_SEPARATOR);
                        kendo.cultures.current.numberFormat.currency[','] = preferencesService.getGlobalization(cobis.constant.CURRENCY_GROUP_SEPARATOR);
                        kendo.cultures.current.numberFormat.percent[','] = preferencesService.getGlobalization(cobis.constant.CURRENCY_GROUP_SEPARATOR);
                    } else {
                        kendo.cultures.current.numberFormat[','] = '.';
                        kendo.cultures.current.numberFormat.currency[','] = '.';
                        kendo.cultures.current.numberFormat.percent[','] = '.';
                    }
                    if (preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_SEPARATOR)) {
                        kendo.cultures.current.numberFormat['.'] = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_SEPARATOR);
                        kendo.cultures.current.numberFormat.currency['.'] = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_SEPARATOR);
                        kendo.cultures.current.numberFormat.percent['.'] = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_SEPARATOR);
                    } else {
                        kendo.cultures.current.numberFormat['.'] = ',';
                        kendo.cultures.current.numberFormat.currency['.'] = ',';
                        kendo.cultures.current.numberFormat.percent['.'] = ',';
                    }
                    if (preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_PLACES)) {
                        kendo.cultures.current.numberFormat.decimals = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_PLACES);
                        kendo.cultures.current.numberFormat.currency.decimals = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_PLACES);
                        kendo.cultures.current.numberFormat.percent.decimals = preferencesService.getGlobalization(cobis.constant.CURRENCY_DECIMAL_PLACES);
                    } else {
                        kendo.cultures.current.numberFormat.decimals = 2;
                        kendo.cultures.current.numberFormat.currency.decimals = 2;
                        kendo.cultures.current.numberFormat.percent.decimals = 2;
                    }
                }]);

            app.factory('cobisMissingTranslationHandler', ["$log",
                function ($log) {
                    return function (translationId, languageId) {
                        // DZU: se comenta el warning ya que si no existe la
                        // etiqueta se mostraria el ID del label y el
                        // desarrollador podra identificar el error.
                        // $log.warn('Translation for ' + translationId + ' doesn\'t
                        // exist for language ' + languageId);
                    };
                }]);

            if (isRunningOnCen && isCENLogEnabled) {
                app.factory('$exceptionHandler', function () {
                    return function (exception, cause) {
                        window.external.LogAngularManagedError(exception.message, cause, exception.stack);
                    };
                });
            }

            app.config(["$logProvider",
                function ($logProvider) {
                    //Before this change the variable "cobis.log.debugEnabled" was always false
                    //$logProvider.debugEnabled(cobis.log.debugEnabled);
                    $logProvider.debugEnabled(false);
                }]);
        }
        return app;
    };



    cobis.constant = {
        USER_NAME: "UserName",
        USER_FULLNAME: "Fullname",
        USER_ROLE: "userRole",
        USER_OFFICE: "userOffice",
        USER_FILIAL: "userFilial",
        USER_AUTO_HIDE_MENU: "userAutoHideMenu",
        CULTURES: "cultures",
        CULTURE: "culture",
        DATE_FORMAT: "dateFormat",
        DATE_FORMAT_PLACEHOLDER: "dateFormatPlaceholder",
        CURRENCY_SYMBOL: "currencySymbol",
        CURRENCY_GROUP_SEPARATOR: "currencyGroupSeparator",
        CURRENCY_DECIMAL_SEPARATOR: "currencyDecimalSeparator",
        CURRENCY_DECIMAL_PLACES: "currencyDecimalPlaces",
        LIST_FILES_MENU: "listFilesNamesMenu",
        TYPEMESSAGE: {
            ERROR: 0,
            INFO: 1,
            SUCCESS: 2,
            CONFIRM: 3
        },
        RUNNINGONCEN: "runningOnCen",
        LOGJSERRORONCEN: "logJsErrorOnCen",
        DEBUGGINGMODE: "debuggingMode",
        MODAL_MESSAGES_DELAY_TIME: 400,
        CURRENT_LOG_LEVEL: "logLevel",
        DEFAULT_DELAY_TIME_SUCCESS_NOTIFICATION: 10000, //10 seg
        TIME_ZONE_RAW_OFFSET : "timeZoneRawOffset",
        CLIENT_LOCALIZATION_INFORMATION_SYNC: "clientLocalizationInformationSync",
        HOME_PAGE_URL: "${contextPath}/cobis/web/views/commons/container.html"
    };

    cobis.closingReason = {
        NEW_TAB: "loadNewTab",
        REMOVE_TAB: "removeTab",
        LOGOUT: "logout",
        BROWSER: "browser",
        SESSION_TIMEOUT: "sessionTimeout"
    };

    cobis.translate = function (message, parameters) {
        var injector = angular.element(document).injector(),
            filter = injector.get('$filter');
        return filter('translate')(message, parameters);
    };

    /*
    cobis.log = {
        info: function (msg) {
            var logger = getLoggerManager();
            if (logger !== null) {
                logger.info(msg);
            } else {
                console.info(msg);
            }
        },
        warn: function (msg) {
            var logger = getLoggerManager();
            if (logger != null) {
                logger.warn(msg);
            } else {
                console.warn(msg);
            }
        },
        debug: function (msg) {
            var logger = getLoggerManager();
            if (logger !== null) {
                logger.debug(msg);
            } else {
                console.debug(msg);
            }
        },
        error: function (msg) {
            var logger = getLoggerManager();
            if (logger !== null) {
                logger.error(msg);
            } else {
                console.error(msg);
            }
        },
        debugEnabled: false
    };
	*/

    cobis.utils = {
        getGuid: function () {
            var d = new Date().getTime(),
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = ((d + Math.random() * 16) % 16) | 0;
                    d = Math.floor(d / 16);
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            return uuid;
        }
    };

    cobis.getMessageManager = function () {
        var injector = angular.element(document.querySelector("html")).injector(),
            filter = injector.get('$filter'),
            message = injector.get("cobisMessage");
        return message;
    };

    nsUserContext.setValue = function (key, value) {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    };

    nsUserContext.getValue = function (key) {
        return JSON.parse(window.sessionStorage.getItem(key));
    };

    nsUserContext.removeValue = function (key) {
        window.sessionStorage.removeItem(key);
    };

    nsUserContext.clear = function () {
    	var debuggingMode = window.sessionStorage.getItem(cobis.constant.DEBUGGINGMODE);
		window.sessionStorage.clear();
		window.sessionStorage.setItem(cobis.constant.DEBUGGINGMODE,debuggingMode);
    };

    cobis.CobisException = (function () {
        function CobisException(messages) {
            this.messages = messages;
        }
        return CobisException;
    }());

    runningOnCEN = cobis.userContext.getValue(cobis.constant.RUNNINGONCEN);
    isRunningOnCen = runningOnCEN === '"yes"' || runningOnCEN === 'yes' ? true : false;
    logJsErrorOnCen = cobis.userContext.getValue(cobis.constant.LOGJSERRORONCEN);
    isCENLogEnabled = logJsErrorOnCen === '"true"' || logJsErrorOnCen === 'true' ? true : false;

    cobis.logging = {
        logLevel: {
            INFO: "INFO",
            WARN: "WARN",
            DEBUG: "DEBUG"
        },
        enable: function (level) {
            cobis.userContext.setValue(cobis.constant.CURRENT_LOG_LEVEL, level);
        },
        disable: function () {
            cobis.userContext.removeValue(cobis.constant.CURRENT_LOG_LEVEL);
        },
        getCurrentLogLevel: function () {
            var level = cobis.userContext.getValue(cobis.constant.CURRENT_LOG_LEVEL);
            return angular.isUndefined(level) || level === null || level === "" ? undefined : level;
        },
        getFormattedMessage: function (level, source, message) {
            var date = new Date(),
                strLevel = '[' + level + ']',
                strDate = '[' + date.toLocaleString() + ']',
                src = '[' + source + ']';
            return strLevel + ' ' + strDate + ' ' + src + ' ' + message;
        },
        getLoggerManager: function (source) {
            if (isRunningOnCen) {
                //CEN Logger
                return {
                    log: function (message) {
                        if (isCENLogEnabled) {
                            var logLevel = cobis.logging.getCurrentLogLevel();
                            if (logLevel !== undefined && logLevel !== cobis.logging.logLevel.WARN) {
                                window.external.LogMessage("LOG", source, message);
                            }
                        }
                    },
                    info: function (message) {
                        if (isCENLogEnabled) {
                            var logLevel = cobis.logging.getCurrentLogLevel();
                            if (logLevel !== undefined && logLevel !== cobis.logging.logLevel.WARN) {
                                window.external.LogMessage("INFO", source, message);
                            }
                        }
                    },
                    warn: function (message) {
                        if (isCENLogEnabled) {
                            var logLevel = cobis.logging.getCurrentLogLevel();
                            if (logLevel !== undefined && (logLevel === cobis.logging.logLevel.WARN || logLevel === cobis.logging.logLevel.DEBUG)) {
                                window.external.LogMessage("WARN", source, message);
                            }
                        }
                    },
                    debug: function (message) {
                        if (isCENLogEnabled) {
                            var logLevel = cobis.logging.getCurrentLogLevel();
                            if (logLevel !== undefined && logLevel === cobis.logging.logLevel.DEBUG) {
                                window.external.LogMessage("DEBUG", source, message);
                            }
                        }
                    },
                    error: function (message) {
                        if (isCENLogEnabled) {
                            var logLevel = cobis.logging.getCurrentLogLevel();
                            if (logLevel !== undefined) {
                                window.external.LogMessage("ERROR", source, message);
                            }
                        }
                    }
                };
            } else {
                //CEW Logger
                return {
                    log: function (message) {
                        var logLevel = cobis.logging.getCurrentLogLevel();
                        if (logLevel !== undefined && logLevel !== cobis.logging.logLevel.WARN) {
                            console.log(cobis.logging.getFormattedMessage("LOG", source, message));
                        }
                    },
                    info: function (message) {
                        var logLevel = cobis.logging.getCurrentLogLevel();
                        if (logLevel !== undefined && logLevel !== cobis.logging.logLevel.WARN) {
                            console.info(cobis.logging.getFormattedMessage("INFO", source, message));
                        }
                    },
                    warn: function (message) {
                        var logLevel = cobis.logging.getCurrentLogLevel();
                        if (logLevel !== undefined && (logLevel === cobis.logging.logLevel.WARN || logLevel === cobis.logging.logLevel.DEBUG)) {
                            console.warn(cobis.logging.getFormattedMessage("WARN", source, message));
                        }
                    },
                    debug: function (message) {
                        var logLevel = cobis.logging.getCurrentLogLevel();
                        if (logLevel !== undefined && logLevel === cobis.logging.logLevel.DEBUG) {
                            console.debug(cobis.logging.getFormattedMessage("DEBUG", source, message));
                        }
                    },
                    error: function (message) {
                        var logLevel = cobis.logging.getCurrentLogLevel();
                        if (logLevel !== undefined) {
                            console.error(cobis.logging.getFormattedMessage("ERROR", source, message));
                        }
                    }
                };
            }
        }
    };

    function alertMessage(message, title, buttonName, typeMessage) {
        var deferred = $.Deferred(),
            dialog,
            icon,
            className,
            random;
        title = title || cobis.translate("COMMONS.CONTAINER.TIT_MESSAGE_WINDOW");
        if (typeof Cordova !== "undefined") {
            navigator.notification.alert(message, function (r) {
                deferred.resolve();
            }, title, buttonName);
        } else {
            // create modal window on the fly
            dialog = $('<div class="cb-has-controlbar cb-messagebox" style="padding-left: 60px; padding-top: 28px" />').kendoWindow({
                actions: [],
                modal: true,
                title: title,
                width: '300px',
                resizable: false
            }).getKendoWindow();
            random = Math.floor(Math.random() * 1000) + 1;
            buttonName = buttonName || cobis.translate("COMMONS.BUTTONS.CMD_OK");

            // set the content
            icon = "";
            switch (typeMessage) {
            case 0:
                icon = "glyphicon glyphicon-remove-circle text-info";
                break;
            case 1:
                icon = "glyphicon glyphicon-info-sign text-info";
                break;
            case 2:
                icon = "glyphicon glyphicon-ok-circle text-info";
                break;
            }

            className = '<span class="' + icon + '" style="font-size: 32px; position: absolute; margin-left: -40px; margin-top: 20px;"></span>';
            dialog.content(className + message + '<div class="cb-form-controlbar"><button id="messages-alert-close-' + random + '" class="btn btn-primary">' + buttonName + '</button></div>');

            // center it and open it
            if (isRunningOnCen === true) {
                setTimeout(function () {
                    dialog.center().open();
                }, cobis.constant.MODAL_MESSAGES_DELAY_TIME);
            } else {
                dialog.center().open();
            }
            
            //ABU. Set focus in the ok button
            //Redmine 50435
            setTimeout(function(){
            	if(angular.isDefined($('#messages-alert-close-' + random)[0])){
            		$('#messages-alert-close-' + random)[0].focus();
            	}
			}, 1000);
            
            $('#messages-alert-close-' + random).on('click', function () {
                deferred.resolve();
                dialog.destroy();
            });
        }
        return deferred.promise();
    }

    cobis.showMessageWindow = {

        alert: function (message, title, buttonName) {
            return alertMessage(message, title, buttonName, cobis.constant.TYPEMESSAGE.INFO);
        },
        alertError: function (message, title, buttonName) {
            title = title || (cobis.translate("COMMONS.MESSAGES.MSG_ERROR") + '!');
            return alertMessage(message, title, buttonName, cobis.constant.TYPEMESSAGE.ERROR);
        },
        alertInfo: function (message, title, buttonName) {
            title = title || (cobis.translate("COMMONS.MESSAGES.MSG_INFO") + '!');
            return alertMessage(message, title, buttonName, cobis.constant.TYPEMESSAGE.INFO);
        },
        alertSuccess: function (message, title, buttonName) {
            title = title || (cobis.translate("COMMONS.MESSAGES.MSG_SUCCES") + '!');
            return alertMessage(message, title, buttonName, cobis.constant.TYPEMESSAGE.SUCCESS);
        },
        prompt: function (message, title, defaultText, buttonLabels) {
            var deferred = $.Deferred(),
                dialog,
                buttons,
                random;
            defaultText = defaultText || '';
            buttonLabels = buttonLabels || [cobis.translate("COMMONS.BUTTONS.CMD_CANCEL"), cobis.translate("COMMONS.BUTTONS.CMD_OK")];
            title = title || cobis.translate("COMMONS.CONTAINER.TIT_MESSAGE_WINDOW");
            if (typeof Cordova !== "undefined") {
                navigator.notification.prompt(message, function (r) {
                    deferred.resolve({
                        input: r.input1,
                        buttonIndex: r.buttonIndex
                    });
                }, title, buttonLabels, defaultText);
            } else {
                // create modal window on the fly
                dialog = $('<div class="cb-has-controlbar" />').kendoWindow({
                    actions: [],
                    modal: true,
                    title: title,
                    width: '300px',
                    resizable: false,
                    activate: function () {
                        $('#messages-prompt-input-' + random).select();
                    }
                }).getKendoWindow();
                random = Math.floor(Math.random() * 1000) + 1;

                // set buttons
                buttons = [];
                $.each(buttonLabels, function (index) {
                    var buttonType = buttonLabels.length === index + 1 ? 'btn-primary' : 'btn-default';
                    buttons.push('<button class="messages-prompt-close-' + random + ' btn ' + buttonType + '">' + this + '</button>');
                });

                // set the content
                dialog.content('<div class="form-group" style="margin:0;"><div class="control-label">' + message + '</div><input id="messages-prompt-input-' + random + '" type="text" class="form-control" value="' + defaultText + '" /></div><div class="cb-form-controlbar btn-toolbar">' + buttons.join('') + '</div>');

                // center it and open it
                if (isRunningOnCen === true) {
                    setTimeout(function () {
                        dialog.center().open();
                    }, cobis.constant.MODAL_MESSAGES_DELAY_TIME);
                } else {
                    dialog.center().open();
                }

                $('.messages-prompt-close-' + random).on('click', function () {
                    deferred.resolve({
                        input: $('#messages-prompt-input-' + random).val(),
                        buttonIndex: $(this).index()
                    });
                    dialog.destroy();
                });
            }
            return deferred.promise();
        },
        confirm: function (message, title, buttonLabels) {
            var deferred = $.Deferred(),
                dialog,
                buttonType,
                random,
                buttons;
            buttonLabels = buttonLabels || [cobis.translate("COMMONS.BUTTONS.CMD_CANCEL"), cobis.translate("COMMONS.BUTTONS.CMD_OK")];
            title = title || cobis.translate("COMMONS.CONTAINER.TIT_MESSAGE_WINDOW");
            if (typeof Cordova !== "undefined") {
                navigator.notification.confirm(message, function (index) {
                    deferred.resolve(index);
                }, title, buttonLabels);
            } else {
                // create modal window on the fly
                dialog = $('<div class="cb-has-controlbar" style="padding-left: 60px;" />').kendoWindow({
                    actions: [],
                    modal: true,
                    title: title,
                    width: '300px',
                    resizable: false
                }).getKendoWindow();
                random = Math.floor(Math.random() * 1000) + 1;
                // set buttons
                buttons = [];
                $.each(buttonLabels, function (index) {
                    buttonType = buttonLabels.length == index + 1 ? 'btn-primary' : 'btn-default';
                    buttons.push('<button class="messages-prompt-close-' + random + ' btn ' + buttonType + '">' + this + '</button>');
                });

                // set the content
                dialog.content('<span class="glyphicon glyphicon-info-sign text-info" style="font-size: 32px; position: absolute; margin-left: -40px; margin-top: 20px;"></span>' + message + '<div class="cb-form-controlbar btn-toolbar">' + buttons.join('') + '</div>');

                // center it and open it
                if (isRunningOnCen === true) {
                    setTimeout(function () {
                        dialog.center().open();
                    }, cobis.constant.MODAL_MESSAGES_DELAY_TIME);
                } else {
                    dialog.center().open();
                }

                $('.messages-prompt-close-' + random).on('click', function () {
                    deferred.resolve({
                        buttonIndex: $(this).index()
                    });
                    dialog.destroy();
                });
            }
            return deferred.promise();
        },
        loading: function (show, style) {
            var className = "";
            if (angular.isDefined(style)) {
                if (style == "blank") {
                    className = " cb-view-loading-preload";
                } else if (style == "none") {
                    className = " loading-section-div ng-scope";
                } else {
                    className = "";
                }
            }
            if (show) {
				$("div[id^='loader'].loading-div").show();
				$('body .cb-view-loading').remove();
				$('body').append('<div class="cb-view-loading' + className + '"><div class="cb-view-loading-icon"></div></div>');
			} else {
				 $("div[id^='loader'].loading-div").hide();
				$('body .cb-view-loading').fadeOut(function () {
					$(this).remove();
				});
			}
        }
    };

    cobis.container = {
        menu: {
            hide: function () {
                cobis.containerScope.currentNavOption = null;
                cobis.containerScope.$apply();
            },
            show: function (panelType) {
                if (panelType == undefined || panelType == null) {
                    panelType = cobis.panelTypes.MENU;
                }
                cobis.containerScope.currentNavOption = cobis.containerScope.navigation.navOptions[panelType];
                cobis.containerScope.$apply();
            }
        },
        lockScreen: function () {
            cobis.containerScope.lockScreen.setVisible();
        },
        tabs: {
            stopTabLoading: function (tab) {
                tab.loading = false;
            },
            setCurrentTab: function (menuItem, newTab, token) {
                var injector = angular.element(document).injector(),
                    sce = injector.get('$sce'),
                    stopExecute = false,
                    tab,
                    currentIndex,
                    that;
                // var token = data.data;
                if (typeof menuItem == 'object') {
                    tab = angular.copy(menuItem);
                    if (token) {
                        tab.url = tab.url.replace("token", "token=" + token);
                    }

                    if (newTab || cobis.containerScope.shellTabs.length == 0) {
                        cobis.containerScope.shellTabs.push(tab);
                    } else if (!newTab) {
                        if (cobis.containerScope.currentTab.onTabClosing) {
                            stopExecute = true;
                            that = this;
                            cobis.containerScope.currentTab.onTabClosing(cobis.closingReason.NEW_TAB)
                                .then(function () {
                                    currentIndex = that.getCurrentTabIndex();
                                    if (currentIndex >= 0) {
                                        cobis.containerScope.shellTabs[currentIndex] = tab;
                                        tab.url = sce.getTrustedResourceUrl(tab.url);
                                        tab.loading = true;
                                        tab.guid = cobis.utils.getGuid();
                                        cobis.containerScope.currentTab = tab;
                                        cobis.containerScope.$apply();
                                    }
                                });
                        } else {
                            currentIndex = this.getCurrentTabIndex();
                            if (currentIndex >= 0) {
                                cobis.containerScope.shellTabs[currentIndex] = tab;
                            }
                        }

                    }
                } else {
                    stopExecute = true;
                    tab = cobis.containerScope.shellTabs[menuItem];
                    cobis.containerScope.currentTab = tab;
                }
                if (!stopExecute) {
                    tab.url = sce.getTrustedResourceUrl(tab.url);
                    if (tab.url.indexOf('.html') > -1) {
                        tab.loading = true;
                    }
                    tab.guid = cobis.utils.getGuid();
                    cobis.containerScope.currentTab = tab;
                }
            },
            removeTab: function (index, requestFromContainer, reason) {
                if (reason == cobis.closingReason.LOGOUT && index != this.getCurrentTabIndex()) {
                    this.setCurrentTab(index); 
                }
                if (cobis.containerScope.currentTab.onTabClosing) {
                    var that = this;
                    cobis.containerScope.currentTab.onTabClosing(reason || cobis.closingReason.REMOVE_TAB)
                        .then(function () {
                            if (cobis.containerScope.shellTabs.length > 1) {
                                if (index > 0 && index == that.getCurrentTabIndex()) {
                                    that.setCurrentTab(index - 1);
                                } else if (index == 0 && index == that.getCurrentTabIndex()) {
                                    that.setCurrentTab(index + 1);
                                }
                            }
                            cobis.containerScope.shellTabs.splice(index, 1);
                            cobis.containerScope.$apply();
                            if (reason == cobis.closingReason.LOGOUT) {
                                cobis.containerScope.onSelectionLogout();
                            }
                        });
                } else {
                    if (cobis.containerScope.shellTabs.length > 1) {
                        if (index > 0 && index == this.getCurrentTabIndex()) {
                            this.setCurrentTab(index - 1);
                        } else if (index == 0 && index == this.getCurrentTabIndex()) {
                            this.setCurrentTab(index + 1);
                        }
                    }
                    cobis.containerScope.shellTabs.splice(index, 1);
                    if (reason == cobis.closingReason.LOGOUT) {
                        cobis.containerScope.onSelectionLogout();
                    }
                }
                if (requestFromContainer === undefined || !requestFromContainer) {
                    cobis.containerScope.$apply();
                }

            },
            removeTabObject: function (tab, reason) {
                var index;
                cobis.containerScope.shellTabs.forEach(function (shellTab, tabIndex) {
                    if (tab.guid === shellTab.guid) {
                        index = tabIndex;
                    }
                });
                if (index != undefined && tab.isFromDesigner !== undefined && tab.isFromDesigner != false) {
                    cobis.container.tabs.removeTab(index, false, reason);
                } else if (index != undefined) {
                    cobis.container.tabs.removeTab(index, true, reason);
                }
            },
            getCurrentTabIndex: function () {
                var currentIndex = -1,
                    i,
                    tot;
                /*
                 * $.each(cobis.containerScope.shellTabs, function(index){
                 * if (this==cobis.containerScope.currentTab) { currentIndex =
                 * index; return false; } });
                 */ // ABU se cambia la implementacion de jquery for un
                // loop normal para evitar dependencia jquery

                for (i = 0, tot = cobis.containerScope.shellTabs.length; i < tot; i = i + 1) {
                    if (cobis.containerScope.shellTabs[i] == cobis.containerScope.currentTab) {
                        currentIndex = i;
                        return currentIndex;
                    }
                }
                return currentIndex;
            },
            getCurrentTab: function () {
                if (angular.isDefined(cobis.containerScope) && cobis.containerScope != null) {
                    return cobis.containerScope.currentTab;
                } else {
                    return null;
                }
            },
            openNewTab: function (id, url, title, isTranslated, parameters) {
                var menuItem = {
                    id: id,
                    url: url,
                    name: title,
                    isTranslated: isTranslated,
                    parameters: parameters
                };
                this.openTab(menuItem);
            },
            openTab: function (menuItem) {
                // the parameters should be concatenated to the url as query
                // string
                var url, p;
                if (menuItem.parameters !== undefined) {
                    url = menuItem.url + '?';
                    for (p in menuItem.parameters) {
                        if (menuItem.parameters.hasOwnProperty(p)) {
                            url += p + "=" + menuItem.parameters[p] + "&";
                        }
                    }
                    menuItem.url = url;
                }
                cobis.containerScope.multipage.setCurrentTab(menuItem, true);
                cobis.containerScope.$apply();
            },
            openCENTab: function (pageId, parameters) {
                // Validate if the page is running on CEN
                if (isRunningOnCen) {
                    parameters.fromCEW = 'yes';
                    window.external.LoadPageById(pageId, JSON.stringify(parameters), true);
                } else {
                    var msgTitle = cobis.translate('COMMONS.TABS_SECTION.TIT_CEN_TAB_NOT_ALLOWED'),
                        msgMessage = cobis.translate('COMMONS.TABS_SECTION.MSG_CEN_TAB_NOT_ALLOWED');
                    cobis.showMessageWindow.alertError(msgMessage, msgTitle);
                }
            },
            changeCurrentTab: function (id, url, title, isTranslated) {
                var menuItem = {
                    id: id,
                    url: url,
                    name: title,
                    isTranslated: isTranslated
                };
                // this.setCurrentTab(menuItem,false);
                // Se cambia la llamada a la funcion del controlador para
                // aprovechar la validacion de session.
                cobis.containerScope.multipage.setCurrentTab(menuItem, false);
                cobis.containerScope.$apply();
            },
            setCurrentTabByIndex: function (index) {
                cobis.containerScope.multipage.setCurrentTab(index, false);
                cobis.containerScope.$apply();
            }
        }
    };

    if (isRunningOnCen && isCENLogEnabled) {
        window.onerror = function (msg, url, line) {
            window.external.LogBaseError(msg, url, line);
            return true;
        };
    }
	
	var clientLocalizationInfo = cobis.userContext.getValue(cobis.constant.CLIENT_LOCALIZATION_INFORMATION_SYNC);
	if(clientLocalizationInfo === null && cobis.userContext.getValue(cobis.constant.USER_NAME) !== null &&  
		cobis.userContext.getValue(cobis.constant.USER_ROLE) !== null && cobis.userContext.getValue(cobis.constant.USER_OFFICE)!==null){
		var clientLocalizationInfoDto = {
				dateFormat : cobis.userContext.getValue(cobis.constant.DATE_FORMAT),
				dateFormatPlaceholder: cobis.userContext.getValue(cobis.constant.DATE_FORMAT_PLACEHOLDER),
				currency :{
					symbol: cobis.userContext.getValue(cobis.constant.CURRENCY_SYMBOL),
					groupSeparator: cobis.userContext.getValue(cobis.constant.CURRENCY_GROUP_SEPARATOR),
					decimalSeparator: cobis.userContext.getValue(cobis.constant.CURRENCY_DECIMAL_SEPARATOR),
					decimalPlaces : cobis.userContext.getValue(cobis.constant.CURRENCY_DECIMAL_PLACES)	
				}
		};
		$.ajax({
			url: "${contextPath}/resources/cobis/web/container/setClientLocalizationInformation",
			 headers: { 
				'Accept': 'application/json',
				'Content-Type': 'application/json' 
			},
			data:JSON.stringify(clientLocalizationInfoDto),
			type: "POST",
			dataType: "json"
		}).then(function(data) {
			cobis.userContext.setValue(cobis.constant.CLIENT_LOCALIZATION_INFORMATION_SYNC,true);
		}, function(err){
			cobis.userContext.setValue(cobis.constant.CLIENT_LOCALIZATION_INFORMATION_SYNC,null);
			});
	} 
		
	
    //prevent browser back action when backspace has been pressed
    $(document).on("keydown", function (e) {
        if ((e.which === 8 && !$(e.target).is("input, textarea")) || (event.keyCode === 37 && event.altKey)) {
            e.preventDefault();
        }
        if ((e.which || e.keyCode) >= 112 && (e.which || e.keyCode) <= 123) {
  			e.preventDefault(); 
        }
        var debuggingMode = sessionStorage.getItem('debuggingMode');
        if (!(debuggingMode === 'true')) {
            if (e.keyCode === 123) {
                e.preventDefault();
            }
        }
    });

    /*
        window.onunload = function () {
            var index = cobis.containerScope.shellTabs.length - 1;
            while (index >= 0) {
                cobis.containerScope.multipage.removeTab(index--, cobis.closingReason.BROWSER);
            }
        };
        */
}(window.angular, window.kendo, window.kendo.jQuery));