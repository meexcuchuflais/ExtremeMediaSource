var app = angular.module('perfil', [ 'ngAnimate', 'ui.grid', 'ui.grid.moveColumns', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ui.bootstrap', 'ui.grid.edit' ])

app.controller('MainCtrl', MainCtrl);
app.controller('RowEditCtrl', RowEditCtrl);
app.service('RowEditor', RowEditor);

MainCtrl.$inject = [ '$scope', '$http', '$modal', 'RowEditor', 'uiGridConstants' ];
function MainCtrl($scope, $http, $modal, RowEditor, uiGridConstants) {
	var vm = this;

	vm.editRow = RowEditor.editRow;

	vm.serviceGrid = {
		enableRowSelection : true,
		enableRowHeaderSelection : false,
		multiSelect : false,
		enableSorting : true,
		enableFiltering : false,
		enableGridMenu : true,
		rowTemplate : "<div ng-dblclick=\"grid.appScope.vm.editRow(grid, row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell></div>"
	};

	vm.serviceGrid.columnDefs = [ {
		field : 'ID_PERFIL',
		displayName : 'Id',
		enableSorting : true,
		type : 'number',
		enableCellEdit : false,
		width : 60,
		sort : {
			direction : uiGridConstants.ASC,
			priority : 1,
		},
	}, {
		field : 'NOMBRE_PERFIL',
		displayName : 'Nombre',
		enableSorting : true,
		enableCellEdit : false,
				
	},{
		field : 'DESCRIPCION_PERFIL',
		displayName : 'Descripcion',
		enableSorting : true,
		enableCellEdit : false,
		
	},
	{
		field : 'ESTADO_PERFIL',
		displayName : 'Estados',
		//type : 'number',
		enableSorting : true,
		enableCellEdit : false,
	}];
	
//	vm.serviceGrid.columnDefs = [ {
//		field : 'id',
//		displayName : 'Id',
//		enableSorting : true,
//		type : 'number',
//		enableCellEdit : false,
//		width : 60,
//		sort : {
//			direction : uiGridConstants.ASC,
//			priority : 1,
//		},
//	}, {
//		field : 'exposedws',
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'exposedoperation',
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'version',
//		width : 120,
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'category',
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'exposednamespace',
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'path',
//		enableSorting : true,
//		enableCellEdit : false
//	}, {
//		field : 'provider',
//		enableSorting : true,
//		enableCellEdit : false
//	} ];

	$http.get('http://localhost:8080/EM/ExtremeMedia/service/private/perfil').success(function(response) {
		vm.serviceGrid.data = response;
	});

	$scope.addRow = function() {
//		var newService = {
//			"id" : "0",
//			"category" : "public",
//			"exposednamespace" : "http://bced.wallonie.be/services/",
//			"exposedoperation" : "-",
//			"exposedws" : "-",
//			"path" : "//*[local-name()='-']/text()",
//			"provider" : "BCED",
//			"version" : "1.0"
//		};
		var newService = {
				"id" : "0",
				"Nombre" : "",
				"Descripcion" : "",
				"Estado" : "1",
		
		};
		var rowTmp = {};
		rowTmp.entity = newService;
		vm.editRow($scope.vm.serviceGrid, rowTmp);
	};

}

RowEditor.$inject = [ '$http', '$rootScope', '$modal' ];
function RowEditor($http, $rootScope, $modal) {
	var service = {};
	service.editRow = editRow;

	function editRow(grid, row) {
		$modal.open({
			templateUrl : 'PerfilEdit.html',
			controller : [ '$http', '$modalInstance', 'grid', 'row', RowEditCtrl ],
			controllerAs : 'vm',
			resolve : {
				grid : function() {
					return grid;
				},
				row : function() {
					return row;
				}
			}
		});
	}

	return service;
}

function RowEditCtrl($http, $modalInstance, grid, row) {
	var vm = this;
	vm.entity = angular.copy(row.entity);
	vm.save = save;
	function save() {
		if (row.entity.id == '0') {
			
			
			console.log('entidad',row.entity);
			/*
			 * $http.post('http://localhost:8080/service/save', row.entity).success(function(response) { $modalInstance.close(row.entity); }).error(function(response) { alert('Cannot edit row (error in console)'); console.dir(response); });
			 */
			//http://localhost:8080/EM/ExtremeMedia/service/public/login
				
		    $http.post('http://localhost:8080/EM/ExtremeMedia/service/private/newPerfil', row.entity).success(function(response) 
		    		{ $modalInstance.close(row.entity); }).error(function(response) 
		    				{ alert('Cannot edit row (error in console)'); console.dir(response); });
				 
			row.entity = angular.extend(row.entity, vm.entity);
			//real ID come back from response after the save in DB
			row.entity.id = Math.floor(100 + Math.random() * 1000);
			
			grid.data.push(row.entity);

		} else {
			row.entity = angular.extend(row.entity, vm.entity);
			/*
			 * $http.post('http://localhost:8080/service/save', row.entity).success(function(response) { $modalInstance.close(row.entity); }).error(function(response) { alert('Cannot edit row (error in console)'); console.dir(response); });
			 */
			console.log("UPDATEXXXXXXXXX")
			$http.post('http://localhost:8080/EM/ExtremeMedia/service/private/updatePerfil', row.entity).success(function(response) { $modalInstance.close(row.entity); }).error(function(response) { alert('Cannot edit row (error in console)'); console.dir(response); });
		}
		$modalInstance.close(row.entity);
	}

	vm.remove = remove;
	function remove() {
		console.dir(row)
		if (row.entity.id != '0') {
			row.entity = angular.extend(row.entity, vm.entity);
			var index = grid.appScope.vm.serviceGrid.data.indexOf(row.entity);
			grid.appScope.vm.serviceGrid.data.splice(index, 1);
			/*
			 * $http.delete('http://localhost:8080/service/delete/'+row.entity.id).success(function(response) { $modalInstance.close(row.entity); }).error(function(response) { alert('Cannot delete row (error in console)'); console.dir(response); });
			 */
			$http.post('http://localhost:8080/EM/ExtremeMedia/service/private/deletePerfil',row.entity).success(function(response) { $modalInstance.close(row.entity); }).error(function(response) { alert('Cannot delete row (error in console)'); console.dir(response); });
		}
		$modalInstance.close(row.entity);
	}

}
