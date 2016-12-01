/*
    This service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    angular.module('APTPS_ngCPQ').service('OptionGroupDataService', OptionGroupDataService); 
    OptionGroupDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'RemoteService', 'MessageService', 'OptionGroupCache'];
    function OptionGroupDataService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService, OptionGroupCache) {
        var service = this;
        
        var Selectedoptionproduct = {};
		var SelectedoptionGroupproduct = {};
        var currentproductoptiongroups = {};
        var rerenderHierarchy = false;
        var slectedOptionGroupProdId;
        var maxSubBundleLevel = 5;
        var currentSubBundleLevel = 0;
		var showOptions = true;
		var isZLocSet = false;
		var LocationAValue = '';
		var LocationZValue = '';
		var currentOptionGroupName = '';
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		//var seatTypeCount = 0;
		var LocalAccessComponentId = '';
		var L3PPPortType = '';
		var isQuantityChange = false;
        var SelectedLineItemOption = {};
        var hideOptionAttributes = false;
		var hideClonedOptionAttributes = true;
        var reRenderClonedGrp = false;
		var showCoSSelectionError = false;

        // option group methods.
        service.getallOptionGroups = getallOptionGroups;
        service.getOptionGroup = getOptionGroup;
        //service.runConstraintRules = runConstraintRules;
        service.getSelectedoptionproduct = getSelectedoptionproduct;
        service.setSelectedoptionproduct = setSelectedoptionproduct;
        service.getcurrentproductoptiongroups = getcurrentproductoptiongroups;
        service.getrerenderHierarchy = getrerenderHierarchy;
        service.setrerenderHierarchy = setrerenderHierarchy;
        service.getslectedOptionGroupProdId = getslectedOptionGroupProdId;
        service.setslectedOptionGroupProdId = setslectedOptionGroupProdId;
		service.setZLocationFlag = setZLocationFlag;
		service.getAttributeLocation = getAttributeLocation;
		service.LocationAValue = LocationAValue;
		service.LocationZValue = LocationZValue;
		service.currentOptionGroupName = currentOptionGroupName;
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		//service.getTotalSeatValidation = getTotalSeatValidation;
		//service.seatTypeCount = seatTypeCount;
		
		service.getProdOptionsCascade = getProdOptionsCascade;
        service.getAllProductIds = getAllProductIds;
        service.getAllSelectedOptions = getAllSelectedOptions;
		service.portOptions = portOptions;
		service.L3PPPortSelected = L3PPPortSelected;
		service.isQuantityChange = isQuantityChange;
        service.getSelectedLineItemOption = getSelectedLineItemOption;
        service.setSelectedLineItemOption = setSelectedLineItemOption;
        service.setHideOptionAttributes = setHideOptionAttributes;
        service.getHideOptionAttributes = getHideOptionAttributes;
		service.setHideClonedOptionAttributes = setHideClonedOptionAttributes;
        service.getHideClonedOptionAttributes = getHideClonedOptionAttributes;
		service.quantityValidationFromOptionLine = quantityValidationFromOptionLine;
		service.readOnlyValidation = readOnlyValidation;
		service.setSelectedoptionGroupproduct = setSelectedoptionGroupproduct;
		service.getSelectedoptionGroupproduct = getSelectedoptionGroupproduct;
		service.getLineItems = getLineItems;
		service.allowGroupingAttributes = allowGroupingAttributes;
		//service.hideClonedOptionAttributes = hideClonedOptionAttributes;
        service.getReRenderClonedGroups = getReRenderClonedGroups;
        service.setReRenderClonedGroups = setReRenderClonedGroups; 
		service.quoteSoruceCodeValidation = quoteSoruceCodeValidation;
		service.getLineItemsValidation = getLineItemsValidation;
		service.showCoSSelectionError = showCoSSelectionError;
		service.setInvalidAccessEVCFlag = setInvalidAccessEVCFlag;

        function getallOptionGroups(){
            return OptionGroupCache.getOptionGroups();
        }
		
		function setZLocationFlag(optionGroups){
			_.each(optionGroups, function(group){
				if(group.groupName.indexOf('Location Z') != -1){
					isZLocSet = true;
				}					
				_.each(group.productOptionComponents, function(optionComponent){
					if(optionComponent.productId == group.selectedproduct){
						optionComponent['isLocationZ'] = isZLocSet;
					}
				});
			});
		}

        /* recurvive function to query all option groups on page load
           will load upto 5 levels */
        function getOptionGroups(productIds, deferred) {
            if (!deferred) {
                deferred = $q.defer();
            }

            var optionGroupRequest = {
                                      productIds: productIds
                                      , cartId: BaseConfigService.cartId  
                                      , lineNumber: BaseConfigService.lineItem.lineNumber
                                    };
            var requestPromise = RemoteService.getProductoptiongroupsData(optionGroupRequest);
            requestPromise.then(function(response) {
                OptionGroupCache.initializeOptionGroups(response);
                var cachedOptionGroups = OptionGroupCache.getOptionGroups();
                var alloptionProductIds_hasOptions = OptionGroupCache.getProductIdsofBundles();
                var prodIds_filtered = _.difference(alloptionProductIds_hasOptions, _.keys(cachedOptionGroups)); 
                if (prodIds_filtered.length > 0
                    && currentSubBundleLevel < maxSubBundleLevel) {
                    getOptionGroups(prodIds_filtered, deferred);
                    currentSubBundleLevel++;    
                }
                else{
                    deferred.resolve();
                    BaseService.setOptionGroupLoadComplete();
                    return deferred.promise;
                }
            });

            deferred.notify();
            return deferred.promise;
        }

        function getOptionGroup(productId, forceUpdate) {
            if(forceUpdate)
                OptionGroupCache.isValid = false;

            var cachedOptionGroups = OptionGroupCache.getOptionGroups();
            if (OptionGroupCache.isValid
                && _.has(cachedOptionGroups, productId)){
                setcurrentproductoptiongroups(cachedOptionGroups[productId]);
                return $q.when(true);
            }

            var bundleproductIds = [];
            bundleproductIds.push(productId);
            return getOptionGroups(bundleproductIds).then(function(response){
                cachedOptionGroups = OptionGroupCache.getOptionGroups();
                setcurrentproductoptiongroups(cachedOptionGroups[productId]);
                return true;
            })
        }

        function getSelectedoptionproduct() {
            return Selectedoptionproduct;
        }
		
		function getSelectedoptionGroupproduct() {
            return SelectedoptionGroupproduct;
        }

        function setSelectedoptionproduct(optionComponent, optionGroupName, dontFireSave, lineItem) {
            Selectedoptionproduct = {
                'productId': optionComponent.productId,
                'productName': optionComponent.productName,
                'componentId': optionComponent.componentId,
                'optionGroupName': optionGroupName,
                'dontFireSave': dontFireSave,
                'lineItemId': lineItem ? lineItem.lineItemId : undefined,
				'quoteSourceCode': optionComponent.optionSourceCode
            };
        }
		
		function setSelectedoptionGroupproduct(lineItemsForAttributes, optionGroupName) {
            SelectedoptionGroupproduct = {
				'optionGroupName': optionGroupName,
				'lineItemsForAttributes': lineItemsForAttributes
			};
        }

        function getcurrentproductoptiongroups(){
            return currentproductoptiongroups;
        }

        function setcurrentproductoptiongroups(result){
            currentproductoptiongroups = result;
        }

        // util method. a: option groups, b: field name to access product components, c:field to identify if product is bundle or not, d: field name to access product Id within product component.
        function getAllBundleProductsinCurrentOptiongroups(a, b, c, d){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (g) {
                res.push.apply(res, _.pluck(_.filter(g[b], function(h){
                    return h[c];
                }), d));
            });
            return res;
        }

        function getrerenderHierarchy(){
            return rerenderHierarchy;
        }

        function setrerenderHierarchy(val){
            rerenderHierarchy = val;
        }

        function getslectedOptionGroupProdId(){
            return slectedOptionGroupProdId;
        }

        function setslectedOptionGroupProdId(val){
            slectedOptionGroupProdId = val;
        }

        /*function runConstraintRules(){
            // remote call to save Quote Config.
            var deferred = $q.defer();
            var constraintRuleRequest = {
                                        cartId: BaseConfigService.cartId
                                        , lineNumber: BaseConfigService.lineItem.lineNumber
                                        };
            var requestPromise = RemoteService.runConstraintRules(constraintRuleRequest);
            requestPromise.then(function(result){
                var constraintActionDoList = result.appliedActionDOList;
                var numRulesApplied = 0; //constraintActionDoList.length;
                var allOptionGroups = getallOptionGroups();
                var productIdtoActionDOMap = {};
                
                _.each(constraintActionDoList, function(ActionDo){
                    // get all error messages and add to MessageService.
                    var TriggeringProductIds = ActionDo.TriggeringProductIds;
                    var Message = ActionDo.Message;
                    // possible message types : danger, warning, info, success.
                    var MessageType = ActionDo.MessageType == 'Error' ? 'danger' : ActionDo.MessageType;
                    var ActionType = ActionDo.ActionType;
                    var ActionIntent = ActionDo.ActionIntent;
                    var SuggestedProductIds = ActionDo.SuggestedProductIds;

                    // this is for exclusion and inclusion.
                    if(ActionType == 'Inclusion'
                        || ActionType == 'Exclusion')
                    {
                        _.each(SuggestedProductIds, function(productId){
                            productIdtoActionDOMap[productId] = {'ActionType': ActionType, 'ActionIntent': ActionIntent, 'Message':Message, 'MessageType':MessageType};
                        })    
                    }

                    // for Validations, Recommendation and Replacement
                    if(ActionType == 'Validation'
                        || ActionType == 'Recommendation')
                        // || ActionType == 'Replacement')
                    {
                        switch(ActionIntent)
                        {
                            case 'Auto Include':
                                break;
                            case 'Prompt':
                                break;
                            case 'Show Message':
                                if(ActionType == 'Validation'){
                                    MessageService.addMessage(MessageType, Message);
                                }
                                else if(ActionType == 'Recommendation'){
                                    MessgeService.addMessa('notice', Message);
                                }
                                numRulesApplied++;
                                break;
                            case 'Check on Finalization':
                                break;
                        }
                    }
                })

                // exclude or include products according to productIdtoActionDOMap.
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            // Enable all previously disabled options. and exclude/include based on constraint rule action info's.
                            if(_.has(productcomponent, 'isDisabled')
                                && productcomponent['isDisabled'] == true)
                            {
                                productcomponent['isDisabled'] = false;
                            }
                            var productId = productcomponent.productId;
                            if(_.has(productIdtoActionDOMap, productId))
                            {
                                var ActionDO = productIdtoActionDOMap[productId];
                                var ActionType = ActionDO.ActionType;
                                var ActionIntent = ActionDO.ActionIntent;
                                var Message = ActionDO.Message;
                                var MessageType = ActionDO.MessageType
                                // possible values : Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection
                                switch(ActionIntent)
                                {
                                    case 'Auto Include':
                                        if(ActionType == 'Inclusion')
                                        {
                                            // apply only if option is not selected.
                                            if(!isProdSelected(productcomponent, optiongroup))
                                            {    
                                                
                                                numRulesApplied++;

                                                // if product is radio then include using group by setting selectedproduct.
                                                if(optiongroup.ischeckbox == false)
                                                {
                                                   optiongroup.selectedproduct = productcomponent.productId;
                                                }
                                                else{
                                                    // if product is checkbox then include it.
                                                    productcomponent.isselected = true;
                                                }
                                            }
                                        }
                                        break;
                                    case 'Prompt':
                                        break;
                                    case 'Show Message':
                                        if(ActionType == 'Inclusion'
                                            || ActionType == 'Exclusion')
                                        {
                                            MessageService.addMessage(MessageType, Message);
                                            numRulesApplied++;
                                        }
                                        break;
                                    case 'Check on Finalization':
                                        break;
                                    case 'Disable Selection':
                                        if(ActionType == 'Exclusion')
                                        {
                                            // apply rule only if option is selected.
                                            if(isProdSelected(productcomponent, optiongroup))
                                            {
                                                // MessageService.addMessage(MessageType, Message);
                                                numRulesApplied++;
                                                
                                                // if disabled product is selected as radio then remove it.
                                                if(optiongroup.ischeckbox == false)
                                                {
                                                   optiongroup.selectedproduct = null;
                                                }
                                                else{
                                                    // if disabled product is selected as checkbox then remove it.
                                                    productcomponent.isselected = false;
                                                }
                                            }
                                            productcomponent['isDisabled'] = true;
                                        }
                                        break;
                                };
                            }
                        })
                    })
                })
                
                res = {isSuccess:true, numRulesApplied:numRulesApplied};
                deferred.resolve(res);
            })// end of runConstraintRules remote call.
            return deferred.promise;
        }*/
		
		function getAttributeLocation(selectedLoc, allLocations, configPAVs){
			var currentAttributeLocation = '';
			var locZId = '';
			var locZValue = '';
			
			if(_.isEmpty(service.LocationZValue)){
				_.each(configPAVs, function(locItem){
					if(_.has(locItem, 'Location_Z__c')){
						locZId = locItem['Location_Z__c'];
					}
				});
				if(!_.isEmpty(locZId)){
					_.each(allLocations, function(locItem){
						if(locItem.Id == locZId)
							locZValue = locItem;
					});
				}
				
			}else{
				_.each(allLocations, function(locItem){
					if(locItem.Name == service.LocationZValue)
						locZValue = locItem;
				});
			}			
			
			if(!_.isEmpty(service.currentOptionGroupName)){
				if(service.currentOptionGroupName.indexOf('Location Z') != -1 && !_.isEmpty(locZValue)){					
					currentAttributeLocation = locZValue;					
				}else{
					currentAttributeLocation = selectedLoc;
				}
			}
			return currentAttributeLocation;
		}

        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected && optiongroup.ischeckbox)
                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
            return true;
            return false;
        }
		
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		function getTotalSeatValidation(currentOptionGroups){
			var seatCount = 0;
			_.each(currentOptionGroups, function(groups){
                _.each(groups.productOptionComponents, function(optionItem){
                    if(groups.ischeckbox){
                        if(optionItem.includeInTotalSeatsCalc && optionItem.isselected){
                            seatCount += optionItem.quantity;
                        }
                    }else{
                        if(groups.hasOwnProperty('selectedproduct')){
                            if(groups.selectedproduct != null || groups.selectedproduct != '' || groups.selectedproduct != 'undefined'){
                                if(groups.selectedproduct == optionItem.productId  && optionItem.includeInTotalSeatsCalc){
                                    seatCount += optionItem.quantity;
                                }
                            }
                        }
                    }                   
                });
            });
			
			service.seatTypeCount = seatCount;
			
			return seatCount;
		}
		*/
		function getProdOptionsCascade(prodOptions, quantityCascade){
			_.each(prodOptions, function(optionGrps){
				_.each(optionGrps.productOptionComponents, function(item){
					if(item.isselected && item.includeInTotalSeatsCalc)
						item.quantity = quantityCascade;
				});
			});
			return prodOptions;
		};

        function getAllProductIds(){
            return OptionGroupCache.getAllProductIds();   
        };
		
        function getAllSelectedOptions(){
            var res = [];
            _.each(getallOptionGroups(), function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(isProdSelected(productcomponent, optiongroup))
                        {
                            res.push(productcomponent.productId);
                        }
                    })
                })
            })
            return res;
        };
		
		function portOptions(currentproductoptiongroups){
			var LocalAccessComponent = '';
			_.each(currentproductoptiongroups, function(item){
				if((!_.isEmpty(item.selectedproduct) || item.selectedproduct != null) && item.groupName == 'Local Access'){
					_.each(item.productOptionComponents, function(component){
						if(component.productId == item.selectedproduct){
							LocalAccessComponent = component.componentId;
						}
					})
				}
			});
			return LocalAccessComponent;
		}
		
		function L3PPPortSelected(currentproductoptiongroups){
			var L3PPPortTypeComponent = '';
			_.each(currentproductoptiongroups, function(item){
				if((!_.isEmpty(item.selectedproduct) || item.selectedproduct != null) && item.groupName == 'Port Type'){
					_.each(item.productOptionComponents, function(component){
						if(component.productId == item.selectedproduct){
							L3PPPortTypeComponent = component.componentId;
						}
					})
				}
			});
			return L3PPPortTypeComponent;
		}

        function getSelectedLineItemOption() {
            return SelectedLineItemOption;
        }

        function setSelectedLineItemOption(lineItem, optionGroup, optionGroupName) {
            SelectedLineItemOption = {'productId':lineItem.optionId, 'productName': lineItem.productName, 'lineItemId':lineItem.lineItemId,'componentId':lineItem.componentId,  'optionGroupName':optionGroupName};
        }
		
        function setHideOptionAttributes(bool){
            hideOptionAttributes = bool;
        }

        function getHideOptionAttributes(){
            return hideOptionAttributes;
        }
		
		function setHideClonedOptionAttributes(bool){
			hideClonedOptionAttributes = bool;
		}
		
		function getHideClonedOptionAttributes(){
            return hideClonedOptionAttributes;
        }
		
		function quantityValidationFromOptionLine(currentproductoptiongroups){
			var getQuantityForAllOptions = {};
			_.each(currentproductoptiongroups, function(opGroup){
				if(_.has(opGroup,'optionLines')){
					_.each(opGroup.optionLines, function(opLine){
						getQuantityForAllOptions[opLine.componentId] = opLine.quantity;
					});
				}
			});
			
			if(!_.isUndefined(getQuantityForAllOptions) && !_.isEmpty(getQuantityForAllOptions)){
				_.each(currentproductoptiongroups, function(opGroup){
					_.each(opGroup.productOptionComponents, function(opComponent){
						opComponent.quantity = getQuantityForAllOptions[opComponent.componentId];
					});
				});
			}
			
			return currentproductoptiongroups;
		}
		
		function readOnlyValidation(pcComponent, optionGroups){
			var currentProductId = pcComponent.productId;
			var isCurrentProdSelected = false;
			
			_.each(optionGroups, function(group){
				if(group.ischeckbox){
					_.each(group.optionLines, function(option){
						if(option.productId == currentProductId && option.isselected){
							isCurrentProdSelected = true;
							return isCurrentProdSelected;
						}
					});
				}else{
					if(_.has(group, 'selectedproduct')){
						if(group.selectedproduct == currentProductId){
							isCurrentProdSelected = true;
							return isCurrentProdSelected;
						}
					}
				}
			});
			
			return isCurrentProdSelected;
		}
		
		function getLineItems(pcComponent, optionGrpName, allOptionAttribute){
			var requestPromise = RemoteService.getAllLineItems(BaseConfigService.cartId, BaseConfigService.lineItem.lineNumber);
			requestPromise.then(function(response){
				if(!_.isEmpty(response) && !_.isUndefined(response)){
					var lineItemsForAttributes = [];
					_.each(response, function(item){
						if(item.optionId == pcComponent.productId)
							lineItemsForAttributes.push(item);
					});					
					service.setSelectedoptionGroupproduct(lineItemsForAttributes, optionGrpName);
				}
			});
		}
		
		function getLineItemsValidation(){
			/*var requestPromise = RemoteService.getAllLineItems(BaseConfigService.cartId, BaseConfigService.lineItem.lineNumber);
			requestPromise.then(function(response){
				return response;
			});
			*/
			//return RemoteService.getAllLineItems(BaseConfigService.cartId, BaseConfigService.lineItem.lineNumber);
			return RemoteService.getLineItems(BaseConfigService.cartId, BaseConfigService.lineItem.lineNumber);
		}
		
		function allowGroupingAttributes(optionGroups){
			_.each(optionGroups, function(group){
				if(_.has(group, 'optionLines')){
					_.each(group.optionLines, function(comp){
						if(comp.lineItemsCount > 1 && comp.hasAttributes){
							comp['allowGrouping'] = true;
						}else{
							comp['allowGrouping'] = false;
						}
					});
				}
			});
		}
		
		function setReRenderClonedGroups (val) {
            reRenderClonedGrp = val;
        }

        function getReRenderClonedGroups () {
            return reRenderClonedGrp;
        }
		
		function quoteSoruceCodeValidation(optionGrps){
			if(!_.isUndefined(optionGrps) && !_.isNull(optionGrps)){
				_.each(optionGrps, function(group){
					_.each(group.optionLines, function(item){
						if(!_.has(item, 'optionSourceCode'))
							item.optionSourceCode = 'None';
					});
				});
			}
		}

		function setInvalidAccessEVCFlag(invalidFlag, cosLine){
			var allOptionGroups = getallOptionGroups();
			var evcOptionGroup = {}; 
			_.each(allOptionGroups, function(optionGroups){
				evcOptionGroup = _.findWhere(optionGroups, {groupName:"EVC(s)"});
				if(!evcOptionGroup || !cosLine.lineItem)
					return;
				_.each(evcOptionGroup.optionLines, function(optionLine){
					if(optionLine.lineItem.primaryLineNumber == cosLine.lineItem.parentBundleNumber && optionLine.originalPComponent){
						optionLine.originalPComponent.evcHasError = invalidFlag;
					}
				});
			});
		}
    }
})();