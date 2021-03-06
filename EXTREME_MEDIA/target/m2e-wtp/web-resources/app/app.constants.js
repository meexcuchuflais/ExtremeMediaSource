(function () {
	'use strict';
	// DO NOT EDIT THIS FILE, EDIT THE GULP TASK NGCONSTANT SETTINGS INSTEAD WHICH GENERATES THIS FILE

	var servicePath = {
			login: "http://localhost:8080/EM/ExtremeMedia/service/public/login",
			properties: "http://pc01tec123:9080/CWC/services/resources/cobis/cwc/properties/properties",
			logout: "http://pc01tec123:9080/CWC/services/resources/cobis/cwc/authentication/logout"
		},
		constants = {
			currencydecimalPlaces: "currency.decimalPlaces",
			currencyDecimalSeparator: "currency.decimalSeparator",
			idleTime: "idleTime",
			currencyGroupSeparator: "currency.groupSeparator",
			dateFormat: "dateFormat",
			currencySymbol: "currency.symbol",
			timeOutBeforeLogout: "timeOutBeforeLogout",
			keepAliveInterval: "keepAliveInterval",
			dateFormatPlaceholder: "dateFormatPlaceholder",
			configData: "configData",
			methodPut: "PUT",
			methodGet: "GET",
			methodPost: "POST",
			webserver: "_webserver",
			numberOfTries: "_NumberOfTries",
			culture: "_culture",
			theme: "_theme",
			customerID: "_customerID",
			entity: "_entity",
			profileID: "_profileID",
			firstTime: "_firstTime",
			login: "_login",
			fullName: "_fullName",
			lastAccess: "_lastAccess",
			terminalIp: "_terminalIp"
		};
	var designerViewRoot = 'eee';
	angular
		.module('extreme-media-gary')
		.constant('VERSION', '1.0.0')
		.constant('SERVICE_PATHS', servicePath)
		.constant('CONSTANTS', constants)
		.constant('DESIGNER_VIEW_ROOT', designerViewRoot)
		.constant('DEBUG_INFO_ENABLED', true);
})();