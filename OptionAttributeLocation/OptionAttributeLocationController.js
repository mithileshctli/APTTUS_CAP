/*
    This controller should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    var OptionAttributeLocationController;

    OptionAttributeLocationController = function($scope, $log, $location, BaseService, OptionGroupDataService, LocationDataService, ProductAttributeValueDataService) {
        // all variable intializations.
        $scope.init = function(){
            $scope.optionGroupService = OptionGroupDataService;
			$scope.locationService = LocationDataService; 
			$scope.PAVService = ProductAttributeValueDataService;
            $scope.baseService = BaseService;
			$scope.attributeLocation = '';
			$scope.selectedlpa = {};
			/*$scope.locationService.getlocItems().then(function(result){
                $scope.getAllLocations = result;
            });*/
			$scope.currentLoc = '';
			$scope.configPav = $scope.PAVService.getoptionproductattributevalues();
			$scope.displaylocations = LocationDataService.gethasServicelocations();
        }

        // Load option Groups of Main bundle Product on location load complete.
        $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true)
            {
                $scope.locationService.getlocItems().then(function(result){
                    $scope.getAllLocations = result;
                    // This is for UNI Line Item locations
                    ProductAttributeValueDataService.allLocations = $scope.getAllLocations;
                });
            }    
        });

        $scope.$watch('locationService.getselectedlpa()', function(newVal){
            if(newVal){
                $scope.selectedlpa = newVal;
				$scope.currentLoc = $scope.optionGroupService.getAttributeLocation($scope.selectedlpa, $scope.getAllLocations, $scope.configPav);
				if(!_.isEmpty(newVal))
					$scope.displaylocations = true;
            }    
        });
        
		
        $scope.$watch('optionGroupService.currentOptionGroupName', function(newVal){
			if(newVal){
				$scope.currentLoc = $scope.optionGroupService.getAttributeLocation($scope.selectedlpa, $scope.getAllLocations, $scope.configPav);
			}
		});  
        
        $scope.init();
    };

    OptionAttributeLocationController.$inject = ['$scope', '$log', '$location', 'BaseService', 'OptionGroupDataService', 'LocationDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributeLocationController', OptionAttributeLocationController);
}).call(this);