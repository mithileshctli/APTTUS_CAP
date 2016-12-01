/**
 * Directive: constraintRecommendation
 * 	used to display constraint rule recommendations.
 */
;(function() {
	'use strict';
	angular.module('APTPS_ngCPQ').directive('constraintRecommendation', ConstraintRecommendation);

	ConstraintRecommendation.$inject = ['SystemConstants'];

	ConstraintRecommendationCtrl.$inject = [
	                           'ConstraintRuleDataService',
	                           'CartDataService'
	                           ];

	
	/**
	 * Modal Dialog Directive
	 */	
	function ConstraintRecommendation(SystemConstants) {
		return {
			restrict: 'AE',
			controller: ConstraintRecommendationCtrl,
			controllerAs: 'recCtrl',
			bindToController: true,
			templateUrl: SystemConstants.baseUrl + "/Templates/constraint-recommendations.html"
		};

	}

	/**
	 * Constraint Recommendation controller
	 */ 
	function ConstraintRecommendationCtrl(ConstraintRuleDataService, CartDataService) {
		var ctrl = this;
		// ctrl.promptMessage;

		ctrl.addSelectedProducts = function(recProductWrap) {
			var action = recProductWrap.action;
			if (action == ConstraintRuleDataService.ACTION_ADDTOCART) { //add as primary line
				CartDataService.addToCart(recProductWrap.productDO);
				
			} else if(action == ConstraintRuleDataService.ACTION_ADDTOBUNDLE){ //add to bundle
				CartDataService.addToBundle(recProductWrap.productDO);
				
			}

			// clear the recommendation once added.
			ConstraintRuleDataService.clearRecommendation(recProductWrap);
		};

		ctrl.hasRecommendations = function(){
			return !_.isEmpty(ConstraintRuleDataService.getRecommendedProductsList());
		}

		ctrl.getproductsWrapList = function(){
			return ConstraintRuleDataService.getRecommendedProductsList();
		}

		return ctrl;
	}
}).call(this);