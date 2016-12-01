/**
 * Directive: ValidateConfigDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('validateConfig', ValidateConfig);

	ValidateConfigController.$inject = ['$scope', 'BaseService', 'SaveConfigService', 'BaseConfigService'];
	
	function ValidateConfigController($scope, BaseService, SaveConfigService, BaseConfigService){
		var validateCtrl = this;
		
		function init(){
			$scope.baseService = BaseService;
		}
		
		validateCtrl.ProgressBartinprogress =function(){
			return BaseService.getProgressBarInProgress().status;
		}

		/*
			Save Config and run constraint rules.
        */
        $scope.$watch('baseService.getisSavecallRequested()', function(newVal, oldVal) {
            if(newVal == true && !BaseConfigService.isLargeQuote)
			{
	            SaveConfigService.saveinformation().then(function(response){
	                if(response == true)
	                {
	                    
	                }
	            })
	            
	            // set save call requested to false.
	            BaseService.setisSavecallRequested(false);
	        }
        });

        /*@Validate
            Save Config and run constraint rules.
        */
        validateCtrl.ValidateConfig = function(){
            SaveConfigService.saveinformation().then(function(response){
                if(response == true)
                {
                    
                }
            })
        }
        
        init();

        return validateCtrl;
	}

	ValidateConfig.$inject = ['SystemConstants'];
	function ValidateConfig(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: ValidateConfigController,
			controllerAs: 'validateCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/ValidateConfigView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);