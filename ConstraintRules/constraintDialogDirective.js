/**
 * Directive: constraintDialog
 * 	used to display constraint rule prompt
 *
 * Harish Emmadi - Commented the prompts on including/excluding Bundle(US25769);
 */
;(function() {
	'use strict';
	angular.module('APTPS_ngCPQ').directive('constraintDialog', ConstraintDialog);

	ConstraintDialog.$inject = ['SystemConstants'];

	ConstraintDialogCtrl.$inject = [
	                           '$log',                            
	                           '$scope',
	                           'ConstraintRuleDataService',
	                           'ProductDataService',
	                           'CartDataService'
	                           ];

	
	/**
	 * Modal Dialog Directive
	 */	
	function ConstraintDialog(SystemConstants) {
		return {
			restrict: 'AE',
			controller: ConstraintDialogCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			templateUrl: SystemConstants.baseUrl + "/Templates/constraint-dialog.html"
		};

	}

	/**
	 * Constraint Dialog controller
	 */ 
	function ConstraintDialogCtrl($log, $scope, ConstraintRuleDataService, ProductDataService, CartDataService) {
		var ctrl = this;
		ctrl.visible = false;
		ctrl.selectedProducts = [];
		ctrl.promptItems = [];
		ctrl.addedItems = {};
		// ctrl.promptMessage;

		ctrl.close = function() {
			ctrl.visible = false;
			ctrl.promptItems.length = 0;
			ctrl.selectedProducts.length = 0;			
			ctrl.addedItems = {};
			ctrl.activePrompt = ConstraintRuleDataService.getNextPrompt();
			if (angular.isDefined(ctrl.activePrompt)) {
				ctrl.visible = true;
			}
			return ctrl.activePrompt;
		};

		/** Perform rule action based on action type */
		ctrl.performRuleAction = function() {
			var actionType = ctrl.activePrompt['ActionType'];
			if (actionType === ConstraintRuleDataService.ACTIONTYPE_INCLUDE
				|| actionType == ConstraintRuleDataService.ACTIONTYPE_RECOMMEND) {
				ctrl.addSelectedProducts();

			} else if (actionType === ConstraintRuleDataService.ACTIONTYPE_EXCLUDE) {
				ctrl.removeSelectedProducts();
			
			}

		}; 

		ctrl.addSelectedProducts = function() {
			var targetBundleNumber = ctrl.activePrompt['TargetBundleNumber'];
			if (!targetBundleNumber) { //add as primary line
				CartDataService.addToCart(angular.copy(ctrl.selectedProducts));
				
			} else { //add to bundle
				CartDataService.addToBundle(ctrl.selectedProducts);
				
			}
			
			/*if (ctrl.minSelected()) {
				ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			}*/
			
			ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			ctrl.close();
			
		};

		ctrl.removeSelectedProducts = function() {
			var targetBundleNumber = ctrl.activePrompt['TargetBundleNumber'];
			if (!targetBundleNumber) {
				//Find affected primary lines with matching products and remove them.
				var selectedProductIds = {};
				_.each(ctrl.selectedProducts, function(product) {
					selectedProductIds.push([product.Id]);
				});

				var affectedPrimaryNumbers = ctrl.activePrompt['AffectedPrimaryNumbers'];
				CartDataService.removeFromCart(affectedPrimaryNumbers, angular.copy(ctrl.selectedProducts));
			
			} else {
				//Handle remove of options from bundle
				CartDataService.removeFromBundle(ctrl.selectedProducts);
				
			}

			/*if (ctrl.minSelected()) {
				ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			}*/

			ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			ctrl.close();

		};

		ctrl.ignoreRuleAction = function() {
			ConstraintRuleDataService.ignoreRuleAction(ctrl.activePrompt);
			ctrl.close();
		};

		ctrl.open = function() {
			ctrl.visible = true;
			return ctrl.visible;
		};

		ctrl.prompt = function() {
			ctrl.addedItems = {};
			//ctrl.selectedProducts.length = 0;
			ctrl.activePrompt = ConstraintRuleDataService.getNextPrompt();
			return ctrl.activePrompt;
		};

		/*ctrl.minSelected = function() {
			if (ctrl.activePrompt) {
				return ctrl.selectedProducts.length >= ctrl.activePrompt[nsPrefix + 'RequiredMin__c'];

			} else {
				return false;

			}

		};*/

		ctrl.selectProduct = function(product) {
			if (_.contains(ctrl.selectedProducts, product)) {
				ctrl.selectedProducts = _.without(ctrl.selectedProducts, _.findWhere(ctrl.selectedProducts, {Id: product.Id}));
				return ctrl.selectedProducts;

			} else {
				return ctrl.selectedProducts.push(product);

			}
		};

		function dialogWatchExpression() {
			return ctrl.prompt();

		}

		function dialogWatchListener(newValue, oldValue) {
			if (newValue) {
				var activePrompt = ctrl.prompt();
				if (activePrompt == null) {
					return ctrl.close();

				}
				ctrl.promptMessage = activePrompt['Message'];
				var actionType = activePrompt['ActionType'];
				var promptProductIds = [];
				
				var allSelectedOptionProducts = CartDataService.getAllSelectedOptions();

				if (actionType == ConstraintRuleDataService.ACTIONTYPE_INCLUDE) {
					//Inclusion type rules
					//var suggestedIdString = activePrompt['SuggestedProductIds'];
					//var suggestedProductIds = suggestedIdString != null ? suggestedIdString.split(/,\W*/) : [];
					var suggestedProductIds = activePrompt['SuggestedProductIds'];
					promptProductIds = suggestedProductIds;
					
					//var affectedIdString = activePrompt['AffectedProductIds'];
					//if (affectedIdString != null) {
					//var affectedProductIds = affectedIdString.split(/,\W*/);
					var affectedProductIds = activePrompt['AffectedProductIds'];
					promptProductIds = _.difference(suggestedProductIds, affectedProductIds);

					//}
					if (activePrompt['TargetBundleNumber']) {
						// dont show if option selection is already made.
						promptProductIds = _.difference(promptProductIds, allSelectedOptionProducts);

						ctrl.ruleActionLabel = 'Add To Bundle';
					
					} else {
						// do not process the rules including bundles.
						promptProductIds.length  = 0;
						ctrl.ruleActionLabel = 'Add To Cart';	

					}
					
				} else if (actionType == ConstraintRuleDataService.ACTIONTYPE_EXCLUDE) {
					//Exclusion type rules
					//var actionIdString = activePrompt[nsPrefix + 'ActionProductIds__c'];
					// should be changed if exclusion does not apply for suggested products.
					//var actionIdString = activePrompt['SuggestedProductIds'];
					//var actionProductIds = actionIdString != null ? actionIdString.split(/,\W*/) : [];
					var actionProductIds = activePrompt['SuggestedProductIds'];
					promptProductIds = actionProductIds;
					
					if (activePrompt['TargetBundleNumber']) {
						// dont show if option selection is not made.
						promptProductIds = _.intersection(promptProductIds, allSelectedOptionProducts);
						
						ctrl.ruleActionLabel = 'Remove Option';
					
					} else {
						// do not process the rules excluding bundles.
						promptProductIds.length  = 0;
						ctrl.ruleActionLabel = 'Remove From Cart';	
						
					}
				
				}
				
				// close the prompt if no promptProductIds.
				if (promptProductIds.length == 0) {
					ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);
					return ctrl.close();

				}
				
				//Changed by David (Dato) Tsamalashvili - US102172  - 10/25/2016
				return ProductDataService.getProducts(promptProductIds).then(function(productsMap) {
					var alreadAddedObjs = [];
					
					_.each(ctrl.promptItems, function(item){
						if(!_.has(alreadAddedObjs, item.id))
							alreadAddedObjs[item.Id] = item.Id;
					});
					
					angular.forEach(productsMap, function(value, key){
						//TODO: check why we get a number, also make sure we only get array not array of array
						
						if (angular.isObject(value)) { 
							if (angular.isArray(value)) {
								angular.forEach(value, function(value2, key2){
									if (ctrl.addedItems[value2.Id] !== true) {
										if(!_.has(alreadAddedObjs, value2.Id)){
											ctrl.promptItems.push(value2);
											ctrl.addedItems[value2.Id] = true;
											alreadAddedObjs[value2.Id] = value2.Id;
										}										
									}	
								});
							} else {
								if (ctrl.addedItems[value.Id] !== true) {
									if(!_.has(alreadAddedObjs, value.Id)){
										ctrl.promptItems.push(value);
										ctrl.addedItems[value.Id] = true;
										alreadAddedObjs[value.Id] = value.Id;
									}										
								}
							}
						}

					});
					return ctrl.open();

				});
			} else {
				return ctrl.close();
			}
		}

		$scope.$watch(dialogWatchExpression, dialogWatchListener);
		return ctrl;
	}
}).call(this);