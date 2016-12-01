//Mithilesh : CGE : US 39917 Implementation

(function() {
    var ReusableUniSelectorController;

    ReusableUniSelectorController = function($scope, $log, $location, $dialogs, $filter, $modalInstance, SystemConstants, ReusableUniSelectorDataService) {
		$scope.defaultOrder = 'Index';
		$scope.sortColumns = ['Index', 'UNIID', 'UNIState', 'AvailVC', 'BWUtilized', 'BWAvailable', 'PhysicalPortType', 'ServiceType', 'Source'];
		$scope.reverse = false;
		
		$scope.init = function(){
			$scope.selectedUni = {UNI: {}};
			$scope.reusableUNIs = ReusableUniSelectorDataService.getReusableUNIs();
			$scope.showSelectedUNILoc = ReusableUniSelectorDataService.getSelectedUNILocation(); 
			$scope.resourceId = ReusableUniSelectorDataService.getResourceId();
			$scope.findSelectedReusableUNI();
			$scope.sort($scope.defaultOrder);
            //$scope.reusableUniSelectorDataService = ReusableUniSelectorDataService;			
		
		}
		//Mithilesh : CGE : US 39917 Implementation
        /*$scope.$watch('ReusableUniSelectorDataService.getReusableUNIs()', function(newValue, oldValue){ 
            if(newValue == true){
				$scope.reusableUNIs = newValue;
				$scope.showPopup();
			}
        });*/
		
		$scope.showSelectedReusableUni = function(){
			if(!_.isEmpty($scope.selectedUni.UNI)){
				return $scope.selectedUni.UNI.EricssonUNIID;
			}

			if(!_.isEmpty($scope.resourceId)){
				return $scope.resourceId+'(Not Found)';
			}

			return '';
		};

		$scope.findSelectedReusableUNI = function(){
			_.each($scope.reusableUNIs, function(uni){
				if(uni.checked){
					$scope.selectedUni.UNI = uni;
				}
			});
		};
		
		$scope.selectReusableUNI = function () {
			var index = $scope.selectedUni.UNI.Index;
			var obj = _.findWhere($scope.reusableUNIs, {Index: index});
            
            if( ! (_.isNull(obj) || _.isUndefined(obj) ) )
            {
                ReusableUniSelectorDataService.setReusableUNIAttributes(obj);


                $modalInstance.close();
            }
            else
                alert('Please choose a UNI');
		};
		
		$scope.dismissReusableUNI = function () {
			//TO-DO : add implementation to change UNI attribute ‘Reuse UNI’ to ‘NO’ : did in PAVAttributeConfigDataService
			$modalInstance.close();
		};
		
		$scope.resetAll = function () {
			$scope.filteredList = $scope.reusableUNIs;
			$scope.Header = [];
			_.each($scope.sortColumns, function(column){
				$scope.Header[column] = '';
			});
		};


		$scope.sort = function (sortBy) { 
			$scope.resetAll();
			$scope.columnToOrder = sortBy;

			//$Filter - Standard Service
			$scope.filteredList = $filter('orderBy')($scope.filteredList, $scope.columnToOrder, $scope.reverse);

			if($scope.reverse)
				iconName = 'glyphicon glyphicon-chevron-up';
			else
				iconName = 'glyphicon glyphicon-chevron-down';

			$scope.Header[sortBy] = iconName;
			$scope.reverse = !$scope.reverse;
		};

		$scope.init();        
    };

    ReusableUniSelectorController.$inject = ['$scope', '$log', '$location', '$dialogs', '$filter', '$modalInstance', 'SystemConstants', 'ReusableUniSelectorDataService'];
    angular.module('APTPS_ngCPQ').controller('ReusableUniSelectorController', ReusableUniSelectorController);
}).call(this);