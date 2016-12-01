;(function() {
    'use strict';

    angular.module('APTPS_ngCPQ').service('SaveConfigService', SaveConfigService);
    SaveConfigService.$inject = [ '$q',
        '$log',
        'BaseService',
        'BaseConfigService',
        'RemoteService',
        'MessageService',
        'LocationDataService',
        'PricingMatrixDataService',
        'OptionGroupDataService',
        'ProductAttributeValueDataService',
        'ProductAttributeConfigDataService',
        'PAVObjConfigService',
        'ConstraintRuleDataService',
        'LineItemService',
        'LineItemAttributeValueDataService'];
    function SaveConfigService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService, LocationDataService, PricingMatrixDataService,
                               OptionGroupDataService, ProductAttributeValueDataService, ProductAttributeConfigDataService,
                               PAVObjConfigService, ConstraintRuleDataService, LineItemService, LineItemAttributeValueDataService){
        var service = this;

        var productIdtoComponentMap = {};
        var productIdtoGroupMap = {};
        var allOptionGroups = {};

        var allcomponentIdToOptionPAVMap = {};
        var allLineItemsToOptionLineAttrMap = {};

        var pavFieldNametoDFRMap = {};
        var prodductIdtoattributegroupsMap = {};

        var lineItems = {};
        var uniLineItems = {};

        service.saveinformation = saveinformation;
        service.validateUNIs = validateUNIs;

        function saveinformation(){
            var deferred = $q.defer();
            if(validateonsubmit())
            {
                var freezePage = freezeFullPage();

                // if save call is in progress then do not proceed.
                if(BaseService.getisSaveCallinProgress() == true)
                {
                    deferred.reject('Save call in progress.');
                    return deferred.promise;
                }
                else{
					// set the savecallprogress so next request will be denied.
                    BaseService.setisSaveCallinProgress();
				}

                BaseService.startprogress(freezePage);// start progress bar.

                // selected service location Id.
                var servicelocationId = LocationDataService.getselectedlpaId();
				var isCQL = LocationDataService.selectedisCQL;
				var selectedSR = LocationDataService.getselectedlpa();
				var allLocationsResponse = LocationDataService.allLocationsValidate;

                // get the firstPMRecordId from PricingMatrixDataService and set PriceMatrixEntry__c on bundle.
                var pricingmatrixId = PricingMatrixDataService.getfirstPMRecordId();

                // prepare the bundleLine item to be passed to Remote actions.
                var bundleLine = BaseConfigService.lineItem;
                var cartID = BaseConfigService.cartId;
                var bundleLineId = bundleLine.Id;
                var mainBundleProdId = BaseConfigService.lineItem.bundleProdId;
                var bundleLineNumber = bundleLine.lineNumber;
                var bundlePrimaryNumber = bundleLine.primaryLineNumber;

				//added by David (Dato) Tsamalashvili - to check location type - CQL or SL
				if(!isCQL){
					var bundleLineItem ={Id:bundleLineId,
						Apttus_Config2__ConfigurationId__c:cartID,
						Service_Location__c:servicelocationId,
						Apttus_Config2__ProductId__c:mainBundleProdId,
						Apttus_Config2__LineNumber__c:parseInt(bundleLineNumber),
						PriceMatrixEntry__c:pricingmatrixId,
						Apttus_Config2__PrimaryLineNumber__c:parseInt(bundlePrimaryNumber),
						Location_Type__c:selectedSR.locationType};
				}else{
					
					var bundleLineItem ={Id:bundleLineId,
						Apttus_Config2__ConfigurationId__c:cartID,
						Company_Qualified_Location__c:servicelocationId,
						Apttus_Config2__ProductId__c:mainBundleProdId,
						Apttus_Config2__LineNumber__c:parseInt(bundleLineNumber),
						PriceMatrixEntry__c:pricingmatrixId,
						Apttus_Config2__PrimaryLineNumber__c:parseInt(bundlePrimaryNumber),
						Location_Type__c:selectedSR.locationType};
				}
				
                var productcomponentstobeUpserted = [];
                var componentIdtoPAVMap = {};
                // var allOptionGroups = OptionGroupDataService.getallOptionGroups();
                // allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
				
				pavToPav2(allcomponentIdToOptionPAVMap, allLineItemsToOptionLineAttrMap);
                allOptionGroups = locationValidation(allOptionGroups, allcomponentIdToOptionPAVMap, mainBundleProdId, productIdtoComponentMap, productIdtoGroupMap, servicelocationId);
				lineItems = LineItemService.getAllLineItems(); 
				uniLineItems = LineItemService.getUNILineItems();
				var optionLineAttributes = [];		
                var usedOptionIds = [];		
				
				
				
                _.each(allOptionGroups, function(optiongroups, bProductId){
                    _.each(optiongroups, function(optiongroup){
                        var parentId = optiongroup.parentId;
                        //if parent is bundle productId or selected then proceed.
                        if(parentId == mainBundleProdId
                            || (_.has(productIdtoComponentMap, parentId)
                            && _.has(productIdtoGroupMap, parentId)
                            && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId])))
                        {
                            _.each(optiongroup.productOptionComponents, function(productcomponent){
                                if(isProdSelected(productcomponent,optiongroup)
                                    || isUNIBuildOut(productcomponent,optiongroup)
                                    || isEVCProduct(productcomponent,optiongroup)) {
                                    
									if(!isUNIBuildOut(productcomponent,optiongroup) && !isEVCProduct(productcomponent,optiongroup)){
										productcomponent.isselected = true;
                                    }

                                    productcomponent = _.omit(productcomponent, ['$$hashKey', 'createItem', 'isDisabled', 'isLocationZ', 'product', 'sensitiveHelpFieldsMap', 'isAvailableonSLocation', 'lineItemsCount', 'parentOptionPrimaryNumber', 'className', 'evcHasError']);

                                    var componentId = productcomponent.componentId;
                                    var otherSelected = false;
                                    if(_.has(allcomponentIdToOptionPAVMap, componentId))
                                    {
                                        var optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                        // Other picklist is selected then set OtherSelected to true.
                                        if(!_.isUndefined(_.findKey(optionPAV, function(value, pavField){return pavField.endsWith('Other');}))){										
                                            otherSelected = true;
                                        }
										//added by David (Dato) Tsamalashvili - DE9920 - 07/20/2016
										if(!_.isUndefined(_.findKey(optionPAV.ProductAttributeValueId1__r, function(value, pavField){return pavField.endsWith('Other');}))){										
                                            otherSelected = true;
                                        }
                                        // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                                        componentIdtoPAVMap[componentId] = formatPAVBeforeSave(optionPAV);
                                    }else{
										if(!_.isUndefined(lineItems)){
											_.each(lineItems, function(item){
												if(item.componentId == componentId){
													if(_.has(allcomponentIdToOptionPAVMap, item.lineItemId)){
														var optionPAV = allcomponentIdToOptionPAVMap[item.lineItemId];
														// Other picklist is selected then set OtherSelected to true.
														if(!_.isUndefined(_.findKey(optionPAV, function(value, pavField){return pavField.endsWith('Other');}))){										
															otherSelected = true;
														}
														//added by David (Dato) Tsamalashvili - DE9920 - 07/20/2016
														if(!_.isUndefined(_.findKey(optionPAV.ProductAttributeValueId1__r, function(value, pavField){return pavField.endsWith('Other');}))){										
															otherSelected = true;
														}
														// clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
														componentIdtoPAVMap[componentId] = formatPAVBeforeSave(optionPAV);
													}
												}
											});
										}
									}
                                    productcomponent.customFlag = otherSelected;
                                    productcomponentstobeUpserted.push(productcomponent);
                                }
                            })
                        }// end of if - only if parent component is selected.
                    })
                })

                _.each(allOptionGroups, function(optiongroups, bProductId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.optionLines, function(optionLine){
                            if(!optionLine.isselected || optionLine.productName == 'None'){
								if(!isL3PP())
									return;
							} 
                            var parentId = optionLine.parentOptionPrimaryNumber;
                            if(!parentId || parentId == 0)
                                parentId = BaseConfigService.lineItem.primaryLineNumber;
                            var objectData = {
                                componentId: optionLine.componentId,
                                lineItemId: optionLine.lineItem ? optionLine.lineItem.lineItemId : null,
                                attributes1: {},
                                attributes2: {},
                                parentBundleNumber : parentId,
                                removeItem : false,
                                createItem: false
                            };

                            if(!optionLine.lineItem && optionLine.createItem){
                                objectData.createItem = true;
                            }
                            if(!optionLine.hasAttributes){
                                objectData = optionLineCustomActions(objectData);
                                if(optionLine.lineItem)
                                    objectData.removeItem = optionLine.lineItem.removeItem ? optionLine.lineItem.removeItem : false;
								
								usedOptionIds.push(optionLine.componentId);
                                optionLineAttributes.push(objectData);
                                return;
                            }

                            if(optionLine.lineItem){
                                objectData.removeItem = optionLine.lineItem.removeItem ? optionLine.lineItem.removeItem : false;
                                var lineItemAttrs = allLineItemsToOptionLineAttrMap[optionLine.lineItem.lineItemId];
                                var pavCombo = formatPAVBeforeSave_V2(lineItemAttrs);
                                usedOptionIds.push(optionLine.lineItem.componentId);
                                objectData.attributes1 = pavCombo.pav1;
                                objectData.attributes2 = pavCombo.pav2;
                                objectData = optionLineCustomActions(objectData, optionLine.lineItem);
                                optionLineAttributes.push(objectData);
                                return;
                            } else {
                                var componentAttrs = componentIdtoPAVMap[optionLine.componentId];
                                var pavCombo = formatPAVBeforeSave_V2(componentAttrs);
                                objectData.attributes1 = pavCombo.pav1;
                                objectData.attributes2 = pavCombo.pav2;
                                objectData = optionLineCustomActions(objectData);
                                if(objectData.componentId != 'undefined'){
                                    usedOptionIds.push(objectData.componentId);
                                    optionLineAttributes.push(objectData);
                                }
                                return;
                            }
                        })
                    })
                })
								
                /*//LineItemService
                var lineItems = LineItemService.getLineItemsToSave();
                var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
                var currentSelectedLineItemPavs = lineItemsToOptionPAVMap[LineItemService.currentSelectedLineItemId];
                if(currentSelectedLineItemPavs && !_.has(lineItemToSave, LineItemService.currentSelectedLineItemId && currentSelectedLineItemPavs.lineItemId)) {
                    if(_.has(currentSelectedLineItemPavs, 'Location_A__c') && currentSelectedLineItemPavs.Location_A__c == ""){
                        currentSelectedLineItemPavs.Location_A__c = null;
                    }
                    lineItems[LineItemService.currentSelectedLineItemId] = currentSelectedLineItemPavs;
                }

                var lineItemToSave = {};
                _.each(lineItems, function(lineItemObj, key){
                    if(lineItemObj.Id)
                        lineItemToSave[key] = formatPAVBeforeSave(lineItemObj);
                });

                // Removing 'UNI' option and sub options from productOptionComponents if LineItems extists for "UNI's"
                var existsLineItems = LineItemService.getUNILineItems();
                if(!_.isEmpty(existsLineItems)){
                    var UNIcomponent = _.findWhere(productcomponentstobeUpserted, {productName: "UNI"});
                    UNIcomponent = !UNIcomponent ? _.findWhere(productcomponentstobeUpserted, {productName: "UNI (reusable)"}) : UNIcomponent;

                    if(UNIcomponent) {
                        _.each(productcomponentstobeUpserted, function (productcomponent) {
                            if (productcomponent.componentId == UNIcomponent.componentId || productcomponent.parentComponentId == UNIcomponent.componentId) {
                                delete componentIdtoPAVMap[UNIcomponent.componentId];
                                productcomponent.skipFromUpdate = true;
                            }
                        });
                    }
                }*/
				
				//commented out until product patch is available
				if(!_.isEmpty(lineItems)){
                    var UNIcomponent = _.find(productcomponentstobeUpserted, function(item){
                        return item.productName.indexOf('Access EVC') > -1;
                    });
                    if(UNIcomponent) {
                        _.each(productcomponentstobeUpserted, function (productcomponent) {
                            if (productcomponent.componentId == UNIcomponent.componentId
                                || productcomponent.parentComponentId == UNIcomponent.componentId) {
                                delete componentIdtoPAVMap[UNIcomponent.componentId];
                                productcomponent.skipFromUpdate = true;
                            }
                        });
                    }
                }
                // add bundleLine PAV.
                var otherSelected_bundle = false;
                var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
                // Other picklist is selected then set OtherSelected to true.
                if(!_.isUndefined(_.findKey(bundlePAV, function(value, pavField){return pavField.endsWith('Other');}))){				
                    otherSelected_bundle = true;
                }

                // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                componentIdtoPAVMap[mainBundleProdId] = formatPAVBeforeSave(bundlePAV);
                bundleLineItem = _.extend(bundleLineItem, {Custom__c:otherSelected_bundle});

				
				var productcomponentstobeUpsertedWithoutEmpty = [];
				
				_.each(productcomponentstobeUpserted, function(item){
					if(!_.isEmpty(item)){
						if(_.has(item, 'componentId') && item.productName != 'None'){
							productcomponentstobeUpsertedWithoutEmpty.push(item);
						}
					}
				});
				
				productcomponentstobeUpserted = productcomponentstobeUpsertedWithoutEmpty;

                
                var componentIdToProdIdMap = {};
                


                //added by David Tsamalashvili
                _.each(lineItems, function(lineItem){
                    var obj = {};
                    obj.optionId = lineItem.optionId;
                    obj.componentId = lineItem.componentId;
                    if(_.isEmpty(componentIdToProdIdMap)){
                        //componentIdToProdIdMap[lineItem.componentId] = lineItem.optionId;
                        componentIdToProdIdMap[lineItem.componentId] = obj;
                    }else if(!_.has(componentIdToProdIdMap ,lineItem.productId)){
                        componentIdToProdIdMap[lineItem.componentId] = obj;
                    }
                });

                
				
                /*_.each(allLineItemsToOptionLineAttrMap, function(lineItemAttrs, lineItemId){
                    var lineItem = lineItems[lineItemId];

                    if(lineItem && lineItemAttrs.Id){
                        usedOptionIds.push(lineItem.componentId);
                        var pavCombo = formatPAVBeforeSave_V2(lineItemAttrs);
                        var objectData = {
                            componentId: lineItem.componentId,
                            lineItemId: lineItemId,
                            attributes1: pavCombo.pav1,
                            attributes2: pavCombo.pav2
                            //removeItem: lineItem.removeItem ? lineItem.removeItem : false
                        };

                        objectData = optionLineCustomActions(objectData, lineItem);
                        optionLineAttributes.push(objectData);
                    }

                });*/

                _.each(componentIdtoPAVMap, function(componentAttrs, componentId){
                    // new Attributes
                    if(!_.contains(usedOptionIds, componentId) && componentId.toLowerCase() != 'undefined'){
                        var pavCombo = formatPAVBeforeSave_V2(componentAttrs);
                        var objectData = {
                            componentId: componentId,
                            lineItemId: null,
                            attributes1: pavCombo.pav1,
                            attributes2: pavCombo.pav2
                        };

                        objectData = optionLineCustomActions(objectData);
						if(objectData.componentId != 'undefined'){
							optionLineAttributes.push(objectData);
						}
                        
                    }
                });

				//remove extra attribute before save.
				optionLineAttributes = removeExtraAttributes(optionLineAttributes, componentIdToProdIdMap, prodductIdtoattributegroupsMap);
				
				//remove *** from locations
				_.each(optionLineAttributes, function(item){
					if(!_.isUndefined(item.serviceLocationId) && !_.isEmpty(item.serviceLocationId)){
						if(item.serviceLocationId.endsWith('***'))
							item.serviceLocationId = item.serviceLocationId.slice(0,-3);
					}
					if(_.has(item.attributes1, 'Location_A__c')){
						if(item.attributes1.Location_A__c  && item.attributes1.Location_A__c.endsWith('***'))
							item.attributes1.Location_A__c = item.attributes1.Location_A__c.slice(0, -3);
					}
					if(_.has(item.attributes1, 'Location_Z__c')){
						if(item.attributes1.Location_Z__c && item.attributes1.Location_Z__c.endsWith('***'))
							item.attributes1.Location_Z__c = item.attributes1.Location_Z__c.slice(0, -3);
					}
				});
				
				//added by David (Dato) Tsamalashvili - for Defect 10906 - to validate hidden attribute values for options and updateRuleActions
				var bundleId = bundleLineItem.Apttus_Config2__ProductId__c;
				var bundlePAV1 = [];
				var bundlePAV2 = [];
				var bundlePAV1Updated = [];
				var bundlePAV2Updated = [];
				var optionAttributeGroups = [];
				var optionIdToAttrsForUpdate = [];
				var bundleProdId = BaseConfigService.lineItem.bundleProdId;
				var bundleLevelAttributes = [];

				var allComponentAttributeGroups = componentIdToProdIdMap;
				var prodIdToGroup = prodductIdtoattributegroupsMap;
				
				if(_.has(prodIdToGroup, bundleProdId)){
					//var bundleProductAttributes = prodIdToGroup[bundleProdId];
					var bundleProductAttributes = [];
					bundleProductAttributes.push(prodIdToGroup[bundleProdId]);
					
					_.each(bundleProductAttributes, function(items){
						_.each(items, function(itemGrp){
							_.each(itemGrp.productAtributes, function(atr){
								bundleLevelAttributes[atr.fieldName] = atr.fieldName;
							});
						});
					});
				}				
				
				_.each(allComponentAttributeGroups, function(item){
					if(_.has(prodductIdtoattributegroupsMap, item.optionId)){
						var currentItem = [];
						currentItem['componentId'] = item.componentId;
						currentItem['attributes'] = prodductIdtoattributegroupsMap[item.optionId];
						optionAttributeGroups.push(currentItem); 
					}
				});

				_.each(optionLineAttributes, function(item){
					if(item.componentId == bundleId){
						bundlePAV1 = item.attributes1;
						bundlePAV2 = item.attributes2;
					}
				});
				
				if(!_.isUndefined(bundlePAV1)){
					_.each(bundlePAV1, function(value, key){
						if(_.has(bundleLevelAttributes, key))
							bundlePAV1Updated[key] = bundlePAV1[key];
					});
					bundlePAV1 = bundlePAV1Updated;
				}
				
				if(!_.isUndefined(bundlePAV2)){
					_.each(bundlePAV2, function(value, key){
						var newKey = 'ProductAttributeValueId1__r.'+key;
						if(_.has(bundleLevelAttributes, newKey))
							bundlePAV2Updated[key] = bundlePAV2[key];
					});
					bundlePAV2 = bundlePAV2Updated;
				}

				_.each(optionAttributeGroups, function(item, key){
					_.each(item.attributes, function(attr){
						var optionIdToUpdAtr = [];
						var needToUpdate = {};
						_.each(attr.productAtributes, function(prAtr){							
							if((prAtr.isHidden && !prAtr.isRequiredDynamicAttribute) || !prAtr.isHidden){																
								needToUpdate[prAtr.fieldName] = prAtr.fieldName;
							}
						});	
						_.each(optionLineAttributes, function(optAtr){
							if(optAtr.componentId == item.componentId){
								_.each(needToUpdate, function(upd){
									if(upd.indexOf('ProductAttributeValueId1__r') == -1){
										if(_.has(bundlePAV1, upd)){
											optAtr.attributes1[upd] = bundlePAV1[upd];
										}			
									}else{
										if(_.has(bundlePAV2, upd)){
											optAtr.attributes2[upd] = bundlePAV2[upd];
										}
									}									
								});								
							}							
						});
						optionIdToUpdAtr[item.componentId] = needToUpdate;					
					});
				});
				
				//added by David (Dato) Tsamalashvili - to remove extra attributes for bundle level				
				var bundleLineItemProdId = BaseConfigService.lineItem.bundleProdId;				
				var bundleAtrs = _.findWhere(optionLineAttributes ,{componentId: bundleLineItemProdId})
				
				_.each(bundleAtrs.attributes1, function(value, key){
					if(!_.has(bundlePAV1, key) && key != 'Id'){
						bundleAtrs.attributes1 = _.omit(bundleAtrs.attributes1, key);
					}
				});				
				_.each(bundleAtrs.attributes2, function(value, key){
					if(!_.has(bundlePAV2, key) && key != 'Id'){
						bundleAtrs.attributes2 = _.omit(bundleAtrs.attributes2, key);
					}
				});				
				_.each(optionLineAttributes, function(item){
					if(item.componentId == bundleAtrs.componentId){
						item = bundleAtrs;
					}
				});
				
				//added by David (Dato) Tsamalashvili - to remove ID from PAV 2 if nothing else is there - 10/13/2016
				_.each(optionLineAttributes, function(item){
					if(Object.keys(item.attributes2).length == 1 && _.has(item.attributes2, 'Id')){
						var newAtr2 = _.omit(item.attributes2, 'Id');
						item.attributes2 = newAtr2;
					}
						
				});
				
				//added by David (Dato) Tsamalashvili - to remove PAV 2 from PAV 1 - 10/13/2016
				_.each(optionLineAttributes, function(item){
					if(_.has(item.attributes1, 'ProductAttributeValueId1__r')){
						var newAtr1 = _.omit(item.attributes1, 'ProductAttributeValueId1__r');
						item.attributes1 = newAtr1;
					}
						
				});
				
				//added by David (Dato) Tsamalashvili - to update option lines from Service Location to CQL if isCQL is true
				if(isCQL){
					if(!_.isEmpty(productcomponentstobeUpserted) && !_.isUndefined(productcomponentstobeUpserted)){
						_.each(productcomponentstobeUpserted, function(item){							
							item.cqlLocationId = item.serviceLocationId;
							item.serviceLocationId = null;
						});
					}

                    if(optionLineAttributes){
                        _.each(optionLineAttributes, function(item){
                            item.cqlLocationId = item.serviceLocationId;
                            item.serviceLocationId = null;
                        });
                    }
				}
				
				//Added by David (Dato) Tsamalashvili - To add Location type to bundle and option lines - 9/12/2016
				if(!_.isUndefined(allLocationsResponse) && !_.isNull(allLocationsResponse)){
					if(!_.isUndefined(productcomponentstobeUpserted) && !_.isNull(productcomponentstobeUpserted)){
						_.each(productcomponentstobeUpserted, function(item){
							if(!_.isNull(item.serviceLocationId) && !_.isUndefined(item.serviceLocationId)){
								var ccLoc = _.findWhere(allLocationsResponse, {Id:item.serviceLocationId})
								item.locationType = ccLoc.CQL_Loc_Type__c; 
							}else if(!_.isNull(item.cqlLocationId) && !_.isUndefined(item.cqlLocationId)){
								var ccLoc = _.findWhere(allLocationsResponse, {Id:item.cqlLocationId})
								item.locationType = ccLoc.CQL_Loc_Type__c; 
							}
						});
					}
				}
				
				//added by David (Dato) Tsamalashvili - to move service loc id to CQL id - when in Location A and Location Z attributes have CQL data
				
				if(!_.isUndefined(allLocationsResponse) && !_.isNull(allLocationsResponse)){
					if(!_.isUndefined(productcomponentstobeUpserted) && !_.isNull(productcomponentstobeUpserted)){
						_.each(productcomponentstobeUpserted, function(item){
							if(_.has(item, 'serviceLocationId') && (!_.isNull(item.serviceLocationId) && !_.isUndefined(item.serviceLocationId)))
							var currentLoc = _.findWhere(allLocationsResponse, {Id:item.serviceLocationId});
								if(!_.isUndefined(currentLoc) && !_.isNull(currentLoc)){
									if(!_.isUndefined(currentLoc.CQL_Loc_Type__c) && !_.isNull(currentLoc.CQL_Loc_Type__c)){
										if(currentLoc.CQL_Loc_Type__c.toLowerCase() != 'SVC Loc'.toLowerCase()){
											item.cqlLocationId = item.serviceLocationId;
											item.serviceLocationId = null;
										}	
									}										
								}								
						});
					}
				}
				
				//Added by David (Dato) Tsamalashvili - 10/31/2016 - DE11712
				
				if(BaseConfigService.bundleLineItemInfo.productName.toLowerCase() == 'L3 IQ Networking Private Port'.toLowerCase()){
					var skipEVCDelete = [];
					skipEVCDelete['UNI Port'] = 'UNI Port';
					skipEVCDelete['NID'] = 'NID';
					skipEVCDelete['NMI Affiliate'] = 'NMI Affiliate';
					if(!_.isEmpty(productcomponentstobeUpserted) && !_.isUndefined(productcomponentstobeUpserted)){
						var productsToUpsert = [];
						var optionsLineItemIds = [];
						var optionsComponentsIds = [];
						_.each(productcomponentstobeUpserted, function(item){
							if(item.isselected || _.has(skipEVCDelete, item.productName)){
								productsToUpsert.push(item);
								optionsComponentsIds[item.componentId] = item.componentId;
									if(_.has(item, 'lineItemId'))
										optionsLineItemIds[item.lineItemId] = item.lineItemId;
							}
								
						});
						productcomponentstobeUpserted = productsToUpsert;
						
						if(!_.isUndefined(optionLineAttributes) && !_.isEmpty(optionLineAttributes)){
							if((!_.isEmpty(optionsComponentsIds) && !_.isUndefined(optionsComponentsIds)) || !_.isEmpty(optionsLineItemIds) && !_.isUndefined(optionsLineItemIds)){
								var L3PPAttributes = [];
								_.each(optionLineAttributes, function(atrs){
									if(_.has(optionsComponentsIds, atrs.componentId) || _.has(optionsLineItemIds, atrs.lineItemId))
										L3PPAttributes.push(atrs);
								});
								optionLineAttributes = L3PPAttributes;
							}
						}
						LineItemService.updateLineItemCach();
					}
				}
				
                // remote call to save Quote Config.
                var saveRequest = {
                    bundleLineItem:bundleLineItem
                    , productOptionComponents: productcomponentstobeUpserted
                    , optionLineAttributes: optionLineAttributes
					, isLargeQuote: BaseConfigService.isLargeQuote};
                var requestPromise = RemoteService.saveQuoteConfig(saveRequest);
                requestPromise.then(function(saveresult){
                    if(saveresult.isSuccess)// if save call is successfull.
                    {
						if(!BaseConfigService.isLargeQuote){
							runConstraintRules().then(function(constraintsResult){
								// var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
								// make a remote call to get option groups for all bundles in current option groups.
								OptionGroupDataService.setrerenderHierarchy(true);

								var messagesFromMsgSrv = MessageService.messages;
								if(constraintsResult.numRulesApplied > 0 || messagesFromMsgSrv.length > 0)
								{
									deferred.reject('Constraint rules Error.');
								}
								else{
									// resolve the save promise after constraint remote call is complete with no constraint actions.
									deferred.resolve(true);
								}

								//if(_.isEmpty(existsLineItems) || LineItemService.locationWasChanged){
									//LineItemService.locationWasChanged = false;
									LineItemService.setReRenderLineItems(true, true);
									LineItemService.getReRenderLineItems();
								//}


								BaseService.completeSaveProgress();// end progress bar.
							})
						}else{
							deferred.resolve(true);
							BaseService.completeSaveProgress();// end progress bar.
						}						
                    }// end of saveresult.isSuccess check.
                    else{
                        MessageService.addMessage('danger', saveresult.messageWrapList);
                        BaseService.completeSaveProgress();// end progress bar.
                        // $scope.safeApply();
                        deferred.reject('Save Failed.');
                        return deferred.promise;
                    }
                })// end of saveQuoteConfig remote call.
            }// end of validateonsubmit.
            else{
                // BaseService.completeprogress();// end progress bar.
                deferred.reject('Validations Failed.');
                return deferred.promise;
            }
            return deferred.promise;
        }

        function optionLineCustomActions(objectData, lineItem){

            var lineItemId = lineItem ? lineItem.lineItemId : null;
            // LineItem Actions
            if(objectData.lineItemId){
                // For Uni LineItems adding serviceLocationId
                if(isCenturyGlobalEthernet() && _.has(uniLineItems, objectData.lineItemId)){

                    var serviceLocationId = null;
                    if(_.has(objectData.attributes1, 'Location_A__c') && !_.isEmpty(objectData.attributes1['Location_A__c'])){
                        serviceLocationId = objectData.attributes1['Location_A__c'];
                    }else if(_.has(objectData.attributes2, 'Location_A__c') && !_.isEmpty(objectData.attributes2['Location_A__c'])){
                        serviceLocationId = objectData.attributes2['Location_A__c'];
                    }else {
                        var parentLineItem = _.findWhere(lineItems, {primaryLineNumber:lineItems[lineItemId].parentBundleNumber});

                        if(parentLineItem && _.has(allLineItemsToOptionLineAttrMap, parentLineItem.lineItemId) && !_.isEmpty(allLineItemsToOptionLineAttrMap[parentLineItem.lineItemId]['Location_A__c'])){
                            serviceLocationId = allLineItemsToOptionLineAttrMap[parentLineItem.lineItemId]['Location_A__c'];
                        } else {
                            serviceLocationId = null;
                        }

                    }
                    objectData.serviceLocationId = serviceLocationId;
                }else{
					if(!lineItem) return objectData;
                    var serviceLocationId = null;
                    var groupName =  getOptionGroupName(lineItem.optionGroupId);
                    var isLocz = false;
                    var locAA = null;
                    var locZZ = null;
                    var selectedServicelocationId = LocationDataService.getselectedlpaId();

                    if(groupName.indexOf('Location Z') != -1){
                        isLocz = true;
                    }

                    if(_.has(objectData.attributes1, 'Location_Z__c') && !_.isEmpty(objectData.attributes1['Location_Z__c'])){
                        locZZ = objectData.attributes1['Location_Z__c'];
                    }else if(_.has(objectData.attributes2, 'Location_Z__c') && !_.isEmpty(objectData.attributes2['Location_Z__c'])){
                        locZZ = objectData.attributes2['Location_Z__c'];
                    }
                    if(_.has(objectData.attributes1, 'Location_A__c') && !_.isEmpty(objectData.attributes1['Location_A__c'])){
                        locAA = objectData.attributes1['Location_A__c'];
                    }else if(_.has(objectData.attributes2, 'Location_A__c') && !_.isEmpty(objectData.attributes2['Location_A__c'])){
                        locAA = objectData.attributes2['Location_A__c'];
                    }

                    if(!locZZ){
                        locZZ = LineItemAttributeValueDataService.locationZ;
                    }

                    if(!locAA){
                        locAA = LineItemAttributeValueDataService.locationA;
                    }

                    if(locZZ != null && isLocz){
                        serviceLocationId = locZZ;
                    }else if((!_.isEmpty(locAA) && !_.isUndefined(locAA)) && !isCenturyGlobalEthernet()){
                        serviceLocationId = locAA;
                    }else{
                        serviceLocationId  = selectedServicelocationId;
                    }

                    //added by David Tsamalashvili - 02/25/2016 - to clear Service Location for E-Line - Point to Point only
                    /*if(lineItem.optionName == 'E-Line - Point to Point'){
                        serviceLocationId = null;
                    }*/

                    objectData.serviceLocationId = serviceLocationId;
                }
            }

            return objectData;
        }
		
		function getOptionGroupName(optionGroupId){
            var groupName = "";
            _.each(allOptionGroups, function(optionGroup){
                _.each(optionGroup, function(item){
                    if(optionGroupId == item.groupId){
                        groupName = item.groupName;
                    }
                });
            });
            
            return groupName;
        }

        /*$scope.safeApply = function(fn) {
         var phase = this.$root.$$phase;
         if(phase == '$apply' || phase == '$digest') {
         if(fn && (typeof(fn) === 'function')) {
         fn();
         }
         } else {
         this.$apply(fn);
         }
         };*/

        function locationValidation(allOptionGroups, optionPAVs, mainBundleProdId, productIdtoComponentMap, productIdtoGroupMap, servicelocationId){
            var locZZ = null;
            var locAA = null;
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;

            //new check for service location from attributes
            if(!_.isEmpty(optionPAVs) || !_.isUndefined(optionPAVs)){
                _.each(optionPAVs, function(optionPav){
                    _.each(optionPav, function(item, key){
                        if(key.toLowerCase() == 'Location_A__c'.toLowerCase()){
                            locAA = item;
                        }if(key.toLowerCase() == 'Location_Z__c'.toLowerCase()){
                            locZZ = item;
                        }
                    });
                });
            }

            _.each(allOptionGroups, function(optiongroups, bProductId){
                _.each(optiongroups, function(optiongroup){
                    var parentId = optiongroup.parentId;
                    var grpName = optiongroup.groupName;
                    var isLocz = false;
                    if(grpName.indexOf('Location Z') != -1){
                        isLocz = true;
                    }

                    if(parentId == mainBundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                        && _.has(productIdtoGroupMap, parentId)
                        && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId]))){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent,optiongroup)){
                                productcomponent.isLocationZ = isLocz;
                                var componentId = productcomponent.componentId;
                                //var lineItemId = LineItemIds[productcomponent.productId];

                                /*
                                 if(_.has(optionPAVs, componentId)){
                                 var currentOptionAttributes = optionPAVs[componentId];
                                 if(_.has(currentOptionAttributes, 'Location_Z__c')){
                                 locZZ = currentOptionAttributes['Location_Z__c'];
                                 }
                                 if(_.has(currentOptionAttributes, 'Location_A__c')){
                                 locAA = currentOptionAttributes['Location_A__c'];
                                 }
                                 }
                                 */
                                if(locZZ != null && isLocz){
                                    productcomponent.serviceLocationId = locZZ;
                                }else if((!_.isEmpty(locAA) && !_.isUndefined(locAA)) && !isCenturyGlobalEthernet()){
                                    productcomponent.serviceLocationId = locAA;
                                }else{
                                    productcomponent.serviceLocationId  = servicelocationId;
                                }

                                //added by David Tsamalashvili - 02/25/2016 - to clear Service Location for E-Line - Point to Point only
                                /*if(productcomponent.productName == 'E-Line - Point to Point'){
                                    productcomponent.serviceLocationId = null;
                                }*/

                            }
                        });
                    }
                });
            });
            return allOptionGroups;//!isCenturyGlobalEthernet()
        }

        function runConstraintRules(){
            // remote call to save Quote Config.
            var deferred = $q.defer();
            var constraintRuleRequest = {
                cartId: BaseConfigService.cartId
                , lineNumber: BaseConfigService.lineItem.lineNumber
            };
            var requestPromise = RemoteService.runConstraintRules(constraintRuleRequest);
            requestPromise.then(function(result){
                /*appliedActionDOList is a List<Apttus_CPQApi.CPQ.AppliedActionDO>.
                IsPending                       :  Indicates Whether the rule action is pending user action.
                ########################Message Related##########################
                TriggeringProductIds (List<Id>) :  The list of triggering product ids that are in the cart.

                MessageType  (String)           :  Indicates whether the message is of warning type or error 
                                                   type.(Error/Warning/Info)
                Message     (String)            :  This is the message to be displayed when the rule action is
                                                   in pending state.
                IsShowPrompt                    :  This shows the message as a prompt. If the user cancels
                                                   the prompt instead of taking action, marks the rule as
                                                   ignored.
                ########################Auto inclusion/auto exclusion related########################
                IsAutoExecuted                  :  Indicates whether inclusion was performed by the system.
                                                   if true, dont worry - Ignore - products will be auto-included.
                                                   if false, process the rule and include SuggestedProductIds.
                ActionType  (String)            :  This is the type of rule action.(Inclusion/Exclusion/Validation/Recommendation/Replacement)
                ActionIntent                    :  Picklist on Constraint rule action. action intent depends on action type and SuggestedProductIds.
                                                   This is the intent of the rule action whether to auto include or disable selection and so on.(Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection)
                SuggestedProductIds (List<Id>)  :  The list of product ids suggested by the rule action to be
                                                   included or excluded.
                AffectedProductIds (List<Id>)   :  list of products being included/excluded by auto-executed = true;
                                                   The list of product ids added by auto inclusion or flagged
                                                   by exclusion.
                */
                var constraintActionDoList = result.appliedActionDOList;
                ConstraintRuleDataService.updateRuleActions(constraintActionDoList);

                var numRulesApplied = 0; //constraintActionDoList.length;
                // var allOptionGroups = getallOptionGroups();
                /*var productIdtoActionDOMap = {};

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
                 })*/

                var res = {isSuccess:true, numRulesApplied:numRulesApplied};
                deferred.resolve(res);
            })// end of runConstraintRules remote call.
            return deferred.promise;
        }

        function validateonsubmit(){
            MessageService.clearAll();
            // Validation 1 : Service location has to be selected.
            var res = true;
            var servicelocation = LocationDataService.getselectedlpa();
            var hasLocations = LocationDataService.gethasServicelocations();
			var l3ppCOSvalidation = ProductAttributeConfigDataService.cosBandwithLimitExc;
			var showCoSSelectionError = OptionGroupDataService.showCoSSelectionError;
            if(_.isEmpty(servicelocation)
                && hasLocations)
            {
                // alert('Please select service location to proceed.');
                MessageService.addMessage('danger', 'Please select location to Proceed.');
                res = false;
            }
			
			if(showCoSSelectionError){
				MessageService.addMessage('danger', 'You must select either one or three CoS Options. You cannot have two.');
			}
			if(l3ppCOSvalidation){
				MessageService.addMessage('Validation Error', 'The sum of COS bandwidth can not exceed the IQ Port Bandwidth.');
			}

            allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
            allLineItemsToOptionLineAttrMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			
			if(!_.isEmpty(allLineItemsToOptionLineAttrMap)){	
				var pavFieldNameKeys = {};
				_.each(allLineItemsToOptionLineAttrMap, function(value, key){
					if(key != 'undefined'){
						pavFieldNameKeys[key] = key;
					}					
				});
				
				_.each(pavFieldNameKeys, function(item){
					if(!_.has(allcomponentIdToOptionPAVMap, allLineItemsToOptionLineAttrMap[item])){
						allcomponentIdToOptionPAVMap[item] = allLineItemsToOptionLineAttrMap[item];
					}
				});
			}

            // Validation 2 : validate Min/Max options on option groups.
            var mainBundleProdId = BaseConfigService.lineItem.bundleProdId;
            allOptionGroups = OptionGroupDataService.getallOptionGroups();

            _.each(allOptionGroups, function(optiongroups, bProductId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        var productId = productcomponent.productId;
                        if(!_.isNull(productId))
                        {
                            productIdtoGroupMap[productId] = optiongroup;
                            productIdtoComponentMap[productId] = productcomponent;
                        }
                    })
                })
            })

            _.each(allOptionGroups, function(optiongroups, bProductId){
                _.each(optiongroups, function(optiongroup){
                    var parentId = optiongroup.parentId;
                    //if parent is bundle productId or selected then validate min max.
                    if(parentId == mainBundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                        && _.has(productIdtoGroupMap, parentId)
                        && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId])))
                    {
                        var minOptions = optiongroup.minOptions;
                        var maxOptions = optiongroup.maxOptions;
                        var selectedOptionsCount = 0;
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent,optiongroup))
                            {
                                selectedOptionsCount++;
                            }
                        })
                        if(minOptions > 0
                            && selectedOptionsCount < minOptions)
                        {
                            MessageService.addMessage('danger', 'Minimum of '+minOptions+' options have to be selected in '+optiongroup.groupName);
                            res = false;
                        }
                        if(maxOptions > 0
                            && selectedOptionsCount > maxOptions)
                        {
                            MessageService.addMessage('danger', 'Maximum of '+maxOptions+' options can to be selected from '+optiongroup.groupName);
                            res = false;
                        }
                    }
                })
            })

            // Validation 3 : required attributes validation on save.
            pavFieldNametoDFRMap = _.isEmpty(pavFieldNametoDFRMap) ? PAVObjConfigService.fieldNametoDFRMap : pavFieldNametoDFRMap;
            prodductIdtoattributegroupsMap = _.isEmpty(prodductIdtoattributegroupsMap) ? ProductAttributeConfigDataService.getProdductIdtoattributegroupsMap() : prodductIdtoattributegroupsMap;
			
		    // required fields validation for Bundle.
            var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
            var requiredFields = getMissingRequiredFields(mainBundleProdId, bundlePAV);
            var mainBundleProdName = BaseConfigService.lineItem.bundleProdName;
            if(_.size(requiredFields) > 0)
            {
                MessageService.addMessage('danger', 'Required Fields ('+requiredFields.join(', ')+') on '+mainBundleProdName+' are missing.');
                res = false;
            }

            // required fields validation for options.
            _.each(allOptionGroups, function(optiongroups, bProductId){
                _.each(optiongroups, function(optiongroup){
                    var parentId = optiongroup.parentId;
                    //if parent is bundle productId or selected then proceed.
                    if(parentId == mainBundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                        && _.has(productIdtoGroupMap, parentId)
                        && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId])))
                    {
                        _.each(optiongroup.optionLines, function(productcomponent){
                            if(isProdSelected(productcomponent, optiongroup))
                            {
                                var componentId = productcomponent.componentId;
                                var productId = productcomponent.productId;
                                var optionPAV = null;

                                if(productcomponent.lineItem && _.has(allLineItemsToOptionLineAttrMap, productcomponent.lineItem.lineItemId)){
                                    optionPAV = allLineItemsToOptionLineAttrMap[productcomponent.lineItem.lineItemId];
                                }else if(_.has(allcomponentIdToOptionPAVMap, componentId)) {
                                    optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                }

                                if(optionPAV){
                                    requiredFields = getMissingRequiredFields(productId, optionPAV);
                                    if(_.size(requiredFields) > 0) {
                                        MessageService.addMessage('danger', 'Required Fields ('+requiredFields.join(', ')+') on '+productcomponent.productName+' are missing.');
                                        res = false;
                                    }
                                }
                            }
                        });
                    }
                })
            })
            return res;
        }

        function isProdSelected(productcomponent, optiongroup){
            if(productcomponent.originalPComponent)
                productcomponent = productcomponent.originalPComponent;

            if((productcomponent.isselected
                && optiongroup.ischeckbox)
                || (productcomponent.productId == optiongroup.selectedproduct
                && !optiongroup.ischeckbox))
                return true;
            return false;
        }

        function isCenturyGlobalEthernet(){
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            if(!bundleProductName)
                return false;
            if(bundleProductName.toLowerCase() != 'CenturyLink Ethernet'.toLowerCase())
                return false;
            return true;
        }
		function isL3PP(){
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            if(!bundleProductName)
                return false;
            if(bundleProductName.toLowerCase() != 'L3 IQ Networking Private Port'.toLowerCase())
                return false;
            return true;
        }

        function validateUNIs(baseProduct){
            var deferred = $q.defer();
            if(!isCenturyGlobalEthernet() && !isL3PP()){
                deferred.resolve(true);
                return deferred.promise;
            }
            LineItemService.getLineItem().then(function(response){
                var errors = [];
                //var totalBandwidth = ProductAttributeConfigDataService.getCalculatedUNIBandwidth(false);

                //totalBandwidth = totalBandwidth ? parseInt(totalBandwidth.split(' ')[0]) : totalBandwidth;
                var currentSelectedLineItemBandle = LineItemService.getCurrentSelectedLineItemBundle();
                var hasSumOfBandwidth = false;
                var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
                _.each(currentSelectedLineItemBandle, function(object, key){
                    var isLastKey = key == currentSelectedLineItemBandle.length-1;
                    if(object.lineItemId){
                        var pav = lineItemsToOptionPAVMap[object.lineItemId];
						if(!_.isUndefined(pav) || !_.isEmpty(pav)){
							var bandwith = pav['UNI_Billable_Bandwidth__c'];
							
							bandwith = bandwith ? parseInt(bandwith.split(' ')[0]) : bandwith;
							
							/*if(bandwith && bandwith >= totalBandwidth){
								hasSumOfBandwidth = true;
							}*/
						}    
                        
                        if(isLastKey){
                            //if(!hasSumOfBandwidth)
                                //errors.push("At least one UNI should have sum of bandwidth when Multiple CoS option is selected");

                            var UNIS = _.filter(currentSelectedLineItemBandle, function(item) {
                                return item.optionName.indexOf("UNI") > -1;
                            });
							var EVCs = _.filter(currentSelectedLineItemBandle, function(item) {
                                return item.optionName.indexOf("Access EVC") > -1;
                            });

                            console.log(UNIS);
                            if((UNIS.length < 2 || UNIS.length > 50) && !isL3PP())
                                errors.push("Minimum of 2 and Maximum of 50 UNIs have to be selected");

							var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
							var bundleServiceType = bundlePAV['Service_Type_CGE__c'];
							var l3ppBundleServiceType = bundlePAV['Service_Type_L3__c'];
							if(bundleServiceType == 'EPLINE' || bundleServiceType == 'EVPLINE'){
								if(UNIS.length < 2 || UNIS.length > 2)
									errors.push("Minimum and Maximum of 2 UNIs can be selected for EPLINE/EVPLINE Service, Please add or remove UNIs to proceed");
							}
							if(l3ppBundleServiceType == 'EVPLINE'){
								if(EVCs.length > 20)
									errors.push("Maximum of 20 EVCs can be selected for EVPLINE Service, Please remove Additional EVCs to proceed");
							}
							//Adding to throw error, if configuration has invalid UNIs : Mithilesh							
							var hasInvalidUNI = isInvalidUNI();
							var hasInvalidEVC = isInvalidEVC();
							
							if(hasInvalidUNI)
								errors.push("Configuration contains invalid UNIs, Please Remove/Re-configure invalid UNIs to Proceed.");							
							if(hasInvalidEVC)
								errors.push("Your one of the Access EVC contains Invalid CoS Option selection. You must select either one or three under EVC CoS Options. You cannot have two.");							
                            if(errors.length>0){
                                _.each(errors, function(text){
                                    MessageService.addMessage('danger', text);
                                });
                                deferred.resolve(false);
                            }else{
                                deferred.resolve(true);
                            }
                            return deferred.promise;
                        }
                    }

                });
            });
            return deferred.promise;
        }

        /**
         * For now, just pass the rejected promise up.
         */
        function onRejection(reason) {
            MessageService.addMessage('danger', reason);
            return $q.reject(reason);
        }
		function isInvalidUNI(){
			var invalidUNI = false;
			_.each(OptionGroupDataService.getcurrentproductoptiongroups(), function(optiongroup){
				_.each(optiongroup.optionLines, function(pcomponent){
					if(pcomponent.productName == 'UNI' && pcomponent.showErrorOnUni == true){
						invalidUNI = true;
					}
				});
			});
			return invalidUNI;
		}
		
		function isInvalidEVC(){
			var invalidEVC = false;
			var evcOptionGroup = {};
			var allOptionGroups = OptionGroupDataService.getallOptionGroups();
			_.each(allOptionGroups, function(optiongroups){
				evcOptionGroup = _.findWhere(optiongroups, {groupName:"EVC(s)"});
				if(!evcOptionGroup)
					return;
				_.each(evcOptionGroup.optionLines, function(pcomponent){
					if(pcomponent.productName == 'Access EVC' && pcomponent.originalPComponent.evcHasError == true){
						invalidEVC = true;
					}
				});
			});
			return invalidEVC;
		}

        function getMissingRequiredFields(productId, pav){
            var aa = allcomponentIdToOptionPAVMap;

            var res = [];
            if(_.has(prodductIdtoattributegroupsMap, productId))
            {
                _.each(prodductIdtoattributegroupsMap[productId], function(attributeGroup){
                    ProductAttributeConfigDataService.getReqiredDynamicAttributes(attributeGroup);
                    _.each(attributeGroup.productAtributes, function(prodAttribute){
                        // if attribute is required and not selected then add the field.
                        var attributeapi = prodAttribute.fieldName;
                        if(!_.isUndefined(attributeapi)
                            && (!prodAttribute.isHidden || (prodAttribute.isHidden && prodAttribute.isRequiredDynamicAttribute))
                            && !prodAttribute.isReadOnly
                            && prodAttribute.isRequired
                            && (_.isUndefined(pav[attributeapi])
                            || _.isNull(pav[attributeapi])))
                        {
                            var attributeLabel = pavFieldNametoDFRMap[attributeapi].fieldDescribe.fieldLabel;
                            res.push(attributeLabel);
                        }
                    })
                })
            }
            return res;
        }

        function isUNIBuildOut(productcomponent, optiongroup){
            var existsLineItems = LineItemService.getCurrentSelectedLineItemBundle();
            if(existsLineItems && optiongroup.name == "UNI Options" && (productcomponent.productName == "Build Out" || productcomponent.productName == "UNI Port" || productcomponent.productName == "NID" || productcomponent.productName == "NMI Affiliate"))
                return true;
            return false;
        }

		function isEVCProduct(productcomponent, optiongroup){
            var existsLineItems = LineItemService.getCurrentSelectedLineItemBundle();
            if(existsLineItems && (optiongroup.groupName == "EVC CoS Options" || optiongroup.groupName == "EVC Add Ons"))
                return true;
            return false;
        }

        function formatPAVBeforeSave(pav){
            //// set the other picklist to original fields.
			var quoteSoruceCode = BaseConfigService.proposal.quoteSourceCode;
            pav = _.omit(pav, 'isDefaultLoadComplete');
            _.each(_.filter(_.keys(pav), function(pavField){                   
                    return pavField.endsWith('Other') || pavField.endsWith('Legacy');
                }),
                function(key){
                    var otherorlegacy = key.endsWith('Other') ? 'Other' : 'Legacy';
                    var keywithnootherLegacy = key.slice( 0, key.lastIndexOf( otherorlegacy ) );
                    if(pav[keywithnootherLegacy] == otherorlegacy){
						if(quoteSoruceCode !=  null && !_.isUndefined(quoteSoruceCode) && quoteSoruceCode.toLowerCase() == 'LITE'.toLowerCase() && keywithnootherLegacy.toLowerCase() == 'Service_Term__c'.toLowerCase()){
							var pavST = pav[key]+ (otherorlegacy == 'Other' ? '**' : '***');							
							pav[keywithnootherLegacy] = pavST.toString();
						}else{
							pav[keywithnootherLegacy] = pav[key]+ (otherorlegacy == 'Other' ? '**' : '***');
						}
					}                        
                    pav = _.omit(pav, key);
            })
            return pav;
        }


        function formatPAVBeforeSave_V2(pav){
            //// set the other picklist to original fields.
			var quoteSoruceCode = BaseConfigService.proposal.quoteSourceCode;
            var res = {pav1:{}, pav2:{}}, pav2 = {};
            pav = _.omit(pav, 'isDefaultLoadComplete');
            _.each(_.filter(_.keys(pav), function(pavField){
                    return pavField.endsWith('Other') || pavField.endsWith('Legacy');
                }),
                function(key){
                    var otherorlegacy = key.endsWith('Other') ? 'Other' : 'Legacy';
                    var keywithnootherLegacy = key.slice( 0, key.lastIndexOf( otherorlegacy ) );
                    if(pav[keywithnootherLegacy] == otherorlegacy){
						if(!_.isUndefined(quoteSoruceCode) && quoteSoruceCode.toLowerCase() == 'LITE'.toLowerCase() && keywithnootherLegacy.toLowerCase() == 'Service_Term__c'.toLowerCase()){
							var pavST = pav[key]+ (otherorlegacy == 'Other' ? '**' : '***');							
							pav[keywithnootherLegacy] = pavST.toString();
						}else{
							pav[keywithnootherLegacy] = pav[key]+ (otherorlegacy == 'Other' ? '**' : '***');
						}
					}
                    pav = _.omit(pav, key);
            })

            _.each(_.filter(_.keys(pav), function(pavField){
                    return pavField.startsWith('ProductAttributeValueId1__r.');
                }),
                function(key){
                    var keywithnorelationalfield = key.replace( 'ProductAttributeValueId1__r.', '');
                    pav2[keywithnorelationalfield] = pav[key];
                    pav = _.omit(pav, key);
            })
            // remove PAV2 attributes from PAV1 and prepare PAV2 object
            if(!_.isNull(_.findKey(pav, 'Id'))
                && _.isNull(pav2['ProductAttributeValueId__c']))
                pav2['ProductAttributeValueId__c'] = pav.Id;
            if(!_.isNull(pav2['Id']))
                _.omit(pav2, 'ProductAttributeValueId__c');
            res.pav1 = pav;
            res.pav2 = pav2;
            return res;
        }

        function freezeFullPage(){
            if(!isCenturyGlobalEthernet())
                return false;

            var existsLineItems = LineItemService.getCurrentSelectedLineItemBundle();
            if(_.isEmpty(existsLineItems))
                return true;
            return false;
        }

        function removeExtraAttributes(attributes, componentIdToProdIdMap, prodductIdtoattributegroupsMap){
            _.each(attributes, function(attr){
				if(!attr) return;
                _.each(componentIdToProdIdMap, function(item, mkey){
                    if(mkey == attr.componentId){
                        var currentOptGrpAttrs = [];
                        if(_.has(prodductIdtoattributegroupsMap, componentIdToProdIdMap[mkey].optionId)){
                            var attrGrps = prodductIdtoattributegroupsMap[componentIdToProdIdMap[mkey].optionId];
                            if(!_.isEmpty(attrGrps)){
                                _.each(attrGrps, function(prAttributes){
                                    _.each(prAttributes.productAtributes, function(cAttribute){
                                        currentOptGrpAttrs[cAttribute.fieldName] = cAttribute.fieldName;
                                    });
                                });

                            }
                        }
                        _.each(attr.attributes1, function(allAtrApis, key){
                            if(!_.has(currentOptGrpAttrs, key)){
                                attr.attributes1 = _.omit(attr.attributes1, key);
                            }
                        });
                        if(!_.isEmpty(attr.attributes2)){
                            _.each(attr.attributes2, function(allAtrApis, key){
								var newK = 'ProductAttributeValueId1__r.' + key;
                                if(!_.has(currentOptGrpAttrs, newK)){
                                    attr.attributes2 = _.omit(attr.attributes2, key);
                                }
                            });
                        }
                    }
                });
            });

            return attributes;
        }
		
		function pavToPav2(allcomponentIdToOptionPAVMap, allLineItemsToOptionAttrMap){
			var productAttributeValueId1 = {};
			var pavValues = [];
			
			_.each(allcomponentIdToOptionPAVMap, function(item){
				if(_.has(item, 'ProductAttributeValueId1__r')){
					_.each(item, function(pav2, key){
						if(key.contains('ProductAttributeValueId1__r') && !_.isObject(pav2))
							productAttributeValueId1[key] = pav2; 
					});
					
					if(!_.isEmpty(productAttributeValueId1) || !_.isUndefined(productAttributeValueId1)){
						_.each(productAttributeValueId1, function(pav2ex, key){
							if(_.isObject(pav2ex)){
								productAttributeValueId1 = _.omit(pav2ex);
							}else{
								var newKey = key.replace('ProductAttributeValueId1__r.', '');
								pavValues[newKey] = pav2ex;
							}								
						});
						item.ProductAttributeValueId1__r = pavValues;
						productAttributeValueId1 = {};
					}
				}				
			});
			
			_.each(allLineItemsToOptionAttrMap, function(item){
				if(_.has(item, 'ProductAttributeValueId1__r')){
					_.each(item, function(pav2, key){
						if(key.contains('ProductAttributeValueId1__r') && !_.isObject(pav2))
							productAttributeValueId1[key] = pav2; 
					});
					
					if(!_.isEmpty(productAttributeValueId1) || !_.isUndefined(productAttributeValueId1)){
						_.each(productAttributeValueId1, function(pav2ex, key){
							if(_.isObject(pav2ex)){
								productAttributeValueId1 = _.omit(pav2ex);
							}else{
								var newKey = key.replace('ProductAttributeValueId1__r.', '');
								pavValues[newKey] = pav2ex;
							}								
						});
						item.ProductAttributeValueId1__r = pavValues;
						productAttributeValueId1 = {};
					}
				}
			});
		}

		if(!String.prototype.endsWith){
		  String.prototype.endsWith = function(searchString, position){
			  var subjectString = this.toString();
			  if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
				position = subjectString.length;
			  }
			  position -= searchString.length;
			  var lastIndex = subjectString.indexOf(searchString, position);
			  return lastIndex !== -1 && lastIndex === position;
		  };
		}
		
		if(!String.prototype.startsWith){
			String.prototype.startsWith = function (str) {
				return !this.indexOf(str);
			}
		}

		String.prototype.contains = function(it){
			return this.indexOf(it) != -1; 
		};
		
    }
})();