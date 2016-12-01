/**
 * Directive: PageFreezeDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('pageFreeze', PageFreeze);

	PageFreezeCtrl.$inject = ['BaseService', '$scope', 'SystemConstants'];
	
	function PageFreezeCtrl(BaseService, $scope, SystemConstants){
		var freezeCtrl = this;
		$scope.countForFreeze = false;
		$scope.FreezePage = false;
		
		$scope.imagesbaseURL = SystemConstants.baseUrl+'/Images';
		$scope.baseService = BaseService;
        
		 $scope.$watch('baseService.getProgressBarInProgress()', function(newVal, oldVal){
			if((!$scope.countForFreeze || newVal.freezePage) && newVal.status){
				$scope.FreezePage = newVal.status;
				$scope.countForFreeze = true;
			}else{
				$scope.FreezePage = false;
			}            
        });
		
		function init(){    		
        }
		
        init();
		
        return freezeCtrl;
	}

	PageFreeze.$inject = ['SystemConstants'];
	function PageFreeze(SystemConstants){
		// Runs during compile
		return {
			controller: PageFreezeCtrl,
			controllerAs: 'PageFreeze',
			templateUrl: SystemConstants.baseUrl + "/Templates/PageFreezeView.html",
			bindToController: true
		};
	}
}).call(this);