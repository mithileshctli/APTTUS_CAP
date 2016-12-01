(function() {
    var LocationController;

    LocationController = function($scope, $log, SystemConstants, BaseService, BaseConfigService, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
			LocationDataService.initializeLiteToDetailProductsMap().then(function(){
				LocationDataService.getlocItems().then(function(result) {				
					$scope.locItems = LocationDataService.specialCharsValidation(result);
					$scope.selectedlpa = LocationDataService.getselectedlpa();
					$scope.displaylocations = LocationDataService.getDisplayLocations();
					$scope.isCapReadOnly = BaseService.isCapReadOnly;
				});
            });
            $scope.newserviceLocationURL = BaseConfigService.newLocationURL;
			$scope.baseUrl = SystemConstants.baseUrl+'/Templates/dirPaginationTpl.html';
        }
        $scope.init();

        $scope.setSelectedlocation = function(la){
            LocationDataService.setselectedlpa(la);
        }
    };
    
    LocationController.$inject = ['$scope', '$log', 'SystemConstants', 'BaseService', 'BaseConfigService', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('LocationController', LocationController);
}).call(this);