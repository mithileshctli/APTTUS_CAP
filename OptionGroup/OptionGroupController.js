/*
    This controller should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    var OptionGroupController;

    OptionGroupController = function($scope, $log, $location, $anchorScroll, $dialogs, $timeout, SystemConstants, BaseService, BaseConfigService,
                                     OptionGroupDataService, SensitiveHelpDataService, LocationDataService, LineItemService, LineItemAttributeValueDataService, ProductAttributeValueDataService, MessageService, ProductAttributeConfigDataService) {
        // all variable intializations.
        var remotecallinitiated = false;

        // all variable intializations.
        $scope.init = function(){
            $scope.optionGroupService = OptionGroupDataService;
            $scope.locationService = LocationDataService;
            $scope.baseService = BaseService;
            $scope.lineItemService = LineItemService;
			$scope.PAVService = ProductAttributeValueDataService;
            $scope.imagesbaseURL = SystemConstants.baseUrl+'/Images';
            $scope.currentbundleproductId = '';
            $scope.currentSelectedLineItemPrimaryLineNumber = 0;
            $scope.showCloneButton = true;
			$scope.isTwoUNIELINE = false;
			$scope.renderClonedGRP = false;
			
            // moved the initial load to locationload complete watch below.
            // $scope.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
            $scope.renderClonedLineItems();
			
			//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
            //$scope.totalSeatCount = 0;
            $scope.quantityCascade = 1;
            $scope.cascadeQty = false;
			$scope.attributeLocation = '';
			$scope.isCapReadOnly = BaseService.isCapReadOnly;
        }

        // reload the optionGroups when location section is changed.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && remotecallinitiated == false)
            {   
                $scope.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
            }    
        });

        // Load option Groups of Main bundle Product on location load complete.
        $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && remotecallinitiated == false)
            {   
                $scope.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
            }    
        });

        $scope.$watch('optionGroupService.getslectedOptionGroupProdId()', function(newVal, oldVal) {
            // rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
            if(newVal != oldVal
                && !_.isUndefined(newVal)
                && !_.isNull(newVal))
            {
                $scope.rendercurrentproductoptiongroups(newVal, null, null);
                $scope.renderClonedLineItems();
            }
        });

        $scope.$watch('lineItemService.getReRenderLineItems()', function(newVal, oldVal) {
            if(newVal){
                $scope.renderClonedLineItems($scope.currentSelectedLineItemPrimaryLineNumber);
            }
        });
		
		$scope.$watch('optionGroupService.getReRenderClonedGroups()', function(newVal, oldVal) {
            if(newVal){
				OptionGroupDataService.setReRenderClonedGroups(false);
				//BaseService.setisSavecallRequested(false);
				if((!_.isNull($scope.currentComponent) && !_.isUndefined($scope.currentComponent)) && !_.isNull($scope.currentComponentGrpname) && !_.isUndefined($scope.currentComponentGrpname)){
					$scope.renderClonedGroup($scope.currentComponent, $scope.currentComponentIndex, false, false, $scope.currentComponentGrpname);
				}
				
            }
        });
		
		$scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){
    		if(newValue)
    		{
    			$scope.checkUNIForCELineService();
				$scope.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, 
                                            null, null);
    		}
	    });
		
        $scope.rendercurrentproductoptiongroups = function(bundleproductId, prodcomponent, groupindex, ifParent){
            $scope.quantityCascade = 1;
            // $scope.selectOptionProduct(prodcomponent, groupindex, true);
            $scope.optionGroupService.setslectedOptionGroupProdId(null);// set the selectedOptionGroup to null so tree Tree traversal would work fine.
            $scope.optionGroupService.setHideOptionAttributes(true);

            // run only if location remote call is complete.
            if(BaseService.getLocationLoadComplete() == true)
            {
                var productId = bundleproductId != null ? bundleproductId : prodcomponent.productId;
                var availableProductIds = LocationDataService.getAvailableOptionProducts();
                var hasLocations = LocationDataService.gethasServicelocations();

                //if($scope.currentbundleproductId != productId)
                //{
                remotecallinitiated = true;

                $scope.currentbundleproductId = productId;
                // var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
                // make a remote call to get option groups for all bundles in current option groups.
                $scope.optionGroupService.getOptionGroup(productId).then(function(result) {
                    $scope.selectOptionProduct(prodcomponent, groupindex);
                    $scope.optionGroupService.setrerenderHierarchy(true);
                    $scope.currentproductoptiongroups = $scope.optionGroupService.getcurrentproductoptiongroups();	
						
                    _.each($scope.currentproductoptiongroups, function(group){
                        // when an access type is not available at a location, 'Local Access' options should be disabled.
                        _.each(group.productOptionComponents, function(component){
                            component['isAvailableonSLocation'] = true;
                            if(group.groupName == 'Local Access'
                                && hasLocations
                                && (_.size(availableProductIds) < 0
                                || !_.contains(availableProductIds, component.productId)))
                            {
                                component['isAvailableonSLocation'] = false;
                                if(component.isselected == true)
                                    component.isselected = false;
                                if(group.selectedproduct == component.productId)
                                    group.selectedproduct = null;
                            }

                            // mark all as avaialable...just for testing. - H.E 1028
                            // component['isAvailableonSLocation'] = true;
                        })
                    })

                    $scope.currentSelectedLineItemBandle = LineItemService.getCurrentSelectedLineItemBundle();
                    $scope.configureOptionLines();
					
					
					if(BaseConfigService.proposal.isLargeQuote){
						_.each($scope.currentSelectedLineItemBandle, function(item){
							if(_.has(item, 'errorMessage') && !_.has(item, 'errorMessageType')){
								var values = item.errorMessage.split(',//');
								_.each(values, function(msg){
									MessageService.addMessage('Warning', msg);
								});								
							}else if(_.has(item, 'errorMessage') && _.has(item, 'errorMessageType')){
								var values = item.errorMessage.split(',//');
								_.each(values, function(msg){
									MessageService.addMessage(item.errorMessageType, msg);
								});
							}
						});
					}
					
					_.each($scope.currentproductoptiongroups, function(opGroup){
						_.each(opGroup.productOptionComponents, function(component){
							if(!_.isEmpty($scope.currentSelectedLineItemBandle) && !_.isUndefined($scope.currentSelectedLineItemBandle)){
								_.each($scope.currentSelectedLineItemBandle, function(lineItems){
									if(component.productId == lineItems.optionId){
										if(_.has(lineItems, 'assetLineItemId')){
											if(!_.isEmpty(lineItems.assetLineItemId) && !_.isUndefined(lineItems.assetLineItemId)){
												component['hideLegacyOption'] = false;
											}else{
												if(component.isLegacy){
													component['hideLegacyOption'] = true;
												}else{
													component['hideLegacyOption'] = false;
												}
											}
										}
									}else{
										if(component.isLegacy){
											component['hideLegacyOption'] = true;
										}else{
											component['hideLegacyOption'] = false;
										}
									}
								});
							}else{
								if(component.isLegacy){
									component['hideLegacyOption'] = true;
								}else{
									component['hideLegacyOption'] = false;
								}
							}							
						})
					});

                    $scope.portOptionsValidation();
					$scope.UNIPortOptionBandwidthValidation();
                    $scope.optionGroupService.setZLocationFlag($scope.currentproductoptiongroups);
                    // to hide the optionGroups tab.
                    if($scope.currentproductoptiongroups == 'undefined'
                        || $scope.currentproductoptiongroups == null
                        || $scope.currentproductoptiongroups.lenght == 0){
                        $scope.optionGroupService.showOptions = false;
                    }

                    if(ifParent){
                        $scope.quantityCascade = prodcomponent.quantity;
                        $scope.cascadeQty = true;
                        $scope.cascadeExpressionQty($scope.currentproductoptiongroups, null);
                    }else{
                        $scope.cascadeQty = false;
                    }

                    // As the official documentation states "The remote method call executes synchronously, but it doesn’t wait for the response to return. When the response returns, the callback function handles it asynchronously."
                    // $scope.safeApply();	
					$scope.optionGroupService.allowGroupingAttributes($scope.currentproductoptiongroups);					
					$scope.hideCancelledAssetLines();						
					//Added by David (Dato) Tsamalashvili - DE15266 - 10/24/2016
					$scope.optionGroupService.quoteSoruceCodeValidation($scope.currentproductoptiongroups);
                    remotecallinitiated = false;
                })
                //}
            }
        }
		
		$scope.portOptionsValidation = function(){
			OptionGroupDataService.LocalAccessComponentId = OptionGroupDataService.portOptions($scope.currentproductoptiongroups);
			$scope.currentproductoptiongroups = $scope.optionGroupService.quantityValidationFromOptionLine($scope.currentproductoptiongroups);
		}
		
		$scope.UNIPortOptionBandwidthValidation = function(){
			OptionGroupDataService.L3PPPortType = OptionGroupDataService.L3PPPortSelected($scope.currentproductoptiongroups);
		}

        $scope.selectOptionProduct = function(prodcomponent, groupindex){
            if(prodcomponent != null
                && groupindex != null)
            {
                if($scope.currentproductoptiongroups[groupindex].ischeckbox == false)// radio button
                {
                    $scope.currentproductoptiongroups[groupindex].selectedproduct = prodcomponent.productId;
                }
                else {// checkbox.
                    prodcomponent.isselected = true;

                    if(prodcomponent.originalPComponent)
                        prodcomponent.originalPComponent.isselected = true;
                }
            }
        }
        
        

        $scope.selectProductrenderoptionproductattributes = function(prodcomponent, groupindex, optionGrpName){
            // select the product and add to tree.
            $scope.selectOptionProduct(prodcomponent, groupindex);
            $scope.optionGroupService.setrerenderHierarchy(true);

            var lineItem = prodcomponent.lineItem;

            // set selected option product which has watch with option Attribute Controller.
            $scope.optionGroupService.setSelectedoptionproduct(prodcomponent, optionGrpName, false, lineItem);
            $scope.hideCancelledAssetLines();
            return;
        }

        $scope.renderoptionproductattributes = function(prodcomponent, groupindex, optionGrpName){
            // select the product and add to tree.
            $scope.optionGroupService.setrerenderHierarchy(true);
            
            // do not render attributes when option product is unchecked or product does not have attributes.
            if(prodcomponent != null
                && ( (prodcomponent.isselected == false 
                        && $scope.currentproductoptiongroups[groupindex].ischeckbox)
                      || !prodcomponent.hasAttributes))
            {
                // initiate the save call option group unselect or option group select which does not have attributes.
                BaseService.setisSavecallRequested(true);

                return;    
            }

            var lineItem = prodcomponent.lineItem;

            // set selected option product which has watch with option Attribute Controller.
            $scope.optionGroupService.setSelectedoptionproduct(prodcomponent, optionGrpName, false, lineItem);
        }
        
        // anchor links in option groups.
        $scope.gotosection = function(sectionId) {
            // set the location.hash to the id of
            // the element you wish to scroll to.
            $location.hash(sectionId);

            // call $anchorScroll()
            $anchorScroll();
        };
        
        // quantity cannot be negative.
        $scope.changeQuantity = function(pcomponent){
            if(pcomponent.quantity < 1)
            {
                pcomponent.quantity = 1;
            }
        }
		
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
        /*
        $scope.totalSeatsValidation = function(){
            $scope.totalSeatCount = 0;			
			$scope.totalSeatCount = $scope.optionGroupService.getTotalSeatValidation($scope.currentproductoptiongroups);
			$scope.optionGroupService.seatTypeCount = $scope.totalSeatCount;
        }      
        */
        $scope.renderAttrNrunExpre = function(pcComponent, index, renderAttr, qtyChange, optionGroup, renderCloned){
			$scope.optionGroupService.setHideClonedOptionAttributes(true);
			ProductAttributeConfigDataService.recalculateL3PPCosBandwidth(pcComponent, BaseConfigService.lineItem.bundleProdName);
			$scope.renderClonedGRP = renderCloned;
			var optionGrpName = optionGroup.groupName;
			$scope.currentproductoptiongroups = $scope.optionGroupService.quantityValidationFromOptionLine($scope.currentproductoptiongroups);
			//$scope.optionGroupService.readOnlyValidation($scope.currentproductoptiongroups, $scope.isCapReadOnly);
			$scope.optionGroupService.currentOptionGroupName = optionGrpName;
            LineItemService.currentOption = pcComponent;
			var freezePage = false;
            if(renderAttr && !qtyChange){				
				//Added by David (Dato) Tsamalashvili for L3PP EVC Validation - DE11712 - 11/22/2016
				var allLineItemsToValid = LineItemService.getAllLineItems();
				pcComponent = OptionGroupDataService.L3PPevcValidation(pcComponent, allLineItemsToValid,optionGrpName,BaseConfigService.lineItem.bundleProdName);
				
                if(pcComponent.lineItemsCount > 1 || $scope.isL3PPEVC(optionGrpName)){
					if($scope.isCGELineService())
						freezePage = true;
					
					if(pcComponent.allowGrouping){
						$scope.currentComponent = pcComponent;
						$scope.currentComponentIndex = index;
						$scope.currentComponentGrpname = optionGrpName;
						OptionGroupDataService.setReRenderClonedGroups(false);
					}
					var isEvc = $scope.isL3PPEVC(optionGrpName);
					if(!_.isUndefined(pcComponent.lineItem) && !_.isNull(pcComponent.lineItem)){
						$scope.removeBundle(pcComponent.lineItem, freezePage, isEvc);
						return;
					}
                }
                // In case when we have more than one lineItem for option
                if(pcComponent.originalPComponent)
                    pcComponent.originalPComponent.isselected = pcComponent.isselected;

				$scope.checkSelected(optionGroup, pcComponent);
                $scope.renderoptionproductattributes(pcComponent, index, optionGrpName);
            }
            if(!renderAttr && !qtyChange){
				if($scope.isCapReadOnly){
					var showCurrentAttributes = $scope.optionGroupService.readOnlyValidation(pcComponent, $scope.currentproductoptiongroups);
					if(showCurrentAttributes){
						$scope.selectProductrenderoptionproductattributes(pcComponent, index, optionGrpName);
					}else{
						$scope.optionGroupService.setHideOptionAttributes(true);
					}
				}else{
					$scope.selectProductrenderoptionproductattributes(pcComponent, index, optionGrpName);
				}
				$scope.checkSelected(optionGroup, pcComponent);
            }
            if(qtyChange){
                $scope.changeQuantity(pcComponent);
                $scope.selectProductrenderoptionproductattributes(pcComponent, index, optionGrpName);
				$scope.optionGroupService.isQuantityChange = true;
            }
            if($scope.cascadeQty){
                $scope.cascadeExpressionQty(null, pcComponent)
            }
			$scope.checkSelectedCoSOptions(optionGroup, pcComponent);
			//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
			//$scope.totalSeatsValidation();
			$scope.portOptionsValidation();	
			$scope.UNIPortOptionBandwidthValidation();	
			$scope.optionGroupService.allowGroupingAttributes($scope.currentproductoptiongroups);	
			//DE8339 June 20 2016 - Rajesh
			//$scope.resetLineCountOfAdditionaTNs(pcComponent);			
			// 08/31/2016 - DE11976 - Added by David (Dato) Tsamalashvili - to prevent displaying cancelled line items from Asset
			$scope.hideCancelledAssetLines();
        }
		
		$scope.resetLineCountOfAdditionaTNs=function(pcComponent){
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
			if((bundleProductName != 'Fiber+' && bundleProductName != 'Fiber+ Enterprise' && bundleProductName != 'Core Connect Enterprise') && (pcComponent.productName !='Additional Voice Channels' && pcComponent.productName!='Additional TNs'))
				return;
			if(pcComponent.productName =='Additional Voice Channels' || pcComponent.productName=='Additional TNs')
			{
			var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
            var voiceServiceOption = bundlePAV['Service_Type_Fiber__c'];
			if(voiceServiceOption == 'SIP' && (bundleProductName == 'Core Connect Enterprise' || bundleProductName =='Fiber+ Enterprise'))
				return;

			_.each($scope.currentproductoptiongroups, function(group){                 
                if(group.groupName=='VoIP Add Ons')
                {
                	_.each(group.productOptionComponents, function(optionProduct){
                		if(optionProduct.productName == 'Additional TNs' || optionProduct.productName == 'Additional Voice Channels'){
                			if(pcComponent.isselected == true && (pcComponent.productName != optionProduct.productName))
							{
                				optionProduct.isselected = true;
								optionProduct.quantity=pcComponent.quantity;
                			}
                			if(pcComponent.isselected == false && (pcComponent.productName != optionProduct.productName))
							{
                				optionProduct.isselected = false;	
								optionProduct.quantity=pcComponent.quantity;
							}
                		}
                	});
				
                }
             });
			}
        };
		
		$scope.checkSelected = function(optionGroup, pcComponent){
            if(optionGroup.ischeckbox == false){
                _.each(optionGroup.optionLines, function(optionLine){
                    if(optionLine.lineItem && optionLine.componentId != pcComponent.componentId){
                        optionLine.lineItem.removeItem = true;
                    }
                });
            } else if(pcComponent.lineItem && !pcComponent.isselected){
                pcComponent.lineItem.removeItem = true;
            } else if(!pcComponent.lineItem && pcComponent.isselected){
                pcComponent.createItem = true;
            } else if(pcComponent.lineItem){
                pcComponent.lineItem.removeItem = false;
            }
            // In case when we have more than one lineItem for option
            if(pcComponent.originalPComponent)
                pcComponent.originalPComponent.isselected = pcComponent.isselected;
        }
		
		$scope.checkSelectedCoSOptions = function(optionGroup, pcComponent){
            var selectedCoSCount = 0;
            if(optionGroup.groupName != 'EVC CoS Options')
            	return;
            if(optionGroup.ischeckbox == true){
                _.each(optionGroup.optionLines, function(optionLine){
                    if(optionLine.isselected){
                        selectedCoSCount = selectedCoSCount + 1;
                    }
                });                					
            }
			if(selectedCoSCount > 1 && selectedCoSCount < 3){
				$scope.optionGroupService.showCoSSelectionError = true;
				$scope.optionGroupService.setInvalidAccessEVCFlag(true, pcComponent);
				//MessageService.addMessage('danger', 'You must select either one or three CoS Options. You cannot have two.');
            }else{
				$scope.optionGroupService.showCoSSelectionError = false;
				$scope.optionGroupService.setInvalidAccessEVCFlag(false, pcComponent);
			}
        }

		//added by David (Dato) Tsamalashvili - 06/10/2016 - for grouping attributes for cloned options
		$scope.renderClonedGroup = function(pcComponent, index, renderAttr, qtyChange, optionGrpName){
			$scope.optionGroupService.setHideClonedOptionAttributes(false);
			var allOptionAttribute = ProductAttributeValueDataService.getoptionproductattributevalues();
			var lineItemToAttributes = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			
			$scope.optionGroupService.getLineItems(pcComponent, optionGrpName, allOptionAttribute);
		}
        
        $scope.renderGroupsWithExpression = function(bundleproductId, prodcomponent, groupindex, dummy, ifParent){
			//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
			//$scope.totalSeatsValidation();
            $scope.rendercurrentproductoptiongroups(bundleproductId, prodcomponent, groupindex, ifParent);

            var primaryLineNumber = prodcomponent.lineItem ? prodcomponent.lineItem.primaryLineNumber : undefined;

            $scope.renderClonedLineItems(primaryLineNumber);
        }

        $scope.renderGroupWithLineItems = function(primaryLineNumber, optiongroup, groupindex, dummy, ifParent){
            //LineItemService.currentSelectedLineNumber = primaryLineNumber;
            $scope.renderGroupsWithExpression(null, optiongroup.productOptionComponents[0], groupindex, dummy, ifParent);
            //$scope.currentproductoptiongroups = [optiongroup];

            $scope.renderClonedLineItems(primaryLineNumber);
        }
        
        $scope.cascadeExpressionQty = function(prodOptions, pcComponent){
            if(pcComponent == null){				
				prodOptions = $scope.optionGroupService.getProdOptionsCascade(prodOptions, $scope.quantityCascade);
            }else if(pcComponent != null && prodOptions == null){
                pcComponent.quantity = $scope.quantityCascade;
            }           
        }

        $scope.launchHelp = function(componentForDialog){
            var dlg = null;
            var caseHelp = 'notify';
            var sensitiveViewURL = SystemConstants.baseUrl+'/Templates/SensitiveHelpView.html';
            SensitiveHelpDataService.currentOptionComponent = componentForDialog;
            /*
             switch(caseHelp){
             // Sensitive Help for Options
             case 'notify':
             dlg = $dialogs.create(sensitiveViewURL,'SensitiveHelpController','',{key: false,back: 'static'});
             dlg.result.then(function(btn){

             },function(btn){

             });
             break;
             };
             */
            //dlg = $dialogs.create(sensitiveViewURL,'SensitiveHelpController','',{key: false,back: 'static'});
            dlg = $dialogs.create(sensitiveViewURL,'SensitiveHelpController','',{key: false,back: 'false'});
            dlg.result.then(function(data){
                //$scope.data = data;
            });
        };

        $scope.renderClonedLineItems = function(primaryLineNumber){
            $scope.lineItemService.setReRenderLineItems(false);

            $scope.currentSelectedLineItemPrimaryLineNumber = primaryLineNumber;

            LineItemService.getLineItem(primaryLineNumber).then(function(result) {
                if(!$scope.currentSelectedLineItemPrimaryLineNumber && $scope.currentproductoptiongroups && $scope.currentproductoptiongroups.length > 0){
                    var parentId = $scope.currentproductoptiongroups[0].parentId;
                    var lineItems = LineItemService.getAllLineItems();

                    var selectedPcomponent;

                    var allOptionGroups = OptionGroupDataService.getallOptionGroups();
                    _.each(allOptionGroups, function(optiongroups, bProductId){
                        _.each(optiongroups, function(group){
                            _.each(group.productOptionComponents, function(productOptionComponent){
                                if(parentId == productOptionComponent.productId){
                                    selectedPcomponent = productOptionComponent;
                                }
                            });
                        });
                    });

                    if(selectedPcomponent){
                        var pcomponentLineItems = _.where(lineItems, {componentId: selectedPcomponent.componentId});

                        if(pcomponentLineItems.length == 1 && pcomponentLineItems[0]){
                            $scope.currentSelectedLineItemPrimaryLineNumber = pcomponentLineItems[0].primaryLineNumber;
                            $scope.renderClonedLineItems($scope.currentSelectedLineItemPrimaryLineNumber)
                        }
                    }
                }

                $scope.currentSelectedLineItemBandle = LineItemService.getCurrentSelectedLineItemBundle();
                $scope.configureOptionLines();
				$scope.checkUNIForCELineService();
				$scope.optionGroupService.allowGroupingAttributes($scope.currentproductoptiongroups);
				$scope.optionGroupService.allowGroupingAttributes(allOptionGroups);
				



				$scope.hideCancelledAssetLines();
				
				if($scope.renderClonedGRP)
					OptionGroupDataService.setReRenderClonedGroups(true);
                // As the official documentation states "The remote method call executes synchronously, but it doesn’t wait for the response to return. When the response returns, the callback function handles it asynchronously."
                //$scope.safeApply();
            });
        }

        $scope.renderLineItemsAttributes = function(lineItem, optionGroup, optionGrpName, lineItemIndex){
            LineItemService.currentSelectedLineItemId = lineItem.lineItemId;
            LineItemService.currentSelectedLineItemIndex = lineItemIndex;
            LineItemService.currentSelectedLineNumber = lineItem.primaryLineNumber;
            $scope.optionGroupService.currentOptionGroupName = optionGrpName;

            var componentId = lineItem.componentId;
            var pcomponent = _.findWhere(optionGroup.productOptionComponents, {componentId:componentId});
            $scope.optionGroupService.setSelectedoptionproduct(pcomponent, optionGrpName, true, lineItem);

            //$scope.optionGroupService.setSelectedLineItemOption(lineItem,optionGroup, optionGrpName);

        }

        $scope.getLocationName = function(lineItem){
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            //hard coded for CGE only, since location names should not be in other products
            if(bundleProductName.toLowerCase() != 'CenturyLink Ethernet'.toLowerCase())
                return;
            if(!lineItem)
                return;
            var lineItemsAttributes = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();


            var lineItemsAttribute = lineItemsAttributes[lineItem.lineItemId];
            if(!lineItemsAttribute)
                return;

            var locationId = lineItemsAttribute.Location_A__c;
            if(!locationId)
                return lineItem.serviceLocationAddress;

            var allLocations = ProductAttributeValueDataService.allLocations;
            if(!allLocations)
                return;

            var locationName = '';
            _.each(allLocations, function(location){
                if(location.Id == locationId){
                    locationName = location.Service_Address_Line_1__c + ' / ' + location.City__c;
                    if(location.isCQL) locationName + '(CQL)';
                    return false;
                }
            });

            locationName = locationName ? " - "+locationName : locationName;

            return locationName;
        }

        $scope.showGroups = function(optiongroup, pcomponent){
            if(optiongroup.groupName == "UNI Options"){
                //var componentId = pcomponent.componentId;
                //return !_.findWhere($scope.currentSelectedLineItemBandle, {componentId:componentId});
                return false;
            }

            return (optiongroup.groupName != 'UNI(s)' || !$scope.currentSelectedLineItemBandle);
        };

        $scope.selectedLineItemBandle = function(optiongroup){
            var lineItems = $scope.currentSelectedLineItemBandle;

            _.each(lineItems, function(lineItem){
                var pcomponent = _.findWhere(optiongroup.productOptionComponents, {componentId:lineItem.componentId});
                if(lineItem){
                    lineItem.pcomponent = pcomponent;
                }
            });

            return lineItems;
        };

        $scope.createNewLineItem = function(lineItem){
            $scope.saveLineItemCustom(lineItem.pcomponent);
        };

        $scope.configureOptionLines = function(){
            //var allLineItems = $scope.currentSelectedLineItemBandle;
			$scope.optionGroupService.getLineItemsValidation().then(function(respo){
				var allLineItems = respo;
				var lineObj = [];
				_.each(allLineItems, function(item){
					lineObj.push(item);
				});
				
				_.each($scope.currentproductoptiongroups, function(optiongroup){
					var items = [];

					_.each(optiongroup.productOptionComponents, function(pcomponent){
						if(!pcomponent.isActive)
							return;
						pcomponent.createItem = false;
						pcomponent.parentOptionPrimaryNumber = $scope.currentSelectedLineItemPrimaryLineNumber || BaseConfigService.lineItem.primaryLineNumber;
						var parentBundNum = parseInt(pcomponent.parentOptionPrimaryNumber);
						
						//var pcomponentLineItems = _.where(allLineItems, {componentId: pcomponent.componentId});parentBundleNumber
						//var pcomponentLineItems = _.findWhere(allLineItems, {componentId: pcomponent.componentId, parentBundleNumber: pcomponent.parentOptionPrimaryNumber});
						var pcomponentLineItems = _.where(lineObj, {componentId: pcomponent.componentId, parentBundleNumber: parentBundNum});
						if(optiongroup.ischeckbox == false){
							if(pcomponentLineItems.length > 0)
								optiongroup.selectedproduct = pcomponent.productId;
						}else{
							pcomponent.isselected = pcomponentLineItems.length > 0 ? true  :false;
						}
						pcomponent.lineItemsCount = pcomponentLineItems.length;

						if(!pcomponentLineItems  || pcomponentLineItems.length == 0){
							items.push(pcomponent);
						} else{
							_.each(pcomponentLineItems, function(pcomponentLine){
                                var newPComponent;
                                var optionComponent;
                                var cloneQuantity;
                                   _.each(optiongroup.optionLines, function(optionLineClone){
                                        if(!optionComponent && optionLineClone.lineItem && !cloneQuantity && optionLineClone.lineItem.lineItemId == pcomponentLine.lineItemId){
                                            optionComponent = optionLineClone.lineItem;
                                            cloneQuantity = optionLineClone.quantity;
                                        }
                                    });
                                if(pcomponent.allowCloning == true && optionComponent && cloneQuantity){ 
                                    newPComponent = angular.copy(pcomponent);
                                    newPComponent.quantity = cloneQuantity;
                                    newPComponent.lineItem = pcomponentLine;
                                    newPComponent.originalPComponent = pcomponent;
                                }else{
                                    newPComponent = angular.copy(pcomponent);
                                    //newPComponent.quantity = pcomponentLine.quantity;
                                    newPComponent.lineItem = pcomponentLine;
                                    newPComponent.originalPComponent = pcomponent;
                                }
								var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
								if(_.has(lineItemsToOptionPAVMap[pcomponentLine.lineItemId],'UNI_ERROR_INDICATOR__c') && $scope.checkUNIErrors(lineItemsToOptionPAVMap[pcomponentLine.lineItemId]['UNI_ERROR_INDICATOR__c']).length > 0 && pcomponentLine.optionName == 'UNI'){
									newPComponent.showErrorOnUni = true;
								} else {
									newPComponent.showErrorOnUni = false;
								}
								items.push(newPComponent);
							});
						}
					});

					optiongroup.optionLines = items;

				});
			});
            OptionGroupDataService.setrerenderHierarchy(true);
        };

        $scope.cloneLineItem = function(pcomponent){
			$scope.optionGroupService.setHideClonedOptionAttributes(true);
            var allLineItems = $scope.currentSelectedLineItemBandle;
            var pcomponentLineItems = _.where(allLineItems, {componentId: pcomponent.componentId});
			
			if( pcomponent.productName == 'Access EVC' ){
					
					var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
					var bundleServiceType = bundlePAV['Service_Type_L3__c'];
					if(bundleServiceType == 'EVPLINE' && pcomponentLineItems.length >= pcomponent.maxClone){
						var messageIndex = MessageService.addMessage('danger', 'Maximum of 20 EVCs can be selected for EVPLINE service type for - '+pcomponent.productName);

						$timeout(function(){
							MessageService.removeMessage(messageIndex);
						}, 3000);

						return;
						 
					}
					
			}
            else if(pcomponentLineItems.length >= pcomponent.maxClone ){
                var messageIndex = MessageService.addMessage('danger', 'Maximum cloning limit has been reached - '+pcomponent.productName);

                $timeout(function(){
                    MessageService.removeMessage(messageIndex);
                }, 3000);

                return;
            }

            $scope.cloneUNIOptions(pcomponent.lineItem);
        };

		$scope.checkUNIForCELineService = function(){
			var isLineService = $scope.isCGELineService();
            if(isLineService){
				$scope.showCloneButton = false;
				var allLineItems = $scope.currentSelectedLineItemBandle;
            	var selectedUNI = _.where(allLineItems, {optionName: 'UNI'});
            	if(selectedUNI.length == 0)
            		return;
				if(selectedUNI.length < 2 && selectedUNI.lineItem){
					$scope.cloneUNIOptions(selectedUNI.lineItem, true);
				}else if(selectedUNI.length < 2 && !selectedUNI.lineItem){
					$scope.cloneUNIOptions(selectedUNI[0], true);
				}	
				if(selectedUNI.length == 2)
					$scope.isTwoUNIELINE = true;
            } else{
                $scope.showCloneButton = true;
				$scope.isTwoUNIELINE = false;
            }  
		};
		
		$scope.isCGELineService = function(){
			//Added product restriction too, so it will not affect any other Product other than CGE : Mithilesh		
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            if(bundleProductName.toLowerCase() != 'CenturyLink Ethernet'.toLowerCase())
				return false;

			var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
            var bundleServiceType = bundlePAV['Service_Type_CGE__c'];
			if(bundleServiceType == 'EPLINE' || bundleServiceType == 'EVPLINE')
				return true;
			return false;
		};
		
		$scope.isL3PPEVC = function(optionGrpName){
			var bundleProd = BaseConfigService.lineItem.bundleProdName;
			var L3EVCOptionGroupsToCount = [];
			L3EVCOptionGroupsToCount['EVC CoS Options'] = 'EVC CoS Options';
			L3EVCOptionGroupsToCount['EVC Add Ons'] = 'EVC Add Ons';
			if(!_.isUndefined(optionGrpName) && !_.isUndefined(bundleProd)){
				if(bundleProd.toLowerCase() == 'L3 IQ Networking Private Port'.toLowerCase() && _.has(L3EVCOptionGroupsToCount, optionGrpName)){
					return true;
				}else{
					return false;
				}
			}else{
				return false;
			}
		}
		
		$scope.checkElineUniCount = function(){
			var totalUniCount = 0;
			var optionGroups = $scope.currentproductoptiongroups;
			var uniOptionGroup = _.findWhere(optionGroups, {name: "UNI(s)"})
			var pcomponent = uniOptionGroup.optionLines;
			_.each(pcomponent, function(component){						
				if(component.isselected)
					totalUniCount +=1;							
			});
			return totalUniCount;	
		};
		
        $scope.showOptionLine = function(pcomponent){
            if(pcomponent.productName == "Build Out" && !pcomponent.lineItem){
                return false;
            }

			if(pcomponent.productName == "UNI Port" && !pcomponent.lineItem){
                return false;
            }
            if(pcomponent.productName == "NID" && !pcomponent.lineItem){
                return false;
            }
            if(pcomponent.productName == "NMI Affiliate" && !pcomponent.lineItem){
                return false;
            }			
            return true;
        };		
		
		$scope.checkUNIErrors = function (values){
            var values = values.split(',');
            var errors = [];
            if(values.length == 1) 
                return errors;
            if(!_.isEmpty(values[0])) {
                errors.push('Service Type:' + values[0]);
            }

            if(!_.isEmpty(values[1])) {
                errors.push('LOCATION' + values[1]);
            }

            if(!_.isEmpty(values[2])) {
                errors.push('CCID' + values[2]);
            }
            return errors;
        }
        
        $scope.displayError = function(pcomponentLine) {
            var errorText = "";
            var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
            if(pcomponentLine.lineItem && _.has(lineItemsToOptionPAVMap[pcomponentLine.lineItem.lineItemId],'UNI_ERROR_INDICATOR__c')){
                var res =  $scope.checkUNIErrors(lineItemsToOptionPAVMap[pcomponentLine.lineItem.lineItemId]['UNI_ERROR_INDICATOR__c']);
                _.each(res, function(item){
                    errorText += item + "</br>";
                })
				errorText = "Your configuration contains re-used UNIs, which aren't supported by an EP(port based) service type. Please change the CCID and Location back to previous selection and change the service type back to an EVP (virtual based) service type OR change the re-used UNI indicator other than Yes(In Inventoey).";
            }
            return errorText;
        }
		
		$scope.hideCancelledAssetLines = function(){
			_.each($scope.currentproductoptiongroups, function(item){
				if(_.has(item, 'optionLines')){
					_.each(item.optionLines, function(line){
						line.className = '';
						if(_.has(line, 'lineItem')){
							if(line.isselected && line.lineItem.lineStatus.toLowerCase() == 'Cancelled'.toLowerCase()){
								var newName = line.productName + ' - Cancelled'
								line.isselected = false;								
								line.productName = newName;
								line.className = 'color: red !important;';
							}
						}
					});
				}
			});
		}

        $scope.init();
    };

    OptionGroupController.$inject = ['$scope', '$log', '$location', '$anchorScroll', '$dialogs', '$timeout', 'SystemConstants', 'BaseService', 'BaseConfigService', 'OptionGroupDataService', 'SensitiveHelpDataService', 'LocationDataService', 'LineItemService', 'LineItemAttributeValueDataService', 'ProductAttributeValueDataService', 'MessageService', 'ProductAttributeConfigDataService'];
    angular.module('APTPS_ngCPQ').controller('OptionGroupController', OptionGroupController);
}).call(this);