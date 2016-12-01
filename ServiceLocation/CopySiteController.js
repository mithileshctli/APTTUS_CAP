(function() {
    var CopySiteController;

    CopySiteController = function($scope, $window, $log, $dialogs, $modal, $modalInstance, SystemConstants, BaseService, BaseConfigService, LocationDataService, RemoteService) {
        // all variable intializations.
        $scope.init = function(){
            LocationDataService.getlocItems().then(function(result) {				
                $scope.copyLocItems = LocationDataService.specialCharsValidation(result);
				$scope.setLocsFalse();
				$scope.sortLocations();
				$scope.displayCopyLocItems = $scope.sortedLocations;
				$scope.validate(BaseConfigService.proposal.Id,BaseConfigService.cartId,BaseConfigService.proposal.Id, BaseConfigService.lineItem.lineNumber);
				$scope.copySearchText = '';
            })
            
            $scope.newserviceLocationURL = BaseConfigService.newLocationURL;
			$scope.baseUrl = SystemConstants.baseUrl+'/Templates/dirPaginationTpl.html';
			$scope.selectedCopyLocations = [];
			$scope.selectedLocationCount = 0;
        }
        $scope.init();
		
		$scope.validate = function(prodId, configurationId, qproposalId, bundleLineNumber){
		    
    		var selectedLOCDataRequest = {    productId: prodId
                                            , configId: configurationId
                                			, proposalId: qproposalId
                                            , bundleNumber: bundleLineNumber};
					
			var requestPromise = RemoteService.getSelectedLocationData(selectedLOCDataRequest);
			console.log("sel loc: "+LocationDataService.getselectedlpaId());
			requestPromise.then(function(selLocDataResult){
			    console.log('$scope.displayCopyLocItems size before : '+$scope.displayCopyLocItems.length);
				var selectedLocAttr = LocationDataService.getselectedlpaId();
				if(typeof selectedLocAttr != 'undefined'){
					selLocDataResult.push(selectedLocAttr);
				}
				console.log('ainside'+selLocDataResult);
				if(selLocDataResult.length > 0){
				    var tempArray = [];
    				_.each($scope.displayCopyLocItems, function(displayedId){
                        var displayId = displayedId.Id;
                        if(!_.contains(selLocDataResult,displayId)){
                            tempArray.push(angular.copy(displayedId));
                        }
    				})
    				$scope.displayCopyLocItems = tempArray;
				}
				console.log('$scope.displayCopyLocItems size after : '+$scope.displayCopyLocItems.length);
			});
		}

        $scope.setCurrentCopylocation = function(la){
			/*
			if(_.isUndefined($scope.selectedCopyLocations)){
				$scope.selectedCopyLocations[la.Id] = la.Id;
			}else{
				if(!_.has($scope.selectedCopyLocations, la.Id)){
					$scope.selectedCopyLocations[la.Id] = la.Id;
				}else{
					$scope.selectedCopyLocations = _.omit($scope.selectedCopyLocations, la.Id);
				}				
			}
			*/
			if(!_.isUndefined($scope.displayCopyLocItems) && !_.isNull($scope.displayCopyLocItems)){
				_.each($scope.displayCopyLocItems, function(item){
					if(item.Id == la.Id && !item.isSelected){
						item.isSelected = true;
						$scope.selectedLocationCount++;
					}else if(item.Id == la.Id && item.isSelected){
						item.isSelected = false;
						$scope.selectedLocationCount--;
					}						
				});
			}
        }
		
		$scope.closeCopyModal = function (){
			$modalInstance.close();
		};
		
		$scope.selectAllLocs = function(){
			$scope.selectedLocationCount = 0;
			if(!_.isUndefined($scope.displayCopyLocItems) && !_.isNull($scope.displayCopyLocItems)){
				_.each($scope.displayCopyLocItems, function(item){
					//$scope.selectedCopyLocations[item.Id] = item.Id;
					item.isSelected = true;
					$scope.selectedLocationCount++;
				});
			}
		}
		
		$scope.deSelectAllLocs = function(){
			if(!_.isUndefined($scope.displayCopyLocItems) && !_.isNull($scope.displayCopyLocItems)){
				_.each($scope.displayCopyLocItems, function(item){
					//$scope.selectedCopyLocations[item.Id] = item.Id;
					item.isSelected = false;
				});
				$scope.selectedLocationCount = 0;
			}
		}
		
		$scope.copySite = function (data){
			var configId = BaseConfigService.cartId;
			var bundleLineNumber = BaseConfigService.lineItem.lineNumber;			
			var selectedLocIds = [];
			
			if(!_.isUndefined($scope.displayCopyLocItems) && !_.isNull($scope.displayCopyLocItems)){
				_.each($scope.displayCopyLocItems, function(item){
					if(_.has(item, 'isSelected')){
						if(item.isSelected)
							selectedLocIds.push(item.Id);
					}
				});
			}
			
			console.log("Proposal Id: "+BaseConfigService.proposal.Id)
			LocationDataService.copySiteLocation(selectedLocIds, configId, bundleLineNumber);
			//$window.location.href = '/'+BaseConfigService.proposal.Id;
			LocationDataService.getCopySiteSelectedLocationData(BaseConfigService.proposal.Id,BaseConfigService.proposal.Id,configId, bundleLineNumber);
			$scope.closeCopyModal();
		};
		
		$scope.setLocsFalse = function(){
			if(!_.isUndefined($scope.displayCopyLocItems) && !_.isNull($scope.displayCopyLocItems)){
				_.each($scope.displayCopyLocItems, function(item){
					item.isSelected = false;
				});
			}
		}
		
		$scope.sortLocations = function(){
			if(!_.isUndefined($scope.copyLocItems) && !_.isNull($scope.copyLocItems)){
				$scope.sortedLocations = _.sortBy($scope.copyLocItems, function(item) {
					return item.Name;
				});
			}			
		}
		
		$scope.clearCopyLocsFilter = function(){
			$scope.sortLocations();
			$scope.displayCopyLocItems = $scope.sortedLocations;
			$scope.copySearchText = '';
		}
		
		$scope.filterCopyLocs = function(){
			$scope.filterCopyLocItems = [];
			if(!_.isUndefined($scope.copySearchText) && !_.isNull($scope.copySearchText)){
				if(!_.isUndefined($scope.copyLocItems) && !_.isNull($scope.copyLocItems)){
					_.each($scope.copyLocItems, function(item){
						if(item.Name.toLowerCase().indexOf($scope.copySearchText.toLowerCase()) != -1)
							$scope.filterCopyLocItems.push(item);
					});
					
					$scope.displayCopyLocItems = $scope.filterCopyLocItems;
					
				}
			}
		}
		
    };
    
    CopySiteController.$inject = ['$scope','$window', '$log', '$dialogs', '$modal', '$modalInstance', 'SystemConstants', 'BaseService', 'BaseConfigService', 'LocationDataService', 'RemoteService'];
    angular.module('APTPS_ngCPQ').controller('CopySiteController', CopySiteController);
}).call(this);