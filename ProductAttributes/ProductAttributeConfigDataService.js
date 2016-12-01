(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeConfigDataService', ProductAttributeConfigDataService); 
	ProductAttributeConfigDataService.$inject = ['$q', '$log', '$dialogs', 'BaseService', 'BaseConfigService', 'RemoteService', 'OptionGroupDataService', 'ProductAttributeConfigCache', 'PAVObjConfigService', 'ProductAttributeValueDataService', 'LineItemService', 'LineItemAttributeValueDataService', 'ReusableUniSelectorDataService', 'MessageService', 'SystemConstants', 'LocationDataService'];
	function ProductAttributeConfigDataService($q, $log, $dialogs, BaseService, BaseConfigService, RemoteService, OptionGroupDataService, ProductAttributeConfigCache, PAVObjConfigService, ProductAttributeValueDataService, LineItemService, LineItemAttributeValueDataService, ReusableUniSelectorDataService, MessageService, SystemConstants , LocationDataService) {
		var service = this;
		var bundleAttribueFields = [];
		var isLocationZ = false;
		var depattributes = {};
		var dynamicRequired = [];				
		var eLinePointToPointLocA = '';
		var eLinePointToPointLocZ = '';
		var unifiedSAtt = [];
		var cpuLicenseSettings = [];
		var EoCuSettings = [];
		var attributeApis = [];
		var totalCPULicenseCount = 0;
		var isSparc = false;
		var allApplicationTypes = [];
		var allDatabaseTypes = [];
		var cpuFieldApis = [];
		var cpuLicenceCount = 1;
		var specialOffers = [];
		var L3PPPortBandwidthForUNI = '';
		var realTimeCOSBand = '';
		var guaranteedCOSBand = '';
		var businessCOSBand = '';
		var cosBandwithLimitExc = false;
		var CosSum = 0;
		var l3ppBandPrt = '';
		var owsMetroQCCOnNet = false;

		// product attribute methods.
		
		service.getProductAttributesConfig = getProductAttributesConfig;
		service.getDynamicGroups = getDynamicGroups;
		service.getBundleAttributeFields = getBundleAttributeFields;
		service.setBundleAttributeFields = setBundleAttributeFields;
		service.setSelectedLocationZ = '';
		service.removeSpecialChars = removeSpecialChars;
		service.setProductAttributeValues = setProductAttributeValues;
		service.setBuildOutOptions = setBuildOutOptions;
		service.disableOptionForNoSpeed = disableOptionForNoSpeed;
		service.setBandwidthLimit = setBandwidthLimit;
		service.removeSpecialCharsPAVChange = removeSpecialCharsPAVChange;
		service.setMultiSiteLocations = setMultiSiteLocations;
		service.optionAttributeChangeConstraint = optionAttributeChangeConstraint;
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908		
		//service.seatTypeExpressions = seatTypeExpressions;
		service.getLocationZ = getLocationZ;
		service.getProdductIdtoattributegroupsMap = getProdductIdtoattributegroupsMap;
		service.validateZoneAttributes = validateZoneAttributes;
		service.getReqiredDynamicAttributes = getReqiredDynamicAttributes;
		service.bundleAttributeChangeConstraint = bundleAttributeChangeConstraint;
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		//service.updateTotalSeatQuantity = updateTotalSeatQuantity;
		service.getCGELocationsCheck = getCGELocationsCheck;
		service.setCGEProductAttributeValues = setCGEProductAttributeValues;
		service.getAttributeFromBundle = getAttributeFromBundle;
		service.getCalculatedUNIBandwidth = getCalculatedUNIBandwidth;
		service.setBandWidthToUNIAttributes = setBandWidthToUNIAttributes;
		//service.setBillableBandwidthToUNIs = setBillableBandwidthToUNIs;
		service.setPortBandwidthToUNI = setPortBandwidthToUNI;
		service.calculateGeography = calculateGeography;
		service.OWSSetLocationAccessMarket = OWSSetLocationAccessMarket;
		service.setAttributeCustomActions = setAttributeCustomActions;
		service.eLinePointToPointCheck = eLinePointToPointCheck;
		service.unifiedStorageValidation = unifiedStorageValidation;
		service.vchsValidation = vchsValidation;
		service.checkEVCSingleCoS = checkEVCSingleCoS;
		service.getESLUNIs = getESLUNIs;
		service.setNewtorkZCountry = setNewtorkZCountry;
		service.calculateMailboxTotal = calculateMailboxTotal;
		service.getCPULicenseCount = getCPULicenseCount;
		service.initializeCPULicenseCount = initializeCPULicenseCount;
		service.initializeEoCuFlag = initializeEoCuFlag;
		service.totalCPULicenseCount = totalCPULicenseCount;
		service.isSparc = isSparc;
		service.cpuLicenceCount = cpuLicenceCount;
		service.filterPAV2Values = filterPAV2Values;
		service.initializeSpecialOffers = initializeSpecialOffers;
		service.setSpecialOffcers = setSpecialOffcers;
		service.setReuseUni = setReuseUni;
		service.setCCID = setCCID;
		service.setVantiveSiteId = setVantiveSiteId;
		service.setDistanceToFiberFormula = setDistanceToFiberFormula;
		service.validateUNI = validateUNI;
		service.legacyValidation = legacyValidation;
		service.checkOptionLineStatusLegacy = checkOptionLineStatusLegacy;
		service.checkPortOptionsReconfig = checkPortOptionsReconfig;
		service.displayCELocQualificationMessage = displayCELocQualificationMessage;
		
		service.validateElinePop = validateElinePop;
		service.validateL3PPPort = validateL3PPPort;
		service.removeExtraSpace = removeExtraSpace;
		service.liteServiceTerm = liteServiceTerm;
		service.validateL3PPUNIBandwidth = validateL3PPUNIBandwidth;
		service.cosBandwithLimitExc = cosBandwithLimitExc;
		service.recalculateL3PPCosBandwidth = recalculateL3PPCosBandwidth;
		service.CosSum = CosSum;
		service.l3ppBandPrt = l3ppBandPrt;
		service.realTimeCOSBand = realTimeCOSBand;
		service.guaranteedCOSBand = guaranteedCOSBand;
		service.businessCOSBand = businessCOSBand;
		service.owsMetroQCCOnNet = owsMetroQCCOnNet;
		
		function getProductAttributesConfig_bulk(servicelocationIdSet, productIds, groupIds) {
			// check if cachedProductAttributes has products requested for else make a remote call.
			var cachedProductAttributes = ProductAttributeConfigCache.getProductAttributesConfig();
			var existingproductIds = _.keys(cachedProductAttributes.prodductIdtoattributegroupsMap);
			var productIds_filtered = _.filter(productIds, function(Id){ return !_.contains(existingproductIds, Id); });
			if (ProductAttributeConfigCache.isValid
				&& productIds_filtered.length < 1) {
				// logTransaction(cachedProductAttributes);
				return $q.when(cachedProductAttributes);
			}

			var attributeGroupRequest = {servicelocationIds:servicelocationIdSet
                                        , bundleprodId: BaseConfigService.lineItem.bundleProdId
                                        , productIdsList: productIds_filtered
                                        , allgroupIds: groupIds
                                        };
            var requestPromise = RemoteService.getAttributeGroups(attributeGroupRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				ProductAttributeConfigCache.initializeProductAttributes(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAConfigLoadComplete();
				return ProductAttributeConfigCache.getProductAttributesConfig();
			});
		}

		function getProductAttributesConfig( productId, alllocationIdSet, selectedlocationId, optionGroupName) {
			var productIdset = [], allgroupIds = [];
			var currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
            var prodattributeResult = ProductAttributeConfigCache.getProductAttributesConfig();
			var location = checkIfLocationIsZ(currentproductoptiongroups, productId, service.setSelectedLocationZ, selectedlocationId, optionGroupName);
			if(!_.isEmpty(location)){
				selectedlocationId = location;
			}			
			var dynamicgroupId = selectedlocationId != '' ? productId+selectedlocationId : '';
			if (ProductAttributeConfigCache.isValid
				&& prodattributeResult != null
				&& prodattributeResult.prodductIdtoattributegroupsMap != null
				&& _.has(prodattributeResult.prodductIdtoattributegroupsMap, productId))
			{
				var res = buildattributegroups(prodattributeResult.prodductIdtoattributegroupsMap, productId, prodattributeResult.productIdtodynamicattributegroupMap,
															dynamicgroupId);
				return $q.when(res);
			}

			productIdset = OptionGroupDataService.getAllProductIds();//getAllProductsinCurrentOptiongroups(currentproductoptiongroups, 'productOptionComponents', 'productId');
            productIdset.push(productId);
            
            return getProductAttributesConfig_bulk(alllocationIdSet, productIdset, allgroupIds).then(function(result) {
            	var res = buildattributegroups(result.prodductIdtoattributegroupsMap, productId, result.productIdtodynamicattributegroupMap,
                                                        dynamicgroupId);
            	return res;
            });
		}

		function getDynamicGroups(groupId){
			var res = [];
			var prodattributeResult = ProductAttributeConfigCache.getProductAttributesConfig();
			if(_.has(prodattributeResult.productIdtodynamicattributegroupMap, groupId))
            {
                var dynamicgroup = prodattributeResult.productIdtodynamicattributegroupMap[groupId];
                res.push(dynamicgroup);
            }
            return res;
		}

		// Util methid. a: product Id to attribute groups map, b: productId, c: product to dynamic group map., d: dynamic group Id.
        function buildattributegroups(a, b, c, d){
            var res = [];
			if(_.isObject(c)
            	&& _.has(c, d))
            {
                res.push(c[d]);
            }
			
            if(_.has(a, b))
            {
                _.each(a[b], function(g) {
                    res.push(g);
                })
            }
            
            return res;
        }

		// util method. a: option groups, b: field name to access product components, c: field name to access product Id within product component.
        function getAllProductsinCurrentOptiongroups(a, b, c){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (group) {
                res.push(_.pluck(group[b], c));
            });
			res = _.flatten(res);// Flattens a nested array.
            res = _.filter(res, function(prodId){return !_.isUndefined(prodId)});
			return res;
        }

        function setBundleAttributeFields(attrgroups){
        	_.each(attrgroups, function(attrgroup){
                bundleAttribueFields.push(_.pluck(attrgroup.productAtributes, 'fieldName'));
            })
            bundleAttribueFields = _.flatten(bundleAttribueFields);
        }

        function getBundleAttributeFields(){
        	return bundleAttribueFields;
        }
		
		function checkIfLocationIsZ(optionGroups, selectedProductId, locZ, selectedLoc, optionGroupName){
			var loc = '';
			if(!_.isUndefined(optionGroupName) || !_.isEmpty(optionGroupName)){
				_.each(optionGroups, function(optGroup){
					_.each(optGroup.productOptionComponents, function(component){
						if(component.productId == selectedProductId && optionGroupName.indexOf('Location Z') != -1 && locZ != null){
							loc = locZ;
						}
						if(component.productId == selectedProductId && optionGroupName.indexOf('Location A') != -1 && selectedLoc != null){
							loc = selectedLoc;
						}
					});
				});
			}
			return loc;
		}
		
		function setProductAttributeValues(pavs, selectedSr, zLoc){
			if(_.has(pavs, 'Location_A__c')){
				pavs['Location_A__c'] = selectedSr.Name;
			}
			if(_.has(pavs, 'Location_Z__c')){
				pavs['Location_Z__c'] = zLoc;
			}
			
			return pavs;
		}
		
		function setBandwidthLimit(pav, attributeGroups, bundleProductName){
				_.each(attributeGroups, function(eachgroup){
					_.each(eachgroup.productAtributes, function(eachattribute){
						if(bundleProductName == 'L3 IQ Networking Private Port' && eachattribute.fieldName == 'Bandwidth_Mbps_GWS_Firewall_Service__c'){
							var buildOutSpeeds = _.findWhere(eachgroup.productAtributes, {fieldName : 'Buildout_Option_Speeds__c'});
							if(buildOutSpeeds){
								_.each(buildOutSpeeds.lovs, function(lov){
									if(!_.contains(lov,'Fiber')){
										var maxNetworkLimitLovs = _.findWhere(eachgroup.productAtributes, {fieldName : 'Buildout_Speeds_New__c'}).lovs;
										var maxNetworkLimit = maxNetworkLimitLovs[maxNetworkLimitLovs.length - 1];
										//var speedBuildOut = lov.split("^");
										//if( speedBuildOut[0] == optionPAV['Ethernet_Local_Access_Speed__c']){
											var buildOutMaxNet = _.findWhere(eachgroup.productAtributes, {fieldName : 'Bandwidth_Mbps_GWS_Firewall_Service__c'});
											if(buildOutMaxNet){
												buildOutMaxNet.isReadOnly = true;
												buildOutMaxNet.isHidden = false;
												buildOutMaxNet.picklistValues = PAVObjConfigService.prepareOptionsList(new Array(maxNetworkLimit));
												pav['Bandwidth_Mbps_GWS_Firewall_Service__c']  = maxNetworkLimit;
											}
										//}
									}
									else{
										var buildOutMaxNet = _.findWhere(eachgroup.productAtributes, {fieldName : 'Bandwidth_Mbps_GWS_Firewall_Service__c'});
										if(buildOutMaxNet){
												buildOutMaxNet.isReadOnly = true;
												buildOutMaxNet.isHidden = false;
												buildOutMaxNet.picklistValues = PAVObjConfigService.prepareOptionsList(new Array(buildOutMaxNet[1]));
												pav['Bandwidth_Mbps_GWS_Firewall_Service__c']  = buildOutMaxNet[1];
											}
									}
								});
							}

						}
					});
				});
			
		}

		function setBuildOutOptions(optionPAV, attributeGroups){
			if(_.has(optionPAV, 'Ethernet_Local_Access_Speed__c') && !_.isEmpty(optionPAV['Ethernet_Local_Access_Speed__c'])){
				_.each(attributeGroups, function(eachgroup){
					_.each(eachgroup.productAtributes, function(eachattribute){
						if(eachattribute.fieldName == 'Ethernet_Local_Access_Speed__c'){
							var buildOutSpeeds = _.findWhere(eachgroup.productAtributes, {fieldName : 'Buildout_Option_Speeds__c'});
							if(buildOutSpeeds){
								_.each(buildOutSpeeds.lovs, function(lov){
									if(!_.isEmpty(lov)){
										var speedBuildOut = lov.split("^");
										if( speedBuildOut[0] == optionPAV['Ethernet_Local_Access_Speed__c']){
											var buildOut = _.findWhere(eachgroup.productAtributes, {fieldName : 'Buildout_Options__c'});
											if(buildOut){
												buildOut.isReadOnly = true;
												buildOut.picklistValues = PAVObjConfigService.prepareOptionsList(new Array(speedBuildOut[1]));
												optionPAV['Buildout_Options__c']  = speedBuildOut[1];
											}
										}
									}
								});
							}

						}
					});
				});
			}
		}

		function disableOptionForNoSpeed(optionPAV, attributeGroups, productName, currentOptionGroupName){
			var currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
			var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
			_.each(currentproductoptiongroups, function(group){
				// when a speed is NOT available at a location for an option, that option should be disabled.
				_.each(group.productOptionComponents, function(component){

					if( (group.groupName == 'Local Access - Location A' || group.groupName == 'Local Access - Location Z'))
					{
						var dynamicAttr = _.findWhere(attributeGroups, {groupName : 'Dynamic attributes'});
						if(!dynamicAttr && component.productName == productName && currentOptionGroupName == group.groupName){
							component['isAvailableonSLocation'] = false;
							if(component.isselected == true)
								component.isselected = false;
							if(group.selectedproduct == component.productId)
								group.selectedproduct = null;

						}
					}
					else if (group.groupName == 'Local Access' && _.has(bundlePAV, 'Speed__c') && !_.isEmpty(bundlePAV['Speed__c'])){
						var setAllOptionAttributesReadOnly = false;
						_.each(attributeGroups, function(eachgroup){
							_.each(eachgroup.productAtributes, function(eachattribute){
								    var isMatched = _.contains(eachattribute.lovs,bundlePAV['Speed__c']);
								    if(!isMatched){
									    _.each(eachattribute.lovs, function(optionSpeedValue){
									    	
									    	//var speedFormatBundle = bundlePAV['Speed__c'].replace(/\d/g, "");
									    	//var speedFormatOption = optionSpeedValue.replace(/\d/g, "");
									    	// (DS3) , (ELA) 
									    	var speedFormatBundle = bundlePAV['Speed__c'].substring(bundlePAV['Speed__c'].indexOf(" "));
									    	var speedFormatOption = optionSpeedValue.substring(optionSpeedValue.indexOf(" "));
									    	// 1.5M , 5x1G , 1G , 600M
									    	var speedFormatBundle2 = bundlePAV['Speed__c'].substring(0,bundlePAV['Speed__c'].indexOf(" "));
									    	var speedFormatOption2 = optionSpeedValue.substring(0,optionSpeedValue.indexOf(" "));
									    	// M , G
									    	var speedFormatBundle3 = speedFormatBundle2.replace(/[^\D]/g, "");
									    	var speedFormatOption3 = speedFormatOption2.replace(/[^\D]/g, "");

									    	if(speedFormatBundle == speedFormatOption && speedFormatBundle3 == speedFormatOption3){
									    		var speedValueBundle = speedFormatBundle2.replace(/[^\d.]/g, "");
									    		var speedValueOption = speedFormatOption2.replace(/[^\d.]/g, "");
									    		if( Number(speedValueBundle) < Number(speedValueOption) ){
									    			isMatched = true;
									    		}
									    	}

									    })
									}
									if(eachgroup.groupName == 'Dynamic attributes' && eachattribute.fieldName == 'Ethernet_Local_Access_Speed__c' && !isMatched && component.productName == productName && currentOptionGroupName == group.groupName ){
										setAllOptionAttributesReadOnly = true;
										component['isAvailableonSLocation'] = false;
										if(component.isselected == true)
											component.isselected = false;
										if(group.selectedproduct == component.productId)
											group.selectedproduct = null;
										
										
									}
								
								if(setAllOptionAttributesReadOnly == true && eachattribute.isReadOnly == false){
									eachattribute.isReadOnly = true;
								}else if(setAllOptionAttributesReadOnly == false && eachattribute.isReadOnly == true && component.productName == productName && currentOptionGroupName == group.groupName){
									eachattribute.isReadOnly = false;
								}
							})
							
						})
					}

				})
			})
		}

		function removeSpecialCharsPAVChange(AttributeGroups){			
			_.each(AttributeGroups, function(attrGroups){
				var groupName = removeSpecialChars(attrGroups.groupName);
				attrGroups.groupName = groupName;
				_.each(attrGroups.productAtributes, function(attribs){
					_.each(attribs.picklistValues, function(item){
						var pickLabel = '';
						var pickValue = '';
						if(item.label != null){
							pickLabel = removeSpecialChars(item.label);
						}
						if(item.value != null){
							pickValue = removeSpecialChars(item.value);
						}							
							
						item.label = pickLabel;
						item.value = pickValue;
					});
				});
			});
			
			return AttributeGroups;
		}
		
		function setMultiSiteLocations(productAttributeValues, allLocations){
			if(_.has(productAttributeValues, 'Location_A__c')){
				OptionGroupDataService.LocationAValue = productAttributeValues['Location_A__c'];
			}
			if(_.has(productAttributeValues, 'Location_Z__c')){	
				_.each(allLocations, function(LocItem){
					if(LocItem.Id == productAttributeValues['Location_Z__c']){
						OptionGroupDataService.LocationZValue = LocItem.Name;
					}
				});
			}
		}
		
		function optionAttributeChangeConstraint(optionAttributes, portOptions, AttributeGroups, productAttributeValues, localAccessComponentId, allComponentToPAVs, optionGroupName){
			var filteredPortOption = ''
			var Bandwidth = [];
			var CircuitSpeed = [];
			var BillingType = [];
			var BandwidthSplitted = [];
			var CircuitSpeedSplitted = [];
			var BillingTypeSplitted = [];
			var bandwidthIs = false;
			var circuitSpeedIs = false;
			var billingTypeIs = false;
			var result = [];
			var billingTypePAV = optionAttributes['Billing_Type__c'];
			var changeBillingType = true;
						
			
            if(_.has(optionAttributes, 'Ethernet_Local_Access_Speed__c')
                && !_.isNull(optionAttributes['Ethernet_Local_Access_Speed__c'])){
                depattributes['AccessSpeed'] = optionAttributes['Ethernet_Local_Access_Speed__c'];
            }
			if((!_.isEmpty(allComponentToPAVs) || !_.isUndefined(allComponentToPAVs)) && (!_.isEmpty(localAccessComponentId) || !_.isUndefined(localAccessComponentId))){
				if(!_.isUndefined(optionGroupName) && optionGroupName.toLowerCase() != 'Local Access'.toLowerCase()){
					if(_.has(allComponentToPAVs, localAccessComponentId)){
						var currentLocalAccessComponent = allComponentToPAVs[localAccessComponentId];
						if(_.has(productAttributeValues, 'Ethernet_Local_Access_Speed__c')){
							depattributes['AccessSpeed'] = productAttributeValues['Ethernet_Local_Access_Speed__c'];
						}else{
							if(_.isUndefined(depattributes['AccessSpeed']) || _.isEmpty(depattributes['AccessSpeed'])){
								if(_.has(currentLocalAccessComponent, 'Ethernet_Local_Access_Speed__c')){
									depattributes['AccessSpeed'] = currentLocalAccessComponent['Ethernet_Local_Access_Speed__c'];
								}
							}								
						}							
					}
				}
            }

			_.each(portOptions, function(option){
				if(option['Local_Access_Speed__c'] == depattributes.AccessSpeed){
					BillingTypeSplitted.push(option['Billing_Type__c']);
				}
			});
			
			_.each(BillingTypeSplitted, function(item){
				if(item == billingTypePAV){
					changeBillingType = false;
				}
			});
			
			
			if(BillingTypeSplitted.length > 1){				
				if(changeBillingType){
					billingTypePAV = BillingTypeSplitted[1];
					depattributes['BillingType'] = BillingTypeSplitted[1];
				}else{
					depattributes['BillingType'] = billingTypePAV;
				}			
			}else if(BillingTypeSplitted.length == 1){
				depattributes['BillingType'] = BillingTypeSplitted[0];
				billingTypePAV = BillingTypeSplitted[0];
			}
			
			
			
			BillingType = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(BillingTypeSplitted));
            
            if(_.has(depattributes, 'AccessSpeed') 
                && _.has(depattributes, 'BillingType')){                
                filteredPortOption = _.findWhere(portOptions, {'Local_Access_Speed__c': depattributes.AccessSpeed, 'Billing_Type__c': depattributes.BillingType});
                if(_.has(filteredPortOption, 'Bandwidth__c') 
                    && _.has(filteredPortOption, 'Circuit_Speed__c')){
                    
                    BandwidthSplitted = filteredPortOption['Bandwidth__c'].split(', ');
                    CircuitSpeedSplitted = filteredPortOption['Circuit_Speed__c'].split(', ');                      
                    
                    Bandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(BandwidthSplitted));
                    CircuitSpeed = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(CircuitSpeedSplitted));
                    
					_.each(Bandwidth, function(item){
						if(item.value != null && (item.value == productAttributeValues['Bandwidth__c'])){
							bandwidthIs = true;
						}
					});
					
					_.each(CircuitSpeed, function(item){
						if(item.value != null && (item.value == productAttributeValues['Access_Speed__c'])){
							circuitSpeedIs = true;
						}
					});
					
                    _.each(AttributeGroups, function(eachgroup){
                        _.each(eachgroup.productAtributes, function(eachattribute){
                            if(eachattribute.fieldName == 'Bandwidth__c'){
                                eachattribute.picklistValues = Bandwidth;
                                if(!bandwidthIs){
									productAttributeValues['Bandwidth__c'] = Bandwidth[1].value;
								} 					
                            }
                            
                            if(eachattribute.fieldName == 'Access_Speed__c'){
                                eachattribute.picklistValues = CircuitSpeed;
                                if(!circuitSpeedIs){
									productAttributeValues['Access_Speed__c'] = CircuitSpeed[1].value;
								} 
                            }
							
							if(eachattribute.fieldName == 'Billing_Type__c'){
								eachattribute.picklistValues = BillingType; 
								productAttributeValues['Billing_Type__c'] = billingTypePAV;
							}
							
                        });
                    });
					
					result['productAttributeValues'] = productAttributeValues;
					result['AttributeGroups'] = AttributeGroups;
					
                }else{
					Bandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(BandwidthSplitted));
                    CircuitSpeed = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(CircuitSpeedSplitted));
					
					_.each(AttributeGroups, function(eachgroup){
                        _.each(eachgroup.productAtributes, function(eachattribute){
                            if(eachattribute.fieldName == 'Bandwidth__c'){
                                eachattribute.picklistValues = Bandwidth;
								productAttributeValues['Bandwidth__c'] = '--None--';
                            }
                            
                            if(eachattribute.fieldName == 'Access_Speed__c'){
                                eachattribute.picklistValues = CircuitSpeed;
								productAttributeValues['Access_Speed__c'] = '--None--';
                            }
                        });
                    });
					
					result['productAttributeValues'] = productAttributeValues;
					result['AttributeGroups'] = AttributeGroups;
				}
            }
			if(_.has(depattributes, 'AccessSpeed') 
                && !_.has(depattributes, 'BillingType')){
				
				Bandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(BandwidthSplitted));
				CircuitSpeed = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(CircuitSpeedSplitted));
				
				_.each(AttributeGroups, function(eachgroup){
					_.each(eachgroup.productAtributes, function(eachattribute){
						if(eachattribute.fieldName == 'Bandwidth__c'){
							eachattribute.picklistValues = Bandwidth;                                
							productAttributeValues['Bandwidth__c'] = '--None--';								  
						}
						
						if(eachattribute.fieldName == 'Access_Speed__c'){
							eachattribute.picklistValues = CircuitSpeed;
							productAttributeValues['Access_Speed__c'] = '--None--';
						}
						
						if(eachattribute.fieldName == 'Billing_Type__c'){
							 eachattribute.picklistValues = BillingType; 
							 if(!billingTypeIs){
								productAttributeValues['Billing_Type__c'] = '--None--';
							 }
						}
					});
				});				
				result['productAttributeValues'] = productAttributeValues;
				result['AttributeGroups'] = AttributeGroups;
			}
			
			return result;
		}
		
		function bundleAttributeChangeConstraint(attributeGroups, pav, bundlePortOptions){
			var filteredPortOption = '';
			var accessSpeed = [];
			var bandwidth = [];
			var billingType = [];
			var result = [];
			
			if((!_.isEmpty(attributeGroups) || !_.isUndefined(attributeGroups)) && (!_.isEmpty(pav) || !_.isUndefined(pav))){			
				if(_.has(pav, 'Speed__c')){
					var pavSpeed = pav['Speed__c'];
					filteredPortOption = _.findWhere(bundlePortOptions, {'Speed__c': pavSpeed});
					if(!_.isUndefined(filteredPortOption) || !_.isEmpty(filteredPortOption)){	
						accessSpeed.push(filteredPortOption['Access_Speed__c']);
						bandwidth.push(filteredPortOption['Bandwidth__c']);
						billingType.push(filteredPortOption['Billing_Type__c']);
						
						var preparedAccessSpeed = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(accessSpeed));
						var preparedBandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(bandwidth));
						var preparedBillingType = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(billingType));
						
						_.each(attributeGroups, function(attrGroups){
							_.each(attrGroups.productAtributes, function(attr){
								if(attr.fieldName == 'Access_Speed__c'){
									attr.picklistValues = preparedAccessSpeed;
									pav['Access_Speed__c'] = filteredPortOption['Access_Speed__c'];
								}if(attr.fieldName == 'Bandwidth__c'){
									attr.picklistValues = preparedBandwidth;
									pav['Bandwidth__c'] = filteredPortOption['Bandwidth__c'];
								}
								if(attr.fieldName == 'Billing_Type__c'){
									attr.picklistValues = preparedBillingType;
									pav['Billing_Type__c'] = filteredPortOption['Billing_Type__c'];
								}
							});
						});
						
						result['pav'] = pav;
						result['AttributeGroups'] = attributeGroups;
						return result;
					}
				}
				
			}
			
		}
		
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		function seatTypeExpressions(AttributeGroups, productAttributeValues){
			var count = OptionGroupDataService.seatTypeCount;
			
			_.each(AttributeGroups, function(attrGroups){
				_.each(attrGroups.productAtributes, function(item){
					if(item.fieldName == 'Total_Seats__c'){
						item.isReadOnly = true;
						productAttributeValues['Total_Seats__c'] = count;
					}
				});
			});
			return productAttributeValues;
		}
		*/
		
		function removeSpecialChars(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            //unescape: replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);           
            return changedItem;
        }
		
		function getLocationZ(pav){	
			var zLoc = '';	
            if(_.has(pav, 'Location_Z__c') 
                && (pav['Location_Z__c'] == null 
                || pav['Location_Z__c'] == 'undefined')){
                zLoc = null;
            }else{
                zLoc = pav['Location_Z__c'];
            }
			return zLoc;
		}

		function getAttributeFromBundle(pav, fieldName){
			var zLoc = '';
			if(_.has(pav, fieldName)
				&& (pav[fieldName] == null
				|| pav[fieldName] == 'undefined')){
				zLoc = null;
			}else{
				zLoc = pav[fieldName];
			}
			return zLoc;
		}

		function getProdductIdtoattributegroupsMap(){
        	return ProductAttributeConfigCache.getProdductIdtoattributegroupsMap();
        }
		
		function validateZoneAttributes(attributeGroups, pav){
			_.each(attributeGroups, function(groupItems){
				_.each(groupItems.productAtributes, function(attribute, index){
					if(attribute.fieldName == 'Zone__c' && _.has(attribute, 'picklistValues')){
						if(!_.isEmpty(attribute.picklistValues)){
							pav['Zone__c'] = attribute.picklistValues[0].value;
							attribute.isReadOnly = true;
							attribute.isHidden = true;
						}						
					}
				});
			});
		}
		
		function getReqiredDynamicAttributes(AttributeGroups){
			
			if(_.isUndefined(dynamicRequired) || _.isEmpty(dynamicRequired)){
				var requestPromise = RemoteService.dynamicRequiredAttributes();
				requestPromise.then(function(response){
					dynamicRequired = response;
				});
			}
			
			if(!_.isEmpty(dynamicRequired)){
				_.each(AttributeGroups, function(attrGroups){
					_.each(attrGroups.productAtributes, function(attribute){
						_.each(dynamicRequired, function(item){
							if(item == attribute.fieldName){
								attribute.isRequired = true;
							}
						});
					});
				});
			}			
		}
		
		/*
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		
		function updateTotalSeatQuantity(allComponentsPAVS, totalSeat){
			_.each(allComponentsPAVS, function(itemPav){
				if(_.has(itemPav, 'Total_Seats__c')){
					itemPav['Total_Seats__c'] = totalSeat;
				}
			});
			
			return allComponentsPAVS;
		}
		*/

		// Applicable for CGE products.
		function getCGELocationsCheck(attributeGrous, allSRs){
			var locationA = [];

			if(allSRs != null || allSRs != 'undefined'){
				locationA.push({active:true,defaultValue:false,label:'--None--', value:null});
				_.each(allSRs, function(item){
					var label = item.Service_Address_Line_1__c + ' / ' + item.City__c;
                    //added by Shivam Aditya - DE 14616 (Added flag isTypeElinePop) - 10/19/2016
                    var isTypeElinePop = false;
					if(item.isCQL){
						if(item.CQL_Loc_Type__c.toLowerCase() == 'E-Line POP'.toLowerCase()){
                            isTypeElinePop = true;
							if(!_.isUndefined(item.CLLI_Information__c) && !_.isNull(item.CLLI_Information__c))
								label = label + ' ('+item.CLLI_Information__c+')';
						}else{
							label = label + ' ('+item.locationType+')';
						}
					}
					locationA.push({active:true,defaultValue:false,label:label, value:item.Id, isTypeElinePop:isTypeElinePop});
				});
			}
			_.each(attributeGrous, function(attrGroups){
				_.each(attrGroups.productAtributes, function(items){
                    if(items.fieldName == 'Location_A__c' 
                    || items.fieldName == 'Location_Z__c'
                    || items.fieldName == 'ProductAttributeValueId1__r.Location_A2__c'
                    || items.fieldName == 'ProductAttributeValueId1__r.Location_A3__c'
                    || items.fieldName == 'ProductAttributeValueId1__r.Location_A4__c'
                    || items.fieldName == 'ProductAttributeValueId1__r.Location_A5__c'){
						items.picklistValues = locationA;
					}
				});
			});


			return attributeGrous;
		}

		function setCGEProductAttributeValues(fieldName, productAttributeValues, deferred){
			var locA = getAttributeFromBundle(productAttributeValues, fieldName);

			if(!deferred){
				deferred = $q.defer();
			}

			if(_.has(productAttributeValues, 'Location_A__c') && !_.isUndefined(locA)){
				productAttributeValues['Location_A__c'] = locA;
			}

			var lineNumber = LineItemService.currentSelectedLineNumber ? LineItemService.currentSelectedLineNumber : null;

			if(!lineNumber){
				deferred.resolve();
				return deferred.promise;
			}

			var lineItemToSave = LineItemService.getLineItemsToSave();
			LineItemService.getLineItem(lineNumber).then(function(currentSelectedLineItemBandle) {
				_.each(currentSelectedLineItemBandle, function(object, key){
					var isLastKey = key == currentSelectedLineItemBandle.length-1;

					if(object.lineItemId){
                        var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
                        var PAV = lineItemsToOptionPAVMap[object.lineItemId];

                        PAV["Location_A__c"] = locA;
                        lineItemToSave[object.lineItemId] = PAV;
					}
                    if(isLastKey){
                        LineItemService.setLineItemsToSave(lineItemToSave);
                        deferred.resolve();
                    }

				});

			});

			deferred.notify();
			return deferred.promise;
		}



		//Bandwidth
		function getSelectedOption(allGroups, groupName){
			var selectedOption = "";
			_.each(allGroups, function(topLevelGroups){
				_.each(topLevelGroups, function(group){
					if(group.name == groupName){
						_.each(group.productOptionComponents, function(productOptionComponent){
							if(group.selectedproduct == productOptionComponent.productId || productOptionComponent.isselected == true){
								selectedOption = productOptionComponent.productId;
								return false;
							}
						});
					}
				});
			});

			return selectedOption;
		}

		function getBandwidthAttribute(componentId, productName){
			var optionPAVs = [];

			var allLineItems = LineItemService.getAllLineItems();
			var pcomponentLineItems = _.where(allLineItems, {componentId: componentId});

			if(pcomponentLineItems && pcomponentLineItems.length > 0){
				var allcomponentIdToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
				_.each(pcomponentLineItems, function(pcomponentLineItem){
					var optionPAV = allcomponentIdToOptionPAVMap[pcomponentLineItem.lineItemId];

					optionPAVs.push(optionPAV);
				});
			} else{
				var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
				var optionPAV = allcomponentIdToOptionPAVMap[componentId];

				optionPAVs.push(optionPAV);
			}

			var bandwidth = null;
			if(optionPAVs.length == 1 && optionPAVs[0]){
				bandwidth = (productName == "Real Time COS" && optionPAVs[0]['Real_Time_COS__c']) ? optionPAVs[0]['Real_Time_COS__c'] : bandwidth;
				bandwidth = (productName == "Business Class CoS" && optionPAVs[0]['Business_Class_COS__c']) ? optionPAVs[0]['Business_Class_COS__c'] : bandwidth;
				bandwidth = (productName == "Guaranteed CoS" && optionPAVs[0]['Guaranteed_COS__c']) ? optionPAVs[0]['Guaranteed_COS__c'] : bandwidth;
			} else{
				//TODO add logic for multi optionPAVs
			}

			return bandwidth;
		}

		function calculateBandwidths(bandwidths, isMinBandwidth){
			var totalBandwidth = 0;
			_.each(bandwidths, function(bandwidth, key){

				if(!isMinBandwidth){
					totalBandwidth += convertToMbs(bandwidth);
				} else if(isMinBandwidth && key.indexOf("SINGLE ") == 0){
					totalBandwidth += convertToMbs(bandwidth);
				} else if(isMinBandwidth && (key.indexOf("Real Time COS") != -1 || key.indexOf("Guaranteed CoS") != -1)){
					totalBandwidth += convertToMbs(bandwidth);
				}

			});

			if(totalBandwidth == 0){
				return null;
			}else if(totalBandwidth >= 1000){
				return totalBandwidth/1000 + " Gbps";
			} else{
				return totalBandwidth + " Mbps";
			}
		}

		function convertToMbs(value){
			if(!value || value == -1)
				return value;

			var numberAndUnit = value.split(' ');
			var newValue = numberAndUnit[1] == "Gbps" ? parseFloat(numberAndUnit[0]) * 1000 : parseFloat(numberAndUnit[0]);
			return newValue;
		}

		function getCalculatedUNIBandwidth(isMinBandwidth){
			var allGroups = OptionGroupDataService.getallOptionGroups();

			var selectedOption = getSelectedOption(allGroups, "Class of Service");
			var selectedEvcCoSOption = getSelectedOption(allGroups, "EVC(s)");
			var ifEvcSingleCoS = {};
			var bandwidths = {};

			_.each(allGroups, function(topLevelGroups){
				_.each(topLevelGroups, function(group){
					if(group.parentId == selectedOption || group.parentId == selectedEvcCoSOption){
						//EVC CoS Options - L3PP
						ifEvcSingleCoS = checkEVCSingleCoS(group.productOptionComponents);
						_.each(group.productOptionComponents, function(productOptionComponent){
							if(group.selectedproduct || ifEvcSingleCoS){
								// Single COS
								if(group.selectedproduct == productOptionComponent.productId || ifEvcSingleCoS){
									var bandwidth = getBandwidthAttribute(productOptionComponent.componentId, productOptionComponent.productName);
									if(bandwidth && !LineItemService.isL3PP()){
										bandwidths["SINGLE " + productOptionComponent.productName] = bandwidth;
									}else if(bandwidth && LineItemService.isL3PP() && productOptionComponent.isselected == true){
										bandwidths["SINGLE " + productOptionComponent.productName] = bandwidth;
									}
								}
							} else{
								// Multiple COS
								var bandwidth = getBandwidthAttribute(productOptionComponent.componentId, productOptionComponent.productName);
								if(bandwidth && !LineItemService.isL3PP()){
									bandwidths["MULTIPLE " + productOptionComponent.productName] = bandwidth;
								}else if(bandwidth && LineItemService.isL3PP() && productOptionComponent.isselected == true){
									bandwidths["MULTIPLE " + productOptionComponent.productName] = bandwidth;
								}
							}
						});
					}
				});
			});

			return calculateBandwidths(bandwidths, isMinBandwidth);
		};
		
		function checkEVCSingleCoS(productOptionComponents){
			var isL3PPBundle = LineItemService.isL3PP();
			var countCoS = 0;
			var isEvcSingleCoS = true;
			
			if(!isL3PPBundle){
				isEvcSingleCoS = false;
				return isEvcSingleCoS;
			}
			_.each(productOptionComponents, function(productOptionComponent){							
				if(productOptionComponent.isselected == true){
					if(productOptionComponent.productName == "Real Time COS" || productOptionComponent.productName == "Guaranteed CoS" || productOptionComponent.productName == "Business Class CoS"){
						countCoS = countCoS + 1;
					}
				}
				if(countCoS > 1){
					isEvcSingleCoS = false;
				}
			});
			return isEvcSingleCoS;
		};

		/*function setBandWidthToUNIAttributes(attributeGroups, attributeValues){
			var maxBandwidth = getCalculatedUNIBandwidth(false);
			var minBandwidth;

			if(_.has(attributeValues, 'EVC_Bandwidth__c')){
				minBandwidth = getCalculatedUNIBandwidth(false);
			} else{
				minBandwidth = getCalculatedUNIBandwidth(true);
			}

			var uniNewPicklist = [];

			var selectedBandwidth = -1;
			_.each(attributeGroups, function(attrGroups){
				_.each(attrGroups.productAtributes, function(items){
					if(items.fieldName == "UNI_Billable_Bandwidth__c" || items.fieldName == "EVC_Bandwidth__c"){
						if(!minBandwidth){
							items.picklistValues = [];
							return;
						}

						minBandwidth = findBandwidthInPicklist(minBandwidth, items.picklistValues);
						maxBandwidth = findBandwidthInPicklist(maxBandwidth, items.picklistValues);

						var minBandwidthInMb = convertToMbs(minBandwidth);
						var maxBandwidthInMb = convertToMbs(maxBandwidth);

						var newPickListValues = [];

						_.each(items.picklistValues, function(picklistValue){
							var bandWidth = convertToMbs(picklistValue.value);

							if(!bandWidth)
								return true;

							if(bandWidth == minBandwidthInMb){
								selectedBandwidth = picklistValue.value;
								newPickListValues.push(picklistValue);
							}else if(bandWidth > minBandwidthInMb && selectedBandwidth < 0){
								selectedBandwidth = picklistValue.value;
								newPickListValues.push(picklistValue);
							}else if(bandWidth > minBandwidthInMb && (bandWidth <= maxBandwidthInMb)){
								newPickListValues.push(picklistValue);
							}
						});

						if(selectedBandwidth < 0 && items.picklistValues && items.picklistValues.length > 0){
							var lastValue = items.picklistValues[items.picklistValues.length-1];
							selectedBandwidth = lastValue.value;
							newPickListValues.push(lastValue);
						}

						items.picklistValues = newPickListValues;

						if(items.fieldName == "UNI_Billable_Bandwidth__c"){
							uniNewPicklist = newPickListValues;
						}
					}
				});
			});

			if(_.has(attributeValues, 'EVC_Bandwidth__c') && selectedBandwidth != -1){
				attributeValues['EVC_Bandwidth__c'] = selectedBandwidth;
			}

			var findInNewPickList = uniNewPicklist ? _.findWhere(uniNewPicklist, {'value': attributeValues['UNI_Billable_Bandwidth__c']}) : false;

			if(_.has(attributeValues, 'UNI_Billable_Bandwidth__c') && selectedBandwidth != -1 && _.isEmpty(findInNewPickList) && uniNewPicklist && uniNewPicklist.length > 0){
				var selectedOption = LineItemService.currentOption;
				var newValue = uniNewPicklist[uniNewPicklist.length-1].value;
				attributeValues['UNI_Billable_Bandwidth__c'] = newValue;

				var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
				var allLineItems = LineItemService.getAllLineItems();

				if(allLineItems && !_.isEmpty(selectedOption.lineItem)) {
					_.each(allLineItems, function (lineItem) {
						if (lineItem.lineItemId && lineItem.parentBundleNumber == selectedOption.lineItem.primaryLineNumber) {
							var PAV = lineItemsToOptionPAVMap[lineItem.lineItemId];

							if (_.has(PAV, "UNI_Billable_Bandwidth__c")) {
								PAV["UNI_Billable_Bandwidth__c"] = newValue;
							}
						}
					});
				} else{
					var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();

					var allOptionGroups = OptionGroupDataService.getallOptionGroups();
					_.each(allOptionGroups, function(optiongroups) {
						_.each(optiongroups, function (optiongroup) {
							_.each(optiongroup.productOptionComponents, function(productcomponent){
								if(productcomponent.productName == 'UNI Port'){
									var PAV = allcomponentIdToOptionPAVMap[productcomponent.componentId];

									if (!_.isEmpty(PAV)) {
										PAV["UNI_Billable_Bandwidth__c"] = newValue;
									} else{
										allcomponentIdToOptionPAVMap[productcomponent.componentId] = {
											UNI_Billable_Bandwidth__c: newValue
										};

									}
								}
							});
						});
					});

					ProductAttributeValueDataService.setProductAttributeValues(allcomponentIdToOptionPAVMap);
				}
			}
		}*/

		function setBandWidthToUNIAttributes(attributeGroups, attributeValues){
			var selectedBandwidth = getCalculatedUNIBandwidth(false);

			if(selectedBandwidth){
				attributeValues['EVC_Bandwidth__c'] = selectedBandwidth;
			}
			//Adding to populate Other service Term to all options for CE
			var allLineItems = LineItemService.getAllLineItems();
			var bundleAttributes = ProductAttributeValueDataService.getbundleproductattributevalues();
			var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			if(_.has(bundleAttributes, 'Service_Term__c') && bundleAttributes['Service_Term__c'] == 'Other'){
				_.each(allLineItems, function(line){
					var lineItemPAV = lineItemsToOptionPAVMap[line.lineItemId];
					if(_.has(lineItemPAV, 'Service_Term__c')){
						lineItemPAV['Service_Term__cOther'] = bundleAttributes['Service_Term__cOther'];
					}
				});
			}
			//if(_.has(attributeValues, 'UNI_Billable_Bandwidth__c')){								
				var lineItems = LineItemService.getUNILineItems();
				if(_.isEmpty(lineItems))
					return;           
				
				//var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
				var lineItemToSave = LineItemService.getLineItemsToSave();;
				_.each(lineItems, function(lineItem){
					var parentLineItem = _.findWhere(lineItems, {primaryLineNumber: lineItem.parentBundleNumber});

					if(parentLineItem){
						var PAV = lineItemsToOptionPAVMap[lineItem.lineItemId];
						var parentPAV = lineItemsToOptionPAVMap[parentLineItem.lineItemId];

						if(PAV && parentPAV && (lineItem.optionName == 'UNI Port' || lineItem.optionName == 'Build Out')) {
							PAV['UNI_Billable_Bandwidth__c'] = parentPAV['UNI_Billable_Bandwidth__c'];
							PAV['Service_Term__c'] = parentPAV['Service_Term__c'];
							lineItemToSave[lineItem.lineItemId] = PAV;
						}
					}
				});

				if(!_.isEmpty(lineItemToSave)){
					LineItemService.setLineItemsToSave(lineItemToSave);
				}
			//}
		}

		function setPortBandwidthToUNI(attributeGroups, optionPAV) {
			var lineItemIdToAttributes = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			var lineItems = LineItemService.getAllLineItems();
			var lineItemForPort = _.findWhere(lineItems, {optionName: "IQ Networking Port - Private"});
			var lineItemIdForPort;
			var portBandWidth;
			if(lineItemForPort)
			  lineItemIdForPort = _.findWhere(lineItems, {optionName: "IQ Networking Port - Private"}).lineItemId;
			var port = _.findWhere(lineItemIdToAttributes, {Apttus_Config2__LineItemId__c: lineItemIdForPort});
			if(port)
			  portBandWidth = _.findWhere(lineItemIdToAttributes, {Apttus_Config2__LineItemId__c: lineItemIdForPort}).Bandwidth_ELA__c;

			if(lineItemIdForPort && portBandWidth){
				_.each(attributeGroups, function(eachGroup){
					if(eachGroup.groupName == "UNI Attributes"){
					var uniBandwidth = _.findWhere(eachGroup.productAtributes, {fieldName : 'UNI_Billable_Bandwidth__c'});
						if(uniBandwidth){
							uniBandwidth.isReadOnly = true;
							uniBandwidth.picklistValues = PAVObjConfigService.prepareOptionsList(new Array(portBandWidth));
							optionPAV['UNI_Billable_Bandwidth__c']  = portBandWidth;
						}
					}
				});
			}
		}

		function findBandwidthInPicklist(currentBandwidth, picklistValue){
			var currentBandwidthInMb = convertToMbs(currentBandwidth);
			var selectedBandwidth = -1;

			_.each(picklistValue, function(picklistValue){
				var bandWidth = convertToMbs(picklistValue.value);

				if(!bandWidth)
					return true;

				if(bandWidth == currentBandwidthInMb){
					selectedBandwidth = picklistValue.value;
				}else if(bandWidth > currentBandwidthInMb && selectedBandwidth < 0){
					selectedBandwidth = picklistValue.value;
				}
			});

			if(selectedBandwidth < 0 && picklistValue && picklistValue.length > 0){
				var lastValue = picklistValue[picklistValue.length-1];
				selectedBandwidth = lastValue.value;
			}

			return selectedBandwidth;
		}

		function setAttributeCustomActions(fieldName, productAttributeValues){
			var deferred = $q.defer();

			LineItemService.setLineItemsToSave({});

			if(fieldName == "Location_A__c"){
				LineItemService.locationWasChanged = true;
				return setCGEProductAttributeValues(fieldName, productAttributeValues, deferred);
			} 
			/*else if(fieldName == 'Real_Time_COS__c'
				|| fieldName == 'Business_Class_COS__c'
				|| fieldName == 'Guaranteed_COS__c'
				|| fieldName == 'UNI_Billable_Bandwidth__c'){
				return setBillableBandwidthToUNIs(fieldName, productAttributeValues, deferred);
			}*/
			else if(fieldName == 'REUSE_UNI__c'){				
				resetUNIErrorIndicator();
				return getESLUNIs(productAttributeValues, deferred);
			} else{				
				deferred.resolve();
				return deferred.promise;
			}
		}
		
		//Mithilesh : CGE : US 39917 Implementation
		function getESLUNIs(productAttributeValues, deferred){
			if(!deferred){
				deferred = $q.defer();
			}
			var proposalID = BaseConfigService.proposal.Id;
			var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
			var CCID = bundlePAV['CONTROL_CENTRAL_ID__c']; 
			var selectedUNILocation = productAttributeValues['Location_A__c'];
			
			if(ifPrerequisiteDataPopulated(productAttributeValues)){
					BaseService.startprogress(true);
					var requestPromise = RemoteService.getESLUNIs(CCID, selectedUNILocation, proposalID);
					requestPromise.then(function(response){						
						if(response.ErrorMessages.length > 0){
							_.each(response.ErrorMessages, function(errormessage){
								MessageService.addMessage('webserviceserror', 'Error in response from ESL - '+errormessage);			
							})
							productAttributeValues['REUSE_UNI__c'] = "NO";
							BaseService.completeprogress();
							return;
						}else if(response.ESLExistingUNIs.length > 0){
							ReusableUniSelectorDataService.setUNIBillableBandWidth(productAttributeValues["UNI_Billable_Bandwidth__c"]);
							ReusableUniSelectorDataService.setProductAttributeValues(productAttributeValues);
							
							ReusableUniSelectorDataService.setResourceId(productAttributeValues["Resource_ID__c"]);							
							ReusableUniSelectorDataService.setReusableUNIs(response.ESLExistingUNIs);
						
							var allLocations = ProductAttributeValueDataService.allLocations;
							var filteredUNILocation = _.findWhere(allLocations, {'Id': selectedUNILocation});
							ReusableUniSelectorDataService.setSelectedUNILocation(filteredUNILocation);
							
							showPopup();
						}else if(response.ESLExistingUNIs.length == 0){
							MessageService.addMessage('webserviceserror', 'There are No Reusable UNIs available in Inventory');
						}
						BaseService.completeprogress();						
					}, function(reason) {
						MessageService.addMessage('webserviceserror', 'Error in response from ESL - '+reason);
					});
			}
			deferred.resolve();
			return deferred.promise;
		}
		
		function ifPrerequisiteDataPopulated(PAV){
			//Validate Prerequisite attributes : Service Type, CCID, Location and Reuse UNI 
			var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
			var CGEServiceType = bundlePAV['Service_Type_CGE__c'];
			var L3PPServiceType = bundlePAV['Service_Type_L3__c'];
			var CCID = bundlePAV['CONTROL_CENTRAL_ID__c']; 
			var selectedUNILocation = PAV['Location_A__c'];
			var reuseUNI = PAV['REUSE_UNI__c'];
			var BUNDLE_SERVICE_TYPE = (CGEServiceType != undefined) ?  CGEServiceType : L3PPServiceType;
			if(reuseUNI == 'YES (In Inventory)'){
				if(CCID && !_.isEmpty(selectedUNILocation) && !_.isEmpty(BUNDLE_SERVICE_TYPE)){
					if(BUNDLE_SERVICE_TYPE == 'EVPLAN' || BUNDLE_SERVICE_TYPE == 'EVPLINE'){
						return true;
					}else{
						showDialog();
						PAV['REUSE_UNI__c'] = "NO";
						return false;
					}
				}else{
					showDialog();
					PAV['REUSE_UNI__c'] = "NO";
					return false;
				}				
			}else {
				PAVObjConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
					/*PAV['UNI_Billable_Bandwidth__c'] = null;
					PAV['Frame_Size__c'] = fieldDescribeMap.Frame_Size__c ? fieldDescribeMap.Frame_Size__c.fieldDescribe.defaultValue : "";
					PAV['Location_A__c'] = null;
					PAV['Resource_ID__c'] = null;*/
					PAV['Resource_ID__c'] = null;
				});
			}
			return false;
		} 
		
		function showDialog(){
			var dlg = $dialogs.notify('You are missing one or more selection from Below!','Select Service Type(EVPLAN/EVPLINE), CCID and Service Location in order to set the value to YES (In Inventory)');
		}
		
		function showPopup() {
			var reusableUNIViewURL = SystemConstants.baseUrl+'/Templates/ReusableUniSelectorView.html';
			var dlg = $dialogs.create(reusableUNIViewURL,'ReusableUniSelectorController','',{key: false,back: 'false', size: 'lg'});
		}
		//Commented by: Mithilesh Maurya, we do not need this functionality for time being: In future we may need it 
		/*function setBillableBandwidthToUNIs(fieldName, productAttributeValues, deferred){
			if(!deferred){
				deferred = $q.defer();
			}

			var totalBandwidth = getCalculatedUNIBandwidth(false);


			if(fieldName == 'UNI_Billable_Bandwidth__c' && _.has(productAttributeValues, 'UNI_Billable_Bandwidth__c')) {
				totalBandwidth = productAttributeValues['UNI_Billable_Bandwidth__c'];
				var lineItemLineNumber = LineItemService.currentSelectedLineNumber ? LineItemService.currentSelectedLineNumber : BaseConfigService.lineItem.primaryLineNumber;
			} else {
				var lineItemLineNumber = BaseConfigService.lineItem.primaryLineNumber;
			}

			var totalBandwidthInMb = convertToMbs(totalBandwidth);

			var picklists = PAVObjConfigService.fieldNametoDFRMap;
			if(_.has(picklists, "UNI_Billable_Bandwidth__c")){
				var selectedBandwidth = -1;
				var bandWidthPickList = picklists.UNI_Billable_Bandwidth__c.fieldDescribe.picklistValues;
				_.each(bandWidthPickList, function(picklistValue){
					var bandWidth = convertToMbs(picklistValue.value);

					if(!bandWidth)
						return true;

					if(bandWidth == totalBandwidthInMb){
						selectedBandwidth = picklistValue.value;
						return false;
					}else if(bandWidth > totalBandwidthInMb){
						if(selectedBandwidth < 0)
							selectedBandwidth = picklistValue.value;

						return false;
					}
				});

				if(selectedBandwidth < 0){
					var lastValue = bandWidthPickList[bandWidthPickList.length-1];
					selectedBandwidth = lastValue.value;
				}

				if(selectedBandwidth)
					totalBandwidth = selectedBandwidth;
			}

			var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			var allLineItems = LineItemService.getAllLineItems();

			if(allLineItems) {
				_.each(allLineItems, function (lineItem) {
					if (lineItem.lineItemId) {
						var PAV = lineItemsToOptionPAVMap[lineItem.lineItemId];

						if (_.has(PAV, "UNI_Billable_Bandwidth__c")) {
							PAV["UNI_Billable_Bandwidth__c"] = totalBandwidth;
						}
					}
				});
			}

			deferred.resolve();
			return deferred.promise;
		}*/

		function calculateGeography(optionAttributes, allLocations){
			var locations = [];
			var maxDistanceBetweenLocations = 0;

			var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			LineItemService.getLineItem(1).then(function(result) {
				var currentSelectedLineItemBandle = LineItemService.getCurrentSelectedLineItemBundle();
				_.each(currentSelectedLineItemBandle, function(object){
					var PAV = lineItemsToOptionPAVMap[object.lineItemId];

					if(_.has(PAV, 'Location_A__c') && PAV.Location_A__c){
						var filteredOption = _.findWhere(allLocations, {'Id': PAV.Location_A__c});
						if(filteredOption)
							locations.push(filteredOption);
					}

				});

				_.each(locations, function (el, i) {
					_.each(locations, function (e, j) {
						if(el.Id != e.Id) {
							var distance = getDistanceFromLatLonInKm(el.Geo_Coordinates_Latitude__c, el.Geo_Coordinates_Longitude__c, e.Geo_Coordinates_Latitude__c,  e.Geo_Coordinates_Longitude__c);
							if (distance > maxDistanceBetweenLocations) maxDistanceBetweenLocations = distance;
						}
					});
				});


				if(_.has(optionAttributes, 'Geography__c')){

					optionAttributes['Geography__c'] = getGeographyNameByNumber(maxDistanceBetweenLocations);
				}

			});




		}

		function getGeographyNameByNumber (distance) {
			if(distance>=0 && distance<=149){
				return "Metro";
			} else if (distance>=150 && distance<=744) {
				return "Regional";
			} else if (distance>=745 && distance<=4349) {
				return "National";
			} else if (distance>=4350) {
				return "Global";
			} else {
				return ""
			}
		};

		function OWSSetLocationAccessMarket(selectedoptionproduct, pav,attributeGroups){
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
			var  selectedProductName = selectedoptionproduct.productName;
			service.owsMetroQCCOnNet = false;
			if(bundleProductName == 'E-Line' && selectedoptionproduct.optionGroupName == 'E-Line Solution' && pav['Location_A__c']
				&& pav['Location_Z__c']){
				var allLocations = ProductAttributeValueDataService.allLocations;
				var selectedLocationA = _.findWhere(allLocations, {Id : pav['Location_A__c']});
				var selectedLocationZ = _.findWhere(allLocations, {Id : pav['Location_Z__c']});

				var accessMarketA = LocationDataService.getLocationAvailabilityMetroAccess(pav['Location_A__c']);
				var accessMarketZ = LocationDataService.getLocationAvailabilityMetroAccess(pav['Location_Z__c']);

				if(accessMarketA && accessMarketZ){
					if(accessMarketA == accessMarketZ){
						_.each(attributeGroups, function(eachgroup){
							var marketPL = _.findWhere(eachgroup.productAtributes, {fieldName : 'E_Line_Solution__c'});
							marketPL.isReadOnly = true;
							marketPL.picklistValues = PAVObjConfigService.prepareOptionsList(new Array('Metro'));
							pav['E_Line_Solution__c'] = 'Metro';
						});
					}
					else{
						_.each(attributeGroups, function(eachgroup){
							var marketPL = _.findWhere(eachgroup.productAtributes, {fieldName : 'E_Line_Solution__c'});
							marketPL.isReadOnly = true;
							marketPL.picklistValues = PAVObjConfigService.prepareOptionsList(new Array('Long Haul'));
							pav['E_Line_Solution__c'] = 'Long Haul';
						});
					}
				}

			}
			if(bundleProductName == 'Optical Wave Service'){
				var allLocations = ProductAttributeValueDataService.allLocations;

				if(selectedProductName == 'Wavelength Local Access A' && pav['Location_A__c']){
					var selectedLocation = _.findWhere(allLocations, {Id : pav['Location_A__c']});
					var accessMarket = LocationDataService.getLocationAvailabilityMetroAccess(pav['Location_A__c']);
					var cqlLocationType = LocationDataService.getLocationAvailabilityCQLLocationType(pav['Location_A__c']);
					service.OWSAccessMarketA = {
						location : selectedLocation,
						market : accessMarket,
						locationType : cqlLocationType
					}
				}

				if(selectedProductName == 'Wavelength Local Access Z' && pav['Location_Z__c']){
					var selectedLocation = _.findWhere(allLocations, {Id : pav['Location_Z__c']});
					var accessMarket = LocationDataService.getLocationAvailabilityMetroAccess(pav['Location_Z__c']);
					var cqlLocationType = LocationDataService.getLocationAvailabilityCQLLocationType(pav['Location_Z__c']);
					service.OWSAccessMarketZ = {
						location : selectedLocation,
						market : accessMarket,
						locationType : cqlLocationType
					}

				}

				if(service.OWSAccessMarketA &&
					service.OWSAccessMarketZ &&
					service.OWSAccessMarketA.market &&
					service.OWSAccessMarketZ.market) {
					var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
					if(service.OWSAccessMarketA.market == service.OWSAccessMarketZ.market) {
						if(service.OWSAccessMarketZ.locationType !=  "QCC On-Net" && service.OWSAccessMarketA.locationType !=  "QCC On-Net")
							service.owsMetroQCCOnNet = true;
						bundlePAV['OWS_Solution__c'] = 'Metro';
					} else if (service.OWSAccessMarketA.market != service.OWSAccessMarketZ.market){
						bundlePAV['OWS_Solution__c'] = 'Long Haul';
					}
				}


			}

		}

		function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
			var R = 6371; // Radius of the earth in km
			var dLat = deg2rad(lat2-lat1);  // deg2rad below
			var dLon = deg2rad(lon2-lon1);
			var a =
					Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
					Math.sin(dLon/2) * Math.sin(dLon/2)
				;
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			var d = R * c; // Distance in km
			return d/1.6 // covnert to miles;
		}

		function deg2rad(deg) {
			return deg * (Math.PI/180)
		}
		
		function eLinePointToPointCheck(selectedProductName, pav){
			if(selectedProductName == 'E-Line - Point to Point' || selectedProductName == 'E-Line - Connect to Hub' ||
				selectedProductName == 'E-Line - Hub' || selectedProductName == 'E-Line - Hub to Hub'){
				service.eLinePointToPointLocA = pav['Location_A__c'];
				service.eLinePointToPointLocZ = pav['Location_Z__c'];
			}
		}
		
		function unifiedStorageValidation(attributeGroups, pav, bundleProdName){
			addUnifiedStorateAttributes();
			
			if(bundleProdName == 'Unified Storage 1.0'){				
				_.each(attributeGroups, function(attributeGroup){
					if(attributeGroup.groupName.toLowerCase() == 'Unified Storage 1.0'.toLowerCase()){
						//case 1: Velocity (GBs) + Velocity Replication (GBs)
						if(_.has(pav, unifiedSAtt[1]) && _.has(pav, unifiedSAtt[2])){
							pav[unifiedSAtt[3]] = parseInt(pav[unifiedSAtt[1]]) + parseInt(pav[unifiedSAtt[2]]);
						}
						//case 2: Vital (GBs) + Vital Replication (GBs)
						if(_.has(pav, unifiedSAtt[4]) && _.has(pav, unifiedSAtt[5])){
							pav[unifiedSAtt[6]] = parseInt(pav[unifiedSAtt[4]]) + parseInt(pav[unifiedSAtt[5]]);
						}
						//case 3: Value (GBs) + Value Replication (GBs)
						if(_.has(pav, unifiedSAtt[7]) && _.has(pav, unifiedSAtt[8])){
							pav[unifiedSAtt[9]] = parseInt(pav[unifiedSAtt[7]]) + parseInt(pav[unifiedSAtt[8]]);
						}
					}
				});
				
			}
		}
		
		
		function addUnifiedStorateAttributes(){
			unifiedSAtt['1'] = 'ProductAttributeValueId1__r.Velocity__c';
			unifiedSAtt['2'] = 'Velocity_Replication__c';
			unifiedSAtt['3'] = 'Velocity_Total_GBs__c';
			unifiedSAtt['4'] = 'ProductAttributeValueId1__r.Vital__c';
			unifiedSAtt['5'] = 'Vital_Replication__c';
			unifiedSAtt['6'] = 'ProductAttributeValueId1__r.Vital_Total_GBs__c';
			unifiedSAtt['7'] = 'ProductAttributeValueId1__r.Value__c';
			unifiedSAtt['8'] = 'Value_Replication__c';
			unifiedSAtt['9'] = 'Value_Total_GBs__c';
		}
		
		function vchsValidation(attributeGroups, pav, bundleLineItemStatus, bundleProdName){
			var vchsDirectConnect = [];
			
			if(bundleProdName.toLowerCase() == 'vCHS 1.0'.toLowerCase() && bundleLineItemStatus.toLowerCase() == 'Amended'.toLowerCase()){
				vchsDirectConnect.push('1 Gbps Port');
				vchsDirectConnect.push('10 Gbps Port');
				
				_.each(attributeGroups, function(attrGroups){
					_.each(attrGroups.productAtributes, function(attribute){
						if(attribute.fieldName.toLowerCase() == 'vCHS_Direct_Connect__c'.toLowerCase()){
							attribute.picklistValues = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(vchsDirectConnect));
						}
					});
				});
				
			}
		}

		// [6/10/2016 - Mithilesh: introduced to support US66453]
		// - show the CCID attribute only for EVPLAN or EVPLINE service types, hide for EPLINE/EPLAN
		// refactor it later to remove hardcoding
		function setCCID(attributeGroups, bundleProductName, bundlePav){
			var CGE_PRODUCT_NAME = 'CenturyLink Ethernet';
			var L3PP_PRODUCT_NAME = 'L3 IQ Networking Private Port';
			
			var BUNDLE_PRODUCT_NAME = (bundleProductName == CGE_PRODUCT_NAME) ?  CGE_PRODUCT_NAME : L3PP_PRODUCT_NAME;

			if (bundleProductName.toLowerCase() === BUNDLE_PRODUCT_NAME.toLowerCase()) {

				if (!_.isEmpty(attributeGroups)) {
					var CGE_ATTRIBUTES_ATTRIBUTE_GROUP_NAME = 'CenturyLink Ethernet';
					var L3PP_ATTRIBUTES_ATTRIBUTE_GROUP_NAME = 'Layer 3 IQ Networking Private Port';
					var BUNDLE_ATTRIBUTES_ATTRIBUTE_GROUP_NAME = (bundleProductName == CGE_PRODUCT_NAME) ?  CGE_ATTRIBUTES_ATTRIBUTE_GROUP_NAME : L3PP_ATTRIBUTES_ATTRIBUTE_GROUP_NAME;
					
					_.each(attributeGroups, function(attributeGroup) {
						if (attributeGroup.groupName.toLowerCase() === BUNDLE_ATTRIBUTES_ATTRIBUTE_GROUP_NAME.toLowerCase()) {

							var CCID_API_NAME = 'CONTROL_CENTRAL_ID__c';
							_.each(attributeGroup.productAtributes, function(productAttribute) {
								if (productAttribute.fieldName.toLowerCase() == CCID_API_NAME.toLowerCase()) {

									var bundleServiceType = bundlePav['Service_Type_CGE__c'];
									if (bundleProductName.toLowerCase() === L3PP_PRODUCT_NAME.toLowerCase())
										bundleServiceType = bundlePav['Service_Type_L3__c'];
					
									if (bundleServiceType === 'EPLAN' || bundleServiceType === 'EPLINE') {
										productAttribute.isReadOnly = true;
										productAttribute.isHidden = true;										
									} else {
										productAttribute.isReadOnly = false;
										productAttribute.isHidden = false;
									}
								}
							});
						}
					});
				}
			}
		}

		// [5/18/2016 - Jeff Rink (JPR): introduced to support US57338]
		// configure UNI product attributes just prior to rendering
		// - show the UNI attribute "Reuse UNI" when parent bundle Service Type is EVPLAN or EVPLINE
		// - hide the UNI attribute "Reuse UNI" when parent bundle Service Type is EPLAN or EPLINE
		// TODO: to improve resiliency, consider using product IDs (like bundleProdId) here instead of product names
		function setReuseUni(attributeGroups, currentProductName, pav){
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
			var CGE_PRODUCT_NAME = 'CenturyLink Ethernet';
			var L3PP_PRODUCT_NAME = 'L3 IQ Networking Private Port';
			var UNI_PRODUCT_NAME = 'UNI';
			var BUNDLE_PRODUCT_NAME = (bundleProductName == CGE_PRODUCT_NAME) ?  CGE_PRODUCT_NAME : L3PP_PRODUCT_NAME;

			// if the bundle is CGE and the Option is a UNI...
			if (bundleProductName.toLowerCase() === BUNDLE_PRODUCT_NAME.toLowerCase() &&
				currentProductName.toLowerCase() === UNI_PRODUCT_NAME.toLowerCase()) {

				// if the product has attribute groups (it should)...
				if (!_.isEmpty(attributeGroups)) {
					
					// loop through each attribute group...
					var UNI_ATTRIBUTES_ATTRIBUTE_GROUP_NAME = 'UNI Attributes';
					_.each(attributeGroups, function(attributeGroup) {

						// if the attribute group is "UNI Attributes" (there should be one and only one)...
						if (attributeGroup.groupName.toLowerCase() === UNI_ATTRIBUTES_ATTRIBUTE_GROUP_NAME.toLowerCase()) {

							// loop through its attributes...
							var REUSE_UNI_API_NAME = 'REUSE_UNI__c';
							_.each(attributeGroup.productAtributes, function(productAttribute) {

								// if the attribute is "Reuse UNI" (there should be one and only one)...
								if (productAttribute.fieldName.toLowerCase() == REUSE_UNI_API_NAME.toLowerCase()) {
									// mark its attribute visibility flag(s) appropriately

									// get the parent bundle's PAVs in order to get the Service Type
									var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
									var bundleServiceType = bundlePAV['Service_Type_CGE__c'];
									if (bundleProductName.toLowerCase() === L3PP_PRODUCT_NAME.toLowerCase())
										bundleServiceType = bundlePAV['Service_Type_L3__c'];
																		
									// enable "Reuse UNI" attribute for "EV*" Service Types; disable for all others
									if (bundleServiceType === 'EVPLAN' || bundleServiceType === 'EVPLINE') {
										productAttribute.isReadOnly = false;
										productAttribute.isHidden = false;
									} else if(!isInvalidUNI(pav)){
										// TODO: mark the UNI as invalid instead of hiding/stomping (see US40182)
										productAttribute.isReadOnly = true;
										productAttribute.isHidden = true;
										pav[productAttribute.fieldName] = 'NO';
										pav['Resource_ID__c'] = null;
									}else {
										productAttribute.isReadOnly = false;
										productAttribute.isHidden = false;
									}
								}
							});
						}
					});
				}
			}
		}
		
		function isInvalidUNI(pav){
			var isErrorUNI = false;            
			var uniErrorIndicator = pav['UNI_ERROR_INDICATOR__c'];
			var reuseUNI = pav['REUSE_UNI__c'];
			var values = [];
			if(uniErrorIndicator)
				values = uniErrorIndicator.split(',');

            if(!_.isEmpty(values[0]) || !_.isEmpty(values[1]) || !_.isEmpty(values[2]))
                isErrorUNI = true;
			
			if(reuseUNI != "YES (In Inventory)")	
				isErrorUNI = false;
			
            return isErrorUNI;
        }
		function setNewtorkZCountry(selectedSR, productName, attributes, pav){
			if(!_.isEmpty(selectedSR)){
				var currentCountry = selectedSR['Country__c'];	
				if(productName.toLowerCase() == 'Exchange Connectivity 1.0'.toLowerCase() || productName.toLowerCase() == 'Financial Application Transport Service 1.0'.toLowerCase()){
					_.each(attributes, function(attrGroups){					
						_.each(attrGroups.productAtributes, function(attr){
							if(attr.fieldName.toLowerCase() == 'Location_Z_Country__c'.toLowerCase()){
								attr.isReadOnly = true;
								pav['Location_Z_Country__c'] = currentCountry;
							}
						});					
					});		
				}
			}
		}
		
		function calculateMailboxTotal(attributeGroups, pav, optionGroupName){
			var mailboxQty = 0;		
			if(!_.isUndefined(optionGroupName)){
				if(optionGroupName.toLowerCase() == 'Managed Exchange Attributes'.toLowerCase()){
					if(_.has(pav, 'mesOWA_Only_Mailbox__c')){
						mailboxQty += pav['mesOWA_Only_Mailbox__c'];					
					}
					if(_.has(pav, 'mesOWA_Only_Mailbox_w_Active_Sync__c')){
						mailboxQty += pav['mesOWA_Only_Mailbox_w_Active_Sync__c'];
					}
					if(_.has(pav, 'mesPOP_IMAP_Mailbox_10_minimum__c')){
						mailboxQty += pav['mesPOP_IMAP_Mailbox_10_minimum__c'];
					}
					if(_.has(pav, 'Advanced_Plan_with_Outlook_Client_Licens__c')){
						mailboxQty += pav['Advanced_Plan_with_Outlook_Client_Licens__c'];
					}
					if(_.has(pav, 'Advanced_Plan_without_Outlook_Client_Lic__c')){
						mailboxQty += pav['Advanced_Plan_without_Outlook_Client_Lic__c'];
					}
					if(_.has(pav, 'Elite_Plan_with_Outlook_Client_Licensing__c')){
						mailboxQty += pav['Elite_Plan_with_Outlook_Client_Licensing__c'];
					}
					if(_.has(pav, 'Elite_Plan_without_Outlook_Client_Lic__c')){
						mailboxQty += pav['Elite_Plan_without_Outlook_Client_Lic__c'];
					}
					
					_.each(attributeGroups, function(attrGrp){
						_.each(attrGrp.productAtributes, function(atrib){
							if(atrib.fieldName.toLowerCase() == 'mesPolicy_Based_Encryption_Per_User__c'.toLowerCase() || atrib.fieldName.toLowerCase() == 'mesMCAfee_DLP_Email_Continuity__c'.toLowerCase()){
								atrib.isReadOnly = true;
								pav[atrib.fieldName] = mailboxQty;
							}
						});
					});
				}
			}
		}
		
		function initializeCPULicenseCount(){
			if(_.isEmpty(cpuLicenseSettings)){
				RemoteService.getManagedServerCPULicenseCount().then(function(cpuLicenseValues){	
					cpuLicenseSettings = cpuLicenseValues;
					_.each(cpuLicenseSettings.cpuLicenseCount, function(cpuLicense){
						if(!_.has(attributeApis, cpuLicense.Attribute_API__c)){
							attributeApis[cpuLicense.Attribute_API__c] = cpuLicense.Attribute_API__c;
						}
					});
				});	
			}
		}
		
		function initializeEoCuFlag(){
			if(_.isEmpty(EoCuSettings)){
				RemoteService.getEoCuFlag().then(function(EoCuSettingValues){	
					EoCuSettings = EoCuSettingValues;
				});	
			}
		}
		function getCPULicenseCount(attributes, pav, optionGroupName, currentProductName){
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
			var currentCPUCountAPI = '';
			var currentCPUCountValue = '';
			var filteredLicenceCount = '';
			//var isSparc = false;
			var sparc = 'SPARC';
			var enterprise = 'Enterprise';
			var applicationType = 'appLicationType';
			var databaseType = 'databaseType';
			var isDatabaseTypeEnterprise = false;



			var bundleProdId = BaseConfigService.bundleLineItemInfo.lineItem.Apttus_Config2__ProductId__c;
			//var aa = $scope.PAVService.setAllComponentsToOptionPAV();
			var prodIdToAttrMap = ProductAttributeConfigCache.getProdductIdtoattributegroupsMap();
			var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
			var chassiComponentId = '';
			var chassisAttributes = [];			 
			
			var allGroups = OptionGroupDataService.getallOptionGroups();
			var allGrps = {};
			allGrps = angular.copy(allGroups);
			var selectedOption = getSelectedOptionChassis(allGroups, "Chassis");
			
			if(!_.isEmpty(allGrps)){
				_.each(allGrps[bundleProdId], function(grp){
					_.each(grp.productOptionComponents, function(item){
						if(item.productId == selectedOption){
							chassiComponentId = item.componentId;
						}
					});
				});
			}
			
			var chassisPAV = allcomponentIdToOptionPAVMap[chassiComponentId];
			
			if(_.has(prodIdToAttrMap, selectedOption)){
				_.each(prodIdToAttrMap[selectedOption], function(atrGrp){
					_.each(atrGrp.productAtributes, function(atribute){
						chassisAttributes.push(atribute.fieldName);
					});
				});
			}
			
			
			addApplicationTypes();
			addDatabaseTypes();
			addFieldApisForCPUCount();
			
			if(!_.isUndefined(optionGroupName)){
				if(optionGroupName.toLowerCase() == 'Chassis'.toLowerCase()){
					_.each(attributes, function(attrGrp){
						_.each(attrGrp.productAtributes, function(attr){
							if(_.has(attributeApis , attr.fieldName)){
								currentCPUCountAPI = attr.fieldName;
							}
						});
					});
					
					if(!_.isEmpty(currentCPUCountAPI)){					
						filteredLicenceCount = _.findWhere(cpuLicenseSettings.cpuLicenseCount, {'Attribute_API__c': currentCPUCountAPI, 'CPU_Speed_Name__c': pav[currentCPUCountAPI]});						
						
						if(_.has(pav, currentCPUCountAPI)){
							if(!_.isEmpty(pav[currentCPUCountAPI]) && pav[currentCPUCountAPI].toLowerCase().indexOf(sparc.toLowerCase()) != -1){
								service.isSparc = true;
							}else{
								service.isSparc = false;
							}								
						}
						
						if(!_.isEmpty(filteredLicenceCount)){
							if(pav[filteredLicenceCount.CPU_Count_API__c].toLowerCase() == 'Other'.toLowerCase()){
								service.cpuLicenceCount = pav[filteredLicenceCount.CPU_Count_API__c+'Other'];
							}else{
								service.cpuLicenceCount = pav[filteredLicenceCount.CPU_Count_API__c];
							}
								
							service.totalCPULicenseCount = filteredLicenceCount.CPU_Speed__c * service.cpuLicenceCount;
						}
					}
				}else{
					_.each(chassisAttributes, function(item){
						if(_.has(attributeApis , item)){
							currentCPUCountAPI = item;
						}
					});
					
					if(!_.isEmpty(currentCPUCountAPI) && chassisPAV){					
						filteredLicenceCount = _.findWhere(cpuLicenseSettings.cpuLicenseCount, {'Attribute_API__c': currentCPUCountAPI, 'CPU_Speed_Name__c': chassisPAV[currentCPUCountAPI]});						
						
						if(_.has(chassisPAV, currentCPUCountAPI)){
							if(!_.isEmpty(chassisPAV[currentCPUCountAPI]) && chassisPAV[currentCPUCountAPI].toLowerCase().indexOf(sparc.toLowerCase()) != -1){
								service.isSparc = true;
							}else{
								service.isSparc = false;
							}								
						}
						
						if(!_.isEmpty(filteredLicenceCount)){
							if(chassisPAV[filteredLicenceCount.CPU_Count_API__c].toLowerCase() == 'Other'.toLowerCase()){
								service.cpuLicenceCount = chassisPAV[filteredLicenceCount.CPU_Count_API__c+'Other'];
							}else{
								service.cpuLicenceCount = chassisPAV[filteredLicenceCount.CPU_Count_API__c];
							}
								
							service.totalCPULicenseCount = filteredLicenceCount.CPU_Speed__c * service.cpuLicenceCount;
						}
					}
				}
				
				if(optionGroupName.toLowerCase() == 'Managed Server 1.0 Add-Ons'.toLowerCase() && currentProductName.toLowerCase() == 'Database Server Software 1.0'.toLowerCase()){
					if(_.has(pav, cpuFieldApis['1'])){
						if(!_.isEmpty(pav[cpuFieldApis['1']]))
							applicationType = pav[cpuFieldApis['1']].toLowerCase();
					}if(_.has(pav, cpuFieldApis['2'])){
						databaseType = pav[cpuFieldApis['2']];
						if(!_.isEmpty(databaseType)){
							if(databaseType.toLowerCase().indexOf(enterprise.toLowerCase()) != -1){
								isDatabaseTypeEnterprise = true;
							}
							databaseType = databaseType.toLowerCase();	
						}							
					}
					
					_.each(attributes, function(attrGrp){
						_.each(attrGrp.productAtributes, function(attr){
							if(attr.fieldName.toLowerCase() == cpuFieldApis['3'].toLowerCase()){
								attr.isReadOnly = true;
							}
						});
					});
					
					//New Locgic from BigMachines 
					//Case 1 - Non-SPARC, Database Type is variation of Enterprise, Application Type is Oracle
					if(!service.isSparc && isDatabaseTypeEnterprise && applicationType == allApplicationTypes['1']){
						pav[cpuFieldApis['3']] = service.totalCPULicenseCount/2;
					}
					//Case 2 - SPARC, Database Type is variation of Enterprise, Application Type is Oracle
					else if(service.isSparc && isDatabaseTypeEnterprise && applicationType == allApplicationTypes['1']){
						pav[cpuFieldApis['3']] = service.totalCPULicenseCount * 0.75;
					}
					//Case 3 -Database Type is N/A, Application Type is My SQL
					else if(databaseType == allDatabaseTypes['1'] && applicationType == allApplicationTypes['2']){
						pav[cpuFieldApis['3']] = 1;
					}					
					//Case 4 -Database Type is Standard Edition RAC, Application Type is Oracle
					else if(databaseType == allDatabaseTypes['2'] && applicationType == allApplicationTypes['1']){
						if(service.cpuLicenceCount <= 1){
							pav[cpuFieldApis['3']] = 1;
						}else if(service.cpuLicenceCount >= 2){
							pav[cpuFieldApis['3']] = 2;
						}						
					}
					//Case 5 -Database Type is Enterprise OR Datacenter OR Standard or Web Edition, Application Type is - Microsoft SQL
					else if((databaseType == allDatabaseTypes['3'] || databaseType == allDatabaseTypes['4'] || databaseType == allDatabaseTypes['5'] || databaseType == allDatabaseTypes['6']) && applicationType == allApplicationTypes['3']){
						if(service.totalCPULicenseCount <= 4){
							pav[cpuFieldApis['3']] = 4;
						}else{
							pav[cpuFieldApis['3']] = service.totalCPULicenseCount;
						}						
					}else{
						pav[cpuFieldApis['3']] = '';
						
						_.each(attributes, function(attrGrp){
							_.each(attrGrp.productAtributes, function(attr){
								if(attr.fieldName.toLowerCase() == cpuFieldApis['3'].toLowerCase()){
									attr.isReadOnly = true;
									attr.isRequired = false;
								}
							});
						});
					}
					if(_.has(pav,'CPU_License_Count__c') && pav['CPU_License_Count__c'] !=null ){
						pav['CPU_License_Count__c'] = pav['CPU_License_Count__c'].toString();
					}
					
				}
			}	
		}
		
		function getSelectedOptionChassis(allGroups, optionGroupName){
			var selectedOption = "";
			if(!_.isUndefined(allGroups) && !_.isEmpty(allGroups)){
				_.each(allGroups, function(groups){
					_.each(groups, function(optionsGrp){
						if(optionsGrp.groupName == optionGroupName){
							selectedOption = optionsGrp.selectedproduct;
						}
					});
				});
				return selectedOption;
			}
		}
		
		function addApplicationTypes(){
			allApplicationTypes['1'] = 'Oracle'.toLowerCase();
			allApplicationTypes['2'] = 'My SQL'.toLowerCase();
			allApplicationTypes['3'] = 'Microsoft SQL'.toLowerCase();
		}
		
		function addDatabaseTypes(){
			allDatabaseTypes['1'] = 'N/A'.toLowerCase();
			allDatabaseTypes['2'] = 'Standard Edition RAC'.toLowerCase();
			allDatabaseTypes['3'] = 'Enterprise Edition'.toLowerCase();
			allDatabaseTypes['4'] = 'Datacenter Edition'.toLowerCase();
			allDatabaseTypes['5'] = 'Standard Edition'.toLowerCase();
			allDatabaseTypes['6'] = 'Web Edition'.toLowerCase();
		}
		
		function addFieldApisForCPUCount(){
			cpuFieldApis['1'] = 'DSS_Application__c';
			cpuFieldApis['2'] = 'Database_Type__c';
			cpuFieldApis['3'] = 'CPU_License_Count__c';
		}
		
		function filterPAV2Values(pav){
			var pav2Values = [];
			if(!_.isEmpty(pav) && _.has(pav, 'ProductAttributeValueId1__r')){
				pav2Values = pav['ProductAttributeValueId1__r'];
				
				_.each(pav2Values, function(item, key){
					if(key != 'Id' || key != 'ProductAttributeValueId__c'){
						pav['ProductAttributeValueId1__r.'+key] = item;
					}
					console.log('console log.');
				})
			}
		}
		
		function initializeSpecialOffers(){
			if(_.isEmpty(specialOffers)){
				RemoteService.getSpecialOffers().then(function(item){	
					specialOffers = item;
				});	
			}
		}
		
		function setSpecialOffcers(attributeGroup, currentProductName, pav){
			var bundleProductName = BaseConfigService.lineItem.bundleProdName.toLowerCase();
			var attrValuesSpOff = [];
			var prepareAttributeSpOff = [];
			_.each(specialOffers.specialOffers, function(spItem){
				if(bundleProductName == spItem.Bundle_Product__c.toLowerCase() && currentProductName.toLowerCase() == spItem.Option_Product__c.toLowerCase()){
					attrValuesSpOff = spItem.Attribute_Value__c.split(', ');
					prepareAttributeSpOff = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(attrValuesSpOff));
					if(!_.isEmpty(attributeGroup)){
						_.each(attributeGroup, function(AtrGroup){
							_.each(AtrGroup.productAtributes, function(atrItem){
								if(atrItem.fieldName == spItem.Attribute_API__c){
									atrItem.picklistValues = prepareAttributeSpOff;
										if(_.isEmpty(pav[atrItem.fieldName]) || _.isUndefined(pav[atrItem.fieldName]))
											pav[atrItem.fieldName] = prepareAttributeSpOff[1].value;
								}
									
							});
						});
					}
				}				
			});
		}
		
		// Formula is only for fields Distance_to_Fiber_BuildOut__c and Fiber_Distance_Build_Out__c
		function setDistanceToFiberFormula(attributeGroups, attributeValues){
			var selectedOption = LineItemService.currentOption;

			if(!selectedOption || !selectedOption.lineItem){
				return;
			}
			var uniBillableBandwidth = convertToMbs(attributeValues['UNI_Billable_Bandwidth__c']);
			
			//checkBandwidthThreshold(selectedOption.lineItem.existingNIDBandWidthThreshold, selectedOption.lineItem.fiberBandwidthThreshold, selectedOption.lineItem.nonFiberBuildOutOptionCode, attributeValues);
			var requiredBuildOut = findRequiredBuildOutForCE(selectedOption.lineItem.existingNIDBandWidthThreshold,selectedOption.lineItem.fiberBandwidthThreshold, uniBillableBandwidth);
			if(requiredBuildOut == "EoCu"){
				attributeValues['Distance_to_Fiber_BuildOut__c'] = "Ethernet Over Bonded Copper";
				attributeValues['Fiber_Distance_Build_Out__c'] = "N/A";
				attributeValues['Build_Out_Technology_Code__c'] = selectedOption.lineItem.nonFiberBuildOutOptionCode;
				
			} else if(requiredBuildOut == "Fiber"){
				var skipFormula = true;

				_.each(attributeGroups, function(attrGroups){
					if(!skipFormula)
						return;

					var distanceToFiber = _.findWhere(attrGroups.productAtributes, {fieldName:"Distance_to_Fiber_BuildOut__c"});
					var fiberDistance = _.findWhere(attrGroups.productAtributes, {fieldName:"Fiber_Distance_Build_Out__c"});

					if(distanceToFiber)
						skipFormula = false;

					if(fiberDistance)
						skipFormula = false;
				});

				// Skipping for non formula fields
				if(skipFormula)
					return;


				var distanceToManhole = selectedOption.lineItem.distanceToManhole;
				if(isNaN(distanceToManhole))
					distanceToManhole = 0;

				attributeValues['Fiber_Distance_Build_Out__c'] = distanceToManhole;

				var distanceToFiberValue = 'Custom Build';
				if(distanceToManhole >= 1 && distanceToManhole < 2500){
					distanceToFiberValue = "Fiber Less than 2500";
				} else if(distanceToManhole >= 2500 && distanceToManhole < 5280){
					distanceToFiberValue = "Fiber Greater than 2500";
				} else if(distanceToManhole >= 5280){
					distanceToFiberValue = "Fiber Greater than 5280";
				}

				attributeValues['Distance_to_Fiber_BuildOut__c'] = distanceToFiberValue;
				attributeValues['Build_Out_Technology_Code__c'] = "Fiber"
			}

		}
		
		//Mithilesh : remove it later
		/*function checkBandwidthThresholdold(existingNIDBandWidthThreshold, fiberBandwidthThreshold, nonFiberBuildOutOptionCode, attributeValues){
			var uniBillableBandwidth = attributeValues['UNI_Billable_Bandwidth__c'];
			if(!uniBillableBandwidth || !existingNIDBandWidthThreshold || !fiberBandwidthThreshold)
				return;

			//var existingNIDBandWidthThreshold = convertToMbs(existingNIDBandWidthThreshold);
            //var fiberBandwidthThreshold = convertToMbs(fiberBandwidthThreshold);
            uniBillableBandwidth = convertToMbs(uniBillableBandwidth);
            if(uniBillableBandwidth <= existingNIDBandWidthThreshold){
				attributeValues['Build_Out_Technology_Code__c'] = "";
            } else if(uniBillableBandwidth > existingNIDBandWidthThreshold){
                if(EoCuSettings.enabled == true){
                    if(uniBillableBandwidth <= fiberBandwidthThreshold){
                        //EoCu
                        attributeValues['Build_Out_Technology_Code__c'] = nonFiberBuildOutOptionCode;
                    } else if(uniBillableBandwidth > fiberBandwidthThreshold){
                        //Fiber
                        attributeValues['Build_Out_Technology_Code__c'] = 'Fiber';
                    }
                } else if(EoCuSettings.enabled == false){
                    //Fiber
                    attributeValues['Build_Out_Technology_Code__c'] = 'Fiber';
                }
            }
		}*/
		
		function findRequiredBuildOutForCE(existingNIDBandWidthThreshold, fiberBandwidthThreshold, uniBillableBandwidth){
			var includeBuildOut = {};		
            
            if(uniBillableBandwidth <= existingNIDBandWidthThreshold){
				includeBuildOut = "No";
            } else if(uniBillableBandwidth > existingNIDBandWidthThreshold){
                if(EoCuSettings.enabled == true){
                    if(uniBillableBandwidth <= fiberBandwidthThreshold){
                        includeBuildOut = "EoCu";
                    } else if(uniBillableBandwidth > fiberBandwidthThreshold){
                        includeBuildOut = "Fiber";
                    }
                } else if(EoCuSettings.enabled == false){
                    includeBuildOut = "Fiber";
                }
            }
			return includeBuildOut;
		}
		
		function displayCELocQualificationMessage(fieldName, currentSelectedLineItem, productAttributeValues){
			var displayMessage = false;
			
			if(fieldName != "Location_A__c" && fieldName != "UNI_Billable_Bandwidth__c")
				return;
			var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            if(bundleProductName.toLowerCase() != 'CenturyLink Ethernet'.toLowerCase() && bundleProductName.toLowerCase() != 'L3 IQ Networking Private Port'.toLowerCase()){
				return;
			}				
			if(!currentSelectedLineItem)
				return;
			if(currentSelectedLineItem != "UNI")
				return;
			var allLocations = ProductAttributeValueDataService.allLocations;
			var filteredUNILocation = _.findWhere(allLocations, {'Id': productAttributeValues['Location_A__c']});
			if(!filteredUNILocation)
				return;
			var uniBillableBandwidth = productAttributeValues['UNI_Billable_Bandwidth__c'];
			if(!uniBillableBandwidth || !filteredUNILocation.ExistingNIDBandWidthThreshold__c || !filteredUNILocation.FiberBandwidthThreshold__c)
				return;
			uniBillableBandwidth = convertToMbs(uniBillableBandwidth);
			var existingNIDBandWidthThreshold = convertToMbs(filteredUNILocation.ExistingNIDBandWidthThreshold__c);
			var fiberBandwidthThreshold = convertToMbs(filteredUNILocation.FiberBandwidthThreshold__c);
			var requiredBuildOut = findRequiredBuildOutForCE(existingNIDBandWidthThreshold,fiberBandwidthThreshold, uniBillableBandwidth);
			
			var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
			var bundleServiceType = bundlePAV['Service_Type_CGE__c'];
			if(bundleServiceType != 'EPLINE' && bundleServiceType != 'EPLAN' && productAttributeValues['REUSE_UNI__c'] != 'NO')
				return;
			var pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
			var dueDatePickList = pavfieldDescribeMap['ProductAttributeValueId1__r.Due_Date_Interval__c']; 
			var dueDatePickListValues = {};
			if(dueDatePickList)
				dueDatePickListValues = dueDatePickList.fieldDescribe.picklistValues;
							
			if(requiredBuildOut == "No"){
				displayMessage = false;
				if(dueDatePickListValues[2])
					productAttributeValues['ProductAttributeValueId1__r.Due_Date_Interval__c'] = dueDatePickListValues[2].value;
			} else if(requiredBuildOut == "Fiber" || requiredBuildOut == "EoCu"){
				if(EoCuSettings.enabled == true)
					displayMessage = true;
				if(dueDatePickListValues[1])
					productAttributeValues['ProductAttributeValueId1__r.Due_Date_Interval__c'] = dueDatePickListValues[1].value;
			}
			if(displayMessage == false || EoCuSettings.enabled == false)
				return;
			//Mithilesh : turning off the message for Nov :: Enable it in later requirements
			/*if(displayMessage == true){				
				if(filteredUNILocation.ICBPricingBandwidthThreshold__c == 0){
					var dlg = $dialogs.notify("This location does not qualify for CE services using conventional access technologies.  This build-out will be ICB priced. Please contact the CNDC for potential special construction alternatives for delivery of CE service at this location.");
				} else {
					var dlg = $dialogs.notify("This location is qualified for CE services for UNI bandwidths up to "+ filteredUNILocation.ICBPricingBandwidthThreshold__c +" Mbps. UNI configurations that exceed this bandwidth will be ICB priced.  Please contact the CNDC for potential special construction alternatives for delivery of CE service at this location that exceed this bandwidth.");
				}
			}*/
		}
		
		function setVantiveSiteId(selectedSR, attributeGroup, pav){
			if(!_.isEmpty(selectedSR) && !_.isUndefined(selectedSR)){
				if(_.has(selectedSR, 'Site_Id__c')){
					pav['ProductAttributeValueId1__r.Network_Z_Site__c'] = selectedSR['Site_Id__c'];
				}
			}
		}
		
		function validateUNI(fieldName, oldValue, newValue, currentSelectedLineItem){
			var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			var allOptionGroups = OptionGroupDataService.getallOptionGroups();
			_.each(allOptionGroups, function(optiongroups, bundleprodId){
				var uniOptionGroup = _.findWhere(optiongroups, {name: "UNI(s)"})
				if(!_.isEmpty(uniOptionGroup)){
					_.each(uniOptionGroup.optionLines, function(optionLines){
						if(!optionLines.lineItem)
							return;
						var PAVs = lineItemsToOptionPAVMap[optionLines.lineItem.lineItemId];

						var lineItemPAVAs = lineItemsToOptionPAVMap[optionLines.lineItem.lineItemId];
						if(lineItemPAVAs && lineItemPAVAs['REUSE_UNI__c'] == 'YES (In Inventory)'){
							if(fieldName == 'Service_Type_CGE__c') {
								PAVs['UNI_ERROR_INDICATOR__c'] = getErrorToUNI(0, PAVs['UNI_ERROR_INDICATOR__c'], oldValue,newValue);
							} else if (fieldName == 'Location_A__c' && currentSelectedLineItem.primaryLineNumber == optionLines.lineItem.primaryLineNumber) {
								PAVs['UNI_ERROR_INDICATOR__c'] = getErrorToUNI(1, PAVs['UNI_ERROR_INDICATOR__c'], oldValue,newValue);
							} else if (fieldName == 'CONTROL_CENTRAL_ID__c') {
								PAVs['UNI_ERROR_INDICATOR__c'] = getErrorToUNI(2, PAVs['UNI_ERROR_INDICATOR__c'], oldValue,newValue);
							}
						}
					});
				}
			});
		}
		
		function getErrorToUNI(index, values, oldValue, newValue) {
			var values = values.split(',');
			//this will be set on first change only
			values[index] = _.isEmpty(values[index]) ? oldValue : values[index];
			//reset error when switching back to original value
			if(values[index] == newValue || newValue.indexOf('EV') > -1){
				values[index] = '';
			}

			return values.join(',');
		}
		
		function resetUNIErrorIndicator(){
			var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			var allOptionGroups = OptionGroupDataService.getallOptionGroups();
			_.each(allOptionGroups, function(optiongroups, bundleprodId){
				var uniOptionGroup = _.findWhere(optiongroups, {name: "UNI(s)"})
				if(!_.isEmpty(uniOptionGroup)){
					_.each(uniOptionGroup.optionLines, function(optionLines){
						if(!optionLines.lineItem)
							return;
						var PAVs = lineItemsToOptionPAVMap[optionLines.lineItem.lineItemId];
						if(PAVs && PAVs['REUSE_UNI__c'] != "YES (In Inventory)"){
							PAVs['UNI_ERROR_INDICATOR__c'] = ",,";
						}
					});
				}
			});
		}
		
		function legacyValidation(attributeGroups, bunleLineItemStatus){
			var lineStatus = !_.isEmpty(bunleLineItemStatus) ? bunleLineItemStatus : 'NotNew';
			if(lineStatus.toLowerCase() == 'New'.toLowerCase()){
				_.each(attributeGroups, function(group){
					_.each(group.productAtributes, function(attributes){
						var lFattrs = [];
						_.each(attributes.picklistValues, function(pValues){
							if(!_.isNull(pValues.value) && !_.isEmpty(pValues.value)){
								if(!pValues.value.endsWith('*')){
									lFattrs.push(pValues);
								}else if(pValues.value.endsWith('**')){
									lFattrs.push(pValues);
								}
							}
						});
						attributes.picklistValues = lFattrs;
					});
				});
			}			
		}
		
		function checkOptionLineStatusLegacy(lineItems, currentProdName){
			if(!_.isEmpty(lineItems) && !_.isUndefined(lineItems)){
				_.each(lineItems, function(item){
					if(item.optionName.toLowerCase() == currentProdName.toLowerCase()){
						return item.lineStatus.toLowerCase();
					}
				});
			}
			
			return 'New'.toLowerCase();
		}
		
		function checkPortOptionsReconfig(optionAttributes, portOptions, allComponentsToOptionPAVs){
			var localAccessValue = '';
			var BandwidthSplitted = [];
			var CircuitSpeedSplitted = [];
			var BillingTypeSplitted = [];

			if(_.has(optionAttributes, 'Ethernet_Local_Access_Speed__c')){
				localAccessValue = optionAttributes['Ethernet_Local_Access_Speed__c'];
			}
			var filteredOnes = '';
			filteredOnes = _.findWhere(portOptions, {'Local_Access_Speed__c': localAccessValue});
			if(!_.isUndefined(filteredOnes) && !_.isNull(filteredOnes)){
				BandwidthSplitted = filteredOnes['Bandwidth__c'].split(', ');
				CircuitSpeedSplitted = filteredOnes['Circuit_Speed__c'].split(', ');
				BillingTypeSplitted = filteredOnes['Billing_Type__c'].split(', ');
				_.each(allComponentsToOptionPAVs, function(item){
					if(_.has(item, 'Bandwidth__c')){
						item['Bandwidth__c'] = BandwidthSplitted[0];
					}
					if(_.has(item, 'Circuit_Speed__c')){
						item['Circuit_Speed__c'] = CircuitSpeedSplitted[0];
					}
					if(_.has(item, 'Billing_Type__c')){
						item['Billing_Type__c'] = BillingTypeSplitted[0];
					}
				});
				ProductAttributeValueDataService.setProductAttributeValues(allComponentsToOptionPAVs);
			}
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
		
		function validateElinePop(prodName, attributes){
			if(!_.isUndefined(prodName) && !_.isNull(prodName)){
				if(prodName.toLowerCase() == 'E-Line - Connect to Hub'.toLowerCase()){
					_.each(attributes, function(item){
						_.each(item.productAtributes, function(itemAttr){
							if(itemAttr.fieldName.toLowerCase() == 'Location_A__c'.toLowerCase()){
								var newPiks = [];
								_.each(itemAttr.picklistValues, function(atrValue){									
									if(atrValue.label.indexOf('E-Line POP') == -1 && !atrValue.isTypeElinePop)
										newPiks.push(atrValue);
								});
								itemAttr.picklistValues = newPiks;
							}
						});
					});
				}else if(prodName.toLowerCase() == 'E-Line - Hub'.toLowerCase()){
					_.each(attributes, function(item){
						_.each(item.productAtributes, function(itemAttr){
							if(itemAttr.fieldName.toLowerCase() == 'Location_A__c'.toLowerCase()){
								var newPiks = [];
								_.each(itemAttr.picklistValues, function(atrValue){									
									if(atrValue.label.indexOf('E-Line POP') == -1 && !atrValue.isTypeElinePop)
										newPiks.push(atrValue);
								});
								itemAttr.picklistValues = newPiks;
							}
						});
					});
				}else if(prodName.toLowerCase() == 'E-Line - Point to Point'.toLowerCase()){
					_.each(attributes, function(item){
						_.each(item.productAtributes, function(itemAttr){
							if(itemAttr.fieldName.toLowerCase() == 'Location_A__c'.toLowerCase()){
								var newPiks = [];
								_.each(itemAttr.picklistValues, function(atrValue){									
									if(atrValue.label.indexOf('E-Line POP') == -1 && !atrValue.isTypeElinePop)
										newPiks.push(atrValue);
								});
								itemAttr.picklistValues = newPiks;
							}else if(itemAttr.fieldName.toLowerCase() == 'Location_Z__c'.toLowerCase()){
								var newPiks = [];
								_.each(itemAttr.picklistValues, function(atrValue){									
									if(atrValue.label.indexOf('E-Line POP') == -1 && !atrValue.isTypeElinePop)
										newPiks.push(atrValue);
								});
								itemAttr.picklistValues = newPiks;
							}
						});
					});
				}
				else if(prodName.toLowerCase() != 'E-Line - Hub to Hub'.toLowerCase()){
					_.each(attributes, function(item){
						_.each(item.productAtributes, function(itemAttr){
							if(itemAttr.fieldName.toLowerCase() == 'Location_A__c'.toLowerCase() || itemAttr.fieldName.toLowerCase() == 'Location_Z__c'.toLowerCase()){
								var newPiks = [];
								_.each(itemAttr.picklistValues, function(atrValue){									
									if(atrValue.label.indexOf('E-Line POP') == -1)
										newPiks.push(atrValue);
								});
								itemAttr.picklistValues = newPiks;
							}
						});
					});
				}
			}
		}
		
		function validateL3PPPort(bundleProdName, currentProdName, attributes, pav){
			var l3ppPortOptions = PAVObjConfigService.getL3PPPortOptions();
			var bandwidthAll = [];
			var Bandwidth = [];
			
			if(_.has(pav, 'Billing_Type_FTOnly__c') && _.has(pav, 'Access_Speed_L3__c')){
				if((!_.isNull(pav['Billing_Type_FTOnly__c']) && !_.isUndefined(pav['Billing_Type_FTOnly__c'])) && (!_.isNull(pav['Access_Speed_L3__c']) && !_.isUndefined(pav['Access_Speed_L3__c']))){
					var l3ppDisplay = _.findWhere(l3ppPortOptions, {Bundle_Product_Name__c:bundleProdName, Option_Name__c:currentProdName, Billing_Type__c: pav['Billing_Type_FTOnly__c'], Access_Speed__c: pav['Access_Speed_L3__c']});
					if(!_.isEmpty(l3ppDisplay) && !_.isUndefined(l3ppDisplay)){					
						bandwidthAll = l3ppDisplay['Bandwidth__c'].split(', ');						
						Bandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(bandwidthAll));
						
						_.each(attributes, function(items){
							_.each(items.productAtributes, function(atrItem){
								if(atrItem.fieldName.toLowerCase() == 'Bandwidth_ELA__c'.toLowerCase()){
									atrItem.picklistValues = Bandwidth;
									if(_.isNull(pav['Bandwidth_ELA__c']) || _.isUndefined(pav['Bandwidth_ELA__c']))
										pav['Bandwidth_ELA__c'] = bandwidthAll[0];
								}
							});
						});
					}
				}
			}
		}
		
		function removeExtraSpace(attributeGroups, pav){
			_.each(attributeGroups, function(atrItem){
				_.each(atrItem.productAtributes, function(fields){
					var neLov = [];
					_.each(fields.lovs, function(item){						
						if(item.startsWith(' ') && _.isString(item)){
							var nItem = item.slice(1);
							neLov.push(nItem);
						}else{
							neLov.push(item);
						}
					});
					fields.lovs = neLov;
				});
			});
			
			_.each(pav, function(value, key){
				if(_.isString(value)){
					if(value.startsWith(' '))
						value = value.slice(1);
				}
			});
		}
		
		if(!String.prototype.startsWith){
			String.prototype.startsWith = function (str) {
				return !this.indexOf(str);
			}
		}
		
		//Added by David (Dato) Tsamalashvili - DE15266 - 10/24/2016
		function liteServiceTerm(attributeGroups, quoteSourceCode){
			if(_.isUndefined(quoteSourceCode) || _.isNull(quoteSourceCode)){
				quoteSourceCode = 'pro';
			}
			//if(quoteSourceCode.toLowerCase() == 'LITE'.toLowerCase()){	
				if(!_.isUndefined(attributeGroups) && !_.isNull(attributeGroups)){
					_.each(attributeGroups, function(atrGroup){
						_.each(atrGroup.productAtributes, function(atr){
							if(atr.fieldName.toLowerCase() == 'Service_Term__c'.toLowerCase() && quoteSourceCode.toLowerCase() == 'LITE'.toLowerCase()){
								atr.numericServiceTerm = true;
								atr.serviceTermOtherField = 'number';
							}else{
								atr.numericServiceTerm = false;
								atr.serviceTermOtherField = 'text';
							}
						});
					});
				}
			//}
		}
		
		//Added by David (Dato) Tsamalashvili - US73057 - 11/01/2016
		function validateL3PPUNIBandwidth(productAttributeValues, currentOptionGroupName, bundleProdName, atributeGroups, l3ppPortComponent, allPavs, currentComponent){
			var l3ppUNIPortOptionAtrs = PAVObjConfigService.getL3PPUNIPortOptions();
			if(!_.isUndefined(l3ppUNIPortOptionAtrs) && !_.isEmpty(l3ppUNIPortOptionAtrs)){
				l3ppUNIPortOptionAtrs.sort(function(a,b){
					return a.Name - b.Name
				});
			}
			if(bundleProdName.toLowerCase() == 'L3 IQ Networking Private Port'.toLowerCase()){
				if(!_.isUndefined(currentOptionGroupName) && !_.isEmpty(currentOptionGroupName)){
					if(currentOptionGroupName.toLowerCase() == 'Port Type'.toLowerCase()){
						if(_.has(productAttributeValues, 'Bandwidth_ELA__c'))
							L3PPPortBandwidthForUNI = productAttributeValues['Bandwidth_ELA__c'];
							service.l3ppBandPrt = productAttributeValues['Bandwidth_ELA__c'];
					}else if(currentOptionGroupName.toLowerCase() == 'EVC CoS Options'.toLowerCase()){
						if(!_.isEmpty(L3PPPortBandwidthForUNI) && !_.isUndefined(L3PPPortBandwidthForUNI)){
							var bandWidthAttrs = [];
								_.each(l3ppUNIPortOptionAtrs, function(item){
									if(item['Port_Bandwidth__c'] == L3PPPortBandwidthForUNI && !_.isUndefined(item.Option_Product_Name__c) && item.Option_Product_Name__c.toLowerCase() == currentComponent.productName.toLowerCase())
										bandWidthAttrs.push(item);										
								});
							if(!_.isUndefined(bandWidthAttrs) && !_.isEmpty(bandWidthAttrs)){
								var atributesString = '';
								var portBandwidthValueInt = 0;
								var filteredValuesBilBand = [];
								var preparedCOSBandwidth = [];
								if(bandWidthAttrs.length > 0){
									_.each(bandWidthAttrs, function(item){
										if(!_.isUndefined(item)){
											atributesString += item['COS_Bandwidth__c'];
											portBandwidthValueInt = parseInt(item['Port_Bandwidth_Value__c']);
										}										
									});
									filteredValuesBilBand = atributesString.split(',');
									
									if(!_.isUndefined(filteredValuesBilBand) &&!_.isEmpty(filteredValuesBilBand)){
										var currentAtrs = [];
										_.each(filteredValuesBilBand, function(item){
											currentAtrs.push(item);
										});
										preparedCOSBandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(currentAtrs));
									}
									
									_.each(atributeGroups, function(item){
										_.each(item.productAtributes, function(atrItem){
											if(atrItem.fieldName.toLowerCase() == 'Real_Time_COS__c'.toLowerCase() || atrItem.fieldName.toLowerCase() == 'Guaranteed_COS__c'.toLowerCase() || atrItem.fieldName.toLowerCase() == 'Business_Class_COS__c'.toLowerCase()){
												atrItem.picklistValues = preparedCOSBandwidth;
												atrItem.isReadOnly = false;
											}
											if(atrItem.fieldName.toLowerCase() == 'Real_Time_COS__c'.toLowerCase()){
												service.realTimeCOSBand = productAttributeValues['Real_Time_COS__c'];
											}else if(atrItem.fieldName.toLowerCase() == 'Guaranteed_COS__c'.toLowerCase()){
												service.guaranteedCOSBand = productAttributeValues['Guaranteed_COS__c'];
											}else if(atrItem.fieldName.toLowerCase() == 'Business_Class_COS__c'.toLowerCase()){
												service.businessCOSBand = productAttributeValues['Business_Class_COS__c'];
											}
										});
									});
									
									var realTimeInt = '';
									var guaranteedInt = '';
									var businessInt = '';
									var CosSumEV = 0;
									
									if(!_.isEmpty(service.realTimeCOSBand)){
										if(service.realTimeCOSBand.endsWith(' Mbps')){
											realTimeInt = service.realTimeCOSBand.replace(' Mbps','');
											CosSumEV += parseInt(realTimeInt);
										}else if(service.realTimeCOSBand.endsWith(' Gbps')){
											realTimeInt = service.realTimeCOSBand.replace(' Gbps','');
											realTimeInt = realTimeInt*1000;
											CosSumEV += parseInt(realTimeInt);
										}
									}
									if(!_.isEmpty(service.guaranteedCOSBand)){
										if(service.guaranteedCOSBand.endsWith(' Mbps')){
											guaranteedInt = service.guaranteedCOSBand.replace(' Mbps','');
											CosSumEV += parseInt(guaranteedInt);
										}else if(service.guaranteedCOSBand.endsWith(' Gbps')){
											guaranteedInt = service.guaranteedCOSBand.replace(' Gbps','');
											guaranteedInt = guaranteedInt*1000;
											CosSumEV += parseInt(guaranteedInt);
										}
									}
									if(!_.isEmpty(service.businessCOSBand)){
										if(service.businessCOSBand.endsWith(' Mbps')){
											businessInt = service.businessCOSBand.replace(' Mbps','');
											CosSumEV += parseInt(businessInt);
										}else if(service.businessCOSBand.endsWith(' Gbps')){
											businessInt = service.businessCOSBand.replace(' Gbps','');
											businessInt = businessInt*1000;
											CosSumEV += parseInt(businessInt);
										}
									}
									
									service.CosSum = CosSumEV;
									if(CosSumEV > portBandwidthValueInt){
										service.cosBandwithLimitExc = true;
										//MessageService.addMessage('Validation Error', 'The sum of COS bandwidth can not exceed the IQ Port Bandwidth.');
									}else{
										service.cosBandwithLimitExc = false;
									}
									
								}
							}
						}
					}else{
						if(!_.isEmpty(L3PPPortBandwidthForUNI) && !_.isUndefined(L3PPPortBandwidthForUNI)){
							if(_.has(productAttributeValues, 'UNI_Billable_Bandwidth__c')){
								var billableBandw = [];
								_.each(l3ppUNIPortOptionAtrs, function(item){
									if(item['Port_Bandwidth__c'] == L3PPPortBandwidthForUNI && !_.isUndefined(item.Bundle_Product_Name__c) && item.Bundle_Product_Name__c.toLowerCase() == bundleProdName.toLowerCase())
										billableBandw.push(item);										
								});
								var filteredValuesBilBand = [];
								var preparedUNIBandwidth = [];
								if(!_.isUndefined(billableBandw) && !_.isEmpty(billableBandw)){
									var atributesString = '';
									if(billableBandw.length > 0){
										_.each(billableBandw, function(item){
											atributesString += item['UNI_Bandwidth__c'];
										});
									}
										
									filteredValuesBilBand = atributesString.split(',');									
									
									if(!_.isUndefined(filteredValuesBilBand) &&!_.isEmpty(filteredValuesBilBand)){
										var currentAtrs = [];
										_.each(filteredValuesBilBand, function(item){
											currentAtrs.push(item);
										});
										preparedUNIBandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(currentAtrs));
									}										
									
									_.each(atributeGroups, function(item){
										_.each(item.productAtributes, function(atrItem){
											if(atrItem.fieldName.toLowerCase() == 'UNI_Billable_Bandwidth__c'.toLowerCase()){
												atrItem.picklistValues = preparedUNIBandwidth;
												atrItem.isReadOnly = false;
											}
										});
									});									
								}
							}						 
						}else if((!_.isUndefined(l3ppPortComponent) && !_.isEmpty(l3ppPortComponent)) && (!_.isUndefined(allPavs) && !_.isEmpty(allPavs))){
							var currentPortTypePavs = '';
							if(_.has(allPavs, l3ppPortComponent))
								currentPortTypePavs = allPavs[l3ppPortComponent];
							
							if(_.has(currentPortTypePavs, 'UNI_Billable_Bandwidth__c')){
								var billableBandw = [];
								_.each(l3ppUNIPortOptionAtrs, function(item){
									if(item['Port_Bandwidth__c'] == L3PPPortBandwidthForUNI && !_.isUndefined(item.Bundle_Product_Name__c) && item.Bundle_Product_Name__c.toLowerCase() == bundleProdName.toLowerCase())
										billableBandw.push(item);										
								});
								var filteredValuesBilBand = [];
								var preparedUNIBandwidth = [];
								if(!_.isUndefined(billableBandw) && !_.isEmpty(billableBandw)){
									var atributesString = '';
									if(billableBandw.length > 0){
										_.each(billableBandw, function(item){
											atributesString += item['UNI_Bandwidth__c'];
										});
									}
										
									filteredValuesBilBand = atributesString.split(',');									
									
									if(!_.isUndefined(filteredValuesBilBand) &&!_.isEmpty(filteredValuesBilBand)){
										var currentAtrs = [];
										_.each(filteredValuesBilBand, function(item){
											currentAtrs.push(item);
										});
										preparedUNIBandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(currentAtrs));
									}
										
									
									_.each(atributeGroups, function(item){
										_.each(item.productAtributes, function(atrItem){
											if(atrItem.fieldName.toLowerCase() == 'UNI_Billable_Bandwidth__c'.toLowerCase()){
												atrItem.picklistValues = preparedUNIBandwidth;
												atrItem.isReadOnly = false;
											}
										});
									});									
								}
							}	
						}
					}
				}
			}
		}
		
		function recalculateL3PPCosBandwidth(pcComponent, bundleProdName){
			if(bundleProdName.toLowerCase() == 'L3 IQ Networking Private Port'.toLowerCase()){
				var l3ppUNIPortOptionAtrs = PAVObjConfigService.getL3PPUNIPortOptions();
				if(!_.isUndefined(l3ppUNIPortOptionAtrs) && !_.isEmpty(l3ppUNIPortOptionAtrs)){
					l3ppUNIPortOptionAtrs.sort(function(a,b){
						return a.Name - b.Name
					});
				}
				
				var cosOptions = [];
				cosOptions['Real Time COS'.toLowerCase()] = 'Real_Time_COS__c';
				cosOptions['Guaranteed CoS'.toLowerCase()] = 'Guaranteed_COS__c';
				cosOptions['Business Class CoS'.toLowerCase()] = 'Business_Class_COS__c';
				if(_.has(cosOptions,pcComponent.productName.toLowerCase()) && !pcComponent.isselected){
					//var allPavs = ProductAttributeValueDataService.setAllComponentsToOptionPAV();
					var allPavs = ProductAttributeValueDataService.getoptionproductattributevalues()
					var currentCompAttributes = allPavs[pcComponent.componentId];
					if(_.isUndefined(currentCompAttributes) && _.has(pcComponent, 'lineItem')){
						_.each(allPavs, function(pavItem){
							if(_.has(pavItem, 'Apttus_Config2__LineItemId__c')){
								if(pavItem['Apttus_Config2__LineItemId__c'] == pcComponent.lineItem.lineItemId)
									currentCompAttributes = pavItem;
							}								
						});						
					}
					if(!_.isUndefined(currentCompAttributes) && !_.isNull(currentCompAttributes)){
						var currentBandwidth = currentCompAttributes[cosOptions[pcComponent.productName.toLowerCase()]];
						var currentBandwidthAPI = cosOptions[pcComponent.productName.toLowerCase()];
						var portBandwidthValueInt = 0;
						var parsedPortBandwidth = 0;
						
						if(currentBandwidthAPI.toLowerCase() == 'Real_Time_COS__c'.toLowerCase()){
							service.realTimeCOSBand = ''
						}else if(currentBandwidthAPI.toLowerCase() == 'Guaranteed_COS__c'.toLowerCase()){
							service.guaranteedCOSBand = ''
						}else if(currentBandwidthAPI.toLowerCase() == 'Business_Class_COS__c'.toLowerCase()){
							service.businessCOSBand = ''
						}
						
						if(!_.isUndefined(currentBandwidth) && !_.isNull(currentBandwidth)){						
							var filteredOption = _.findWhere(l3ppUNIPortOptionAtrs, {'Port_Bandwidth__c': currentBandwidth, 'Option_Product_Name__c': pcComponent.productName});
							if(!_.isUndefined(filteredOption)){
								portBandwidthValueInt = parseInt(filteredOption['Port_Bandwidth_Value__c']);
							}
							if(!_.isUndefined(portBandwidthValueInt) && !_.isNull(portBandwidthValueInt)){
								service.CosSum = service.CosSum - portBandwidthValueInt;
							}
							if(!_.isUndefined(!pcComponent.isselected) && !_.isNull(!pcComponent.isselected)){
								if(service.l3ppBandPrt.endsWith(' Mbps')){
									var bandW = service.l3ppBandPrt.replace(' Mbps','');
									parsedPortBandwidth = parseInt(bandW);
								}else if(service.l3ppBandPrt.endsWith(' Gbps')){
									var bandW = service.l3ppBandPrt.replace(' Gbps','');
									bandW = bandW*1000;
									parsedPortBandwidth = parseInt(bandW);
								}
								
								if(service.CosSum > parsedPortBandwidth){
									service.cosBandwithLimitExc = true;
								}else{
									service.cosBandwithLimitExc = false;
								}		
							}
						}
					}
				}
			}
		}
		
		
	}
})();