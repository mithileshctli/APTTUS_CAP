(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, BaseService, BaseConfigService, RemoteService, LocationDataService, OptionGroupDataService,
                                          ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService, RemoteService, LineItemAttributeValueDataService, LineItemService, MessageService) {
        // multi-location support for E-line.
        var zLoc = '';
        var aLoc = '';

        $scope.init = function(){
            // all variable intializations.
            $scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.optionGroupService = OptionGroupDataService;            
            $scope.AttributeGroups = [];
            $scope.pavfieldDescribeMap = {};
            $scope.productAttributeValues = {};
            $scope.Selectedoptionproduct = {};	
			$scope.currentOptionGroupName = '';
            $scope.hideOptionAttributes = false;
			$scope.hideClonedOptionAttributes = true;
            $scope.lineItemObjectService = LineItemService;
			$scope.lineItemIdToAttributeGroupMap = [];
			$scope.lineItemIdToPAV = [];

			$scope.currentProductName = '';
			ProductAttributeConfigDataService.initializeCPULicenseCount();
			ProductAttributeConfigDataService.initializeEoCuFlag();
			ProductAttributeConfigDataService.initializeSpecialOffers();
			$scope.hideClonedAttrGroup = true;
			$scope.currentQuoteSourceCode = '';

		}
        
        // Option Attribute load on location selection.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
			if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal))
            {   
                if(_.isEmpty($scope.Selectedoptionproduct))
                {
                    var optionProductId = $scope.Selectedoptionproduct.productId;
                    var componentId = $scope.Selectedoptionproduct.componentId;
                    $scope.retrieveproductattributeGroupData(optionProductId, componentId, newVal.optionGroupName);
                }

                // initiate the save call on location change.
                if(BaseService.getpageloadComplete())
                    BaseService.setisSavecallRequested(true);
            }    
        });
		
		// Option Attribute load on option selection.
        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal, oldVal) {           
            if(!_.isEmpty(newVal)){
                $scope.Selectedoptionproduct = newVal;
                var optionProductId = newVal.productId;
                var lineItemId = newVal.lineItemId;
                var componentId = newVal.componentId;				
				$scope.currentProductName = newVal.productName;
				$scope.currentQuoteSourceCode = newVal.quoteSourceCode;
				
                $scope.retrieveproductattributeGroupData(optionProductId, componentId, newVal.optionGroupName, lineItemId);
                
                // initiate the save call on option attribute retrieval change.
                if(!newVal.dontFireSave)
                    BaseService.setisSavecallRequested(true);
            }
        });
		
		// Option Attributes Group load for Cloned.
        $scope.$watch('optionGroupService.getSelectedoptionGroupproduct()', function(newVal, oldVal) {           
            if(!_.isEmpty(newVal)){				
                $scope.retrieveproductattributeGroupDataClonedGroup(newVal);
                
                // initiate the save call on option attribute retrieval change.
                if(!newVal.dontFireSave)
                    BaseService.setisSavecallRequested(true);
            }
        });
		
		//Update Total Seat quantity for all PAV's for Valdiation Rules.
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		$scope.$watch('optionGroupService.isQuantityChange', function(newVal, oldVal){
			if(newVal){				
				$scope.allComponentsToOptionPAVs = ProductAttributeConfigDataService.updateTotalSeatQuantity($scope.PAVService.setAllComponentsToOptionPAV(), $scope.optionGroupService.seatTypeCount);				
				$scope.PAVService.allComponentsToOptionPAV = $scope.allComponentsToOptionPAVs;
				$scope.optionGroupService.isQuantityChange = false;
			}			
		});
	*/
        // Cascading of bundle attributes to options.
        $scope.$watchCollection('PAVService.getbundleAttributeChanged()', function(newValue, oldValue){ 
            if(newValue == true)
            {
                $scope.CascadeBunleAttributestoOptions();
                PAVObjConfigService.configurePAVFields($scope.AttributeGroups, $scope.productAttributeValues);
                
                // reset the bundle attribute change.
                ProductAttributeValueDataService.setbundleAttributeChanged(false);

                // initiate the save call on bundle attributes change.
                BaseService.setisSavecallRequested(true);
            }
        });

        // Option Attribute load on lineItem selection.
        $scope.$watch('optionGroupService.getSelectedLineItemOption()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)){
                $scope.SelectedLineItemOption = newVal;
                var lineItemId = newVal.lineItemId;
                var optionProductId = newVal.productId;
                var componentId = newVal.componentId;
				
				if(_.has(newVal, 'quoteSourceCode'))
					$scope.currentQuoteSourceCode = newVal.quoteSourceCode;
				
                $scope.retrieveproductattributeGroupData(optionProductId, componentId, newVal.optionGroupName, lineItemId);
            }
        });

        // hide Option Attributes
        $scope.$watch('optionGroupService.getHideOptionAttributes()', function(newVal, oldVal) {
            if(newVal){
                $scope.hideOptionAttributes = newVal;
            }
        });
		
		// hide Option Attributes
        $scope.$watch('optionGroupService.getHideClonedOptionAttributes()', function(newVal, oldVal) {
            if(newVal){
                $scope.hideClonedOptionAttributes = newVal;
            }
        });

        $scope.$watch('lineItemObjectService.getReloadOptionAttributes()', function(newVal, oldVal){
            if(newVal && newVal != oldVal && $scope.productAttributeValues){
                var previousAttributes = angular.copy($scope.productAttributeValues);
                $scope.productAttributeValues = newVal;

                _.each($scope.AttributeGroups, function(attributeGroup){
                    _.each(attributeGroup.productAtributes, function(attributeConfig) {
                        var fieldName = attributeConfig.fieldName;

                        if(_.has(previousAttributes, fieldName))
                            $scope.productAttributeValues[fieldName] = previousAttributes[fieldName];
                    });
                });
            }
        });

        $scope.CascadeBunleAttributestoOptions = function(){
            // get attribute config fields for bundle product and clone them.
            var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
            var bunleAttributeFields = ProductAttributeConfigDataService.getBundleAttributeFields();
            var optionPAV = $scope.productAttributeValues;
            var serviceTermOrverride = [];
            serviceTermOrverride['Local Access'] = 'Local Access';
            serviceTermOrverride['Transport Options - Local Access'] = 'Transport Options - Local Access';
			serviceTermOrverride['Rental Switch'] = 'Rental Switch';			

            _.each(bunleAttributeFields, function(field){
                //if($scope.currentOptionGroupName != 'Local Access' || $scope.currentOptionGroupName != 'Transport Options - Local Access'){
                if(!_.has(serviceTermOrverride, $scope.currentOptionGroupName)){
                    optionPAV[field] = bundlePAV[field];
					if(_.has(bundlePAV, 'Service_Term__c') && bundlePAV['Service_Term__c'] == 'Other')
						optionPAV['Service_Term__cOther'] = bundlePAV['Service_Term__cOther'];
                }else{
                    if(_.has(optionPAV, 'Service_Term__c') && (_.isEmpty(optionPAV['Service_Term__c']) || optionPAV['Service_Term__c'] == null)){
                        optionPAV['Service_Term__c'] = bundlePAV['Service_Term__c'];
                    }else{
                        optionPAV['Service_Term__c'] = optionPAV['Service_Term__c'];						
						if(_.has(bundlePAV, 'Service_Term__cOther'))
						{
							optionPAV['Service_Term__cOther']=bundlePAV['Service_Term__cOther'];
						}
						
						//Added by David (Dato) Tsamalashvili 07/27/2016 - US77761
						if(_.has(bundlePAV, 'Discount_Level__c')){
							optionPAV['Discount_Level__c'] = bundlePAV['Discount_Level__c'];
						}
						
						optionPAV['Service_Term__c'] = bundlePAV['Service_Term__c'];							
                    }
                }
            });

        }
            

        /*$scope.retrieveproductattributeGroupData = function(productId, componentId, optionGroupName){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
			$scope.currentOptionGroupName = optionGroupName;
            $scope.pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
            ProductAttributeConfigDataService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId, optionGroupName).then(function(attributeconfigresult) {
                $scope.PAVService.getProductAttributeValues(componentId).then(function(pavresult)
                {
                    renderOptionAttributes(attributeconfigresult, pavresult);
                })
            })
        }*/

        $scope.retrieveproductattributeGroupData = function(productId, componentId, optionGroupName, lineItemId){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
			
			if(optionGroupName == 'Local Access - Location A'){
				selectedlocationId = ProductAttributeConfigDataService.eLinePointToPointLocA;
			}else if(optionGroupName == 'Local Access - Location Z'){
				selectedlocationId = ProductAttributeConfigDataService.eLinePointToPointLocZ;
			}			
			
            $scope.currentOptionGroupName = optionGroupName;
            $scope.pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
            ProductAttributeConfigDataService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId, optionGroupName).then(function(attributeconfigresult) {
                if(lineItemId){
                    LineItemAttributeValueDataService.getLineItemAttributeValues(lineItemId).then(function(pavresult)
                    {
                        renderOptionAttributes(attributeconfigresult, pavresult);
                    })
                } else {
                    $scope.PAVService.getProductAttributeValues(componentId).then(function(pavresult)
                    {
                        renderOptionAttributes(attributeconfigresult, pavresult);
                    })
                }

            })
        }
		
		$scope.PAVAttributeChangeGroupedClonesSave = function(fieldName, lineItemId, selectedValue){
			
			var lineItemIdToPAv = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
			if(_.has(lineItemIdToPAv, lineItemId)){
				lineItemIdToPAv[lineItemId][fieldName] = selectedValue;
			}
			BaseService.setisSavecallRequested(true);
			
			
			$scope.PAVAttributeChangeGroupedClones(fieldName);
			
		}
		
		$scope.retrieveproductattributeGroupDataClonedGroup = function(lineItems){
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
			var optionGroupName = lineItems.optionGroupName;
			var productId = lineItems.lineItemsForAttributes[0].optionId;	
			var componentId = lineItems.lineItemsForAttributes[0].componentId;
			var lineItemId = lineItems.lineItemsForAttributes[0].lineItemId;
			var optionName = lineItems.lineItemsForAttributes[0].optionName;
			$scope.lineItemIdToPAV = [];
			//$scope.hideClonedAttrGroup = true;
			$scope.lineItemIdToAttributeGroupMap = [];
			//$scope.hideClonedAttrGroup = false;
			$scope.hideClonedOptionAttributes = $scope.optionGroupService.getHideClonedOptionAttributes();
			$scope.hideOptionAttributes = true;
			
			//$scope.retrieveproductattributeGroupData(productId, componentId, optionGroupName, lineItemId);
			
			
            $scope.pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
            ProductAttributeConfigDataService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId, optionGroupName).then(function(attributeconfigresult) {
				console.log('Attribute group for cloned product');
                _.each(lineItems.lineItemsForAttributes, function(item){
					LineItemAttributeValueDataService.getLineItemAttributeValues(item.lineItemId).then(function(pavresult){
						var tempVar = {};
						tempVar['lineItemId'] = item.lineItemId;
						
						tempVar['optionName'] = optionName;
						tempVar['productId'] = productId;		
						
						$scope.groupedClonedAttr = attributeconfigresult;
						$scope.groupedClonedAttrPAV = pavresult;
								
						$scope.CascadeBunleAttributestoOptions();						
						$scope.lineItemIdToPAV[item.lineItemId] = $scope.groupedClonedAttrPAV;
						ProductAttributeConfigDataService.getReqiredDynamicAttributes($scope.groupedClonedAttr);						
						$scope.isCapReadOnly = BaseService.isCapReadOnly;
						//var attrGroups = angular.copy($scope.groupedClonedAttr);
						//var attrGroupsVals = angular.copy($scope.groupedClonedAttrPAV);
						$scope.attrGroups = angular.copy($scope.groupedClonedAttr);
						$scope.attrGroupsVals = angular.copy($scope.groupedClonedAttrPAV);
						PAVObjConfigService.configurePAVFields($scope.attrGroups, $scope.attrGroupsVals);
						ProductAttributeConfigDataService.filterPAV2Values($scope.attrGroupsVals);
						ProductAttributeConfigDataService.setSpecialOffcers($scope.attrGroups, optionName, $scope.attrGroupsVals);
						ProductAttributeConfigDataService.calculateMailboxTotal($scope.attrGroups, $scope.attrGroupsVals, optionGroupName);
                        ProductAttributeConfigDataService.getCPULicenseCount($scope.attrGroups, $scope.attrGroupsVals, optionGroupName, optionName);
						
						var currentOptionLineStatus = ProductAttributeConfigDataService.checkOptionLineStatusLegacy(lineItems.lineItemsForAttributes, optionName);
						ProductAttributeConfigDataService.legacyValidation($scope.attrGroups, currentOptionLineStatus);
						
						setCGEAttributesGrouping();
						//setBandWidthToUNIAttributes();
						//setDistanceToFiberFormula();
						
						//added by David (Dato) Tsamalashvili - DE 12843 - 09/01/2016
						$scope.attrGroups = ProductAttributeConfigDataService.removeSpecialCharsPAVChange($scope.attrGroups);
						
						tempVar['attributeGroups'] = $scope.attrGroups;
						tempVar['selectedValues'] = $scope.attrGroupsVals;
						
						$scope.lineItemIdToAttributeGroupMap.push(tempVar);
						tempVar = {};
						$scope.groupedClonedAttr = '';
						$scope.groupedClonedAttrPAV = '';
						BaseService.setisSavecallRequested(false);
                    });
				});
            });
        }
		
		$scope.PAVAttributeChangeGroupedClones = function(fieldName){
			var lineItems = $scope.optionGroupService.getSelectedoptionGroupproduct();
            $scope.retrieveproductattributeGroupDataClonedGroup(lineItems);
            // initiate the save call on attribute change.
            BaseService.setisSavecallRequested(true);
        }

        function renderOptionAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
			//$scope.hideClonedAttrGroup = true;
			$scope.optionGroupService.setHideClonedOptionAttributes(true);
			$scope.hideClonedOptionAttributes = true;
            getLocationZOrA(pav);
            $scope.hideOptionAttributes = false;
            $scope.optionGroupService.setHideOptionAttributes(false);
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;

			//added by David (Dato) Tsamalashvili - 10/19/2016 - to remove space at the begining of value.
			ProductAttributeConfigDataService.removeExtraSpace($scope.AttributeGroups, $scope.productAttributeValues);
			
            $scope.CascadeBunleAttributestoOptions();
            PAVObjConfigService.configurePAVFields($scope.AttributeGroups, $scope.productAttributeValues);
			ProductAttributeConfigDataService.getReqiredDynamicAttributes($scope.AttributeGroups);
			
            // seat type expression support and multi-location support for E-Line.
            $scope.optionLevelAttributeChange();
			
            //Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
			//$scope.seatTypeExpressions(attrgroups, pav);
			$scope.isCapReadOnly = BaseService.isCapReadOnly;

			$scope.test = $scope.PAVService.setAllComponentsToOptionPAV();
			
			//added by David (Dato) Tsamalashvili - to avoid droping of selected PAV 2 values
			ProductAttributeConfigDataService.filterPAV2Values(pav);
			
			//added by David (Dato) Tsamalashvili - to support special offers
			ProductAttributeConfigDataService.setSpecialOffcers($scope.AttributeGroups, $scope.currentProductName, $scope.productAttributeValues);
			
			//added by David Tsamalashvili - 04/01/2016 - To Set Network Z Country for Exchange Connectivity 1.0.
			ProductAttributeConfigDataService.setNewtorkZCountry($scope.locationService.getselectedlpa(), $scope.currentProductName, $scope.AttributeGroups, $scope.productAttributeValues);
			//added by David Tsamalashvili - 02/25/2016 - To Support E-Line Point to Point option.
			ProductAttributeConfigDataService.eLinePointToPointCheck($scope.currentProductName, pav);
            //access market
            ProductAttributeConfigDataService.OWSSetLocationAccessMarket($scope.Selectedoptionproduct, pav,$scope.AttributeGroups);

            //added by David Tsamalashvili - 04/01/2016 - To Support Mailbox Totaling for Managed Exchange/Sharepoint 1.0.
            ProductAttributeConfigDataService.calculateMailboxTotal($scope.AttributeGroups, $scope.productAttributeValues, $scope.currentOptionGroupName);
            //added by David Tsamalashvili - 04/04/2016 - To Support CPU License Count for Managed Server.
            ProductAttributeConfigDataService.getCPULicenseCount($scope.AttributeGroups, $scope.productAttributeValues, $scope.currentOptionGroupName, $scope.currentProductName);

            // added by Jeff Rink (JPR) - 05/18/2016 - to support conditionally rendering UNI Attributes per US57338
			// Mithilesh - extended this logic to support L3PP
            ProductAttributeConfigDataService.setReuseUni($scope.AttributeGroups, $scope.currentProductName, $scope.productAttributeValues);

            // added by Gabriel and Ashish
            ProductAttributeConfigDataService.disableOptionForNoSpeed($scope.productAttributeValues, $scope.AttributeGroups, $scope.currentProductName, $scope.currentOptionGroupName);
            ProductAttributeConfigDataService.setBuildOutOptions($scope.productAttributeValues, $scope.AttributeGroups);

            var lineItemsExists = LineItemService.getCurrentSelectedLineItemBundle();
            setCGEAttributes();
            if(lineItemsExists) {
                calculateGeography();
            }
			//if(BaseConfigService.lineItem.bundleProdName.toLowerCase() != 'L3 IQ Networking Private Port'.toLowerCase())
			setBandWidthToUNIAttributes();
			
			if(BaseConfigService.lineItem.bundleProdName.toLowerCase() != 'L3 IQ Networking Private Port'.toLowerCase())
				ProductAttributeConfigDataService.setPortBandwidthToUNI($scope.AttributeGroups,pav);
			
			setDistanceToFiberFormula();
			
			var currentOptionLineStatus = ProductAttributeConfigDataService.checkOptionLineStatusLegacy(lineItemsExists, $scope.currentProductName);
			ProductAttributeConfigDataService.legacyValidation($scope.AttributeGroups, currentOptionLineStatus);
			
			//added by David (Dato) Tsamalashvili - DE 12843 - 09/01/2016
			$scope.AttributeGroups = ProductAttributeConfigDataService.removeSpecialCharsPAVChange($scope.AttributeGroups);
			
			//added by David (Dato) Tsamalashvili - DE 14616 - 09/29/2016
			ProductAttributeConfigDataService.validateElinePop($scope.currentProductName, $scope.AttributeGroups);
			
			//added by David (Dato) Tsamalashvili - 10/6/2016 - US62302
			ProductAttributeConfigDataService.validateL3PPPort(BaseConfigService.lineItem.bundleProdName, $scope.currentProductName, $scope.AttributeGroups, $scope.productAttributeValues);
			
			//Added by David (Dato) Tsamalashvili - DE15266 - 10/24/2016
			ProductAttributeConfigDataService.liteServiceTerm($scope.AttributeGroups, $scope.currentQuoteSourceCode);
			
			//Added by David (Dato) Tsamalashvili - US73057 - 11/01/2016
			ProductAttributeConfigDataService.validateL3PPUNIBandwidth($scope.productAttributeValues, $scope.currentOptionGroupName, BaseConfigService.lineItem.bundleProdName, $scope.AttributeGroups, $scope.optionGroupService.L3PPPortType, $scope.allComponentsToOptionPAVs, $scope.Selectedoptionproduct);
			COSValidationBandwidth();
        }
		
		function COSValidationBandwidth(){
			var displayMessage = ProductAttributeConfigDataService.cosBandwithLimitExc;
			if(displayMessage)
				MessageService.addMessage('danger', 'The sum of COS bandwidth can not exceed the IQ Port Bandwidth..');
		}
		

        $scope.PAVAttributeChange = function(fieldName){
            $scope.PAVPicklistChange(fieldName);
            // initiate the save call on attribute change.
            BaseService.setisSavecallRequested(true);
        }

        $scope.PAVPicklistChange = function(fieldName, oldValue){
            renderOptionAttributes($scope.AttributeGroups, $scope.productAttributeValues);			
			ProductAttributeConfigDataService.removeSpecialCharsPAVChange($scope.AttributeGroups);
			ProductAttributeConfigDataService.setMultiSiteLocations($scope.productAttributeValues, LocationDataService.zLocations);
			
			updateLocationsInCache($scope.productAttributeValues);

			var newValue = $scope.productAttributeValues[fieldName];
			var currentSelectedLineItem = LineItemService.currentOption.lineItem;
			ProductAttributeConfigDataService.validateUNI(fieldName, oldValue, newValue, currentSelectedLineItem);
			var currentSelectedProduct = LineItemService.currentOption.productName;
			ProductAttributeConfigDataService.displayCELocQualificationMessage(fieldName, currentSelectedProduct, $scope.productAttributeValues);
						
            ProductAttributeConfigDataService.setAttributeCustomActions(fieldName, $scope.productAttributeValues).then(function(){
                // initiate the save call on picklist attribute change.
                BaseService.setisSavecallRequested(true);
            });
        }
		
		$scope.showReusableIcon = function(optionattr){
            if(optionattr.fieldName == 'REUSE_UNI__c'
                && $scope.productAttributeValues[optionattr.fieldName] == 'YES (In Inventory)')
                // && !_.isEmpty($scope.productAttributeValues['Resource_ID__c'])
                return "reuse_uni_picklist";
            return "";
        };

        $scope.reSearchUNI = function(){
            ProductAttributeConfigDataService.getESLUNIs($scope.productAttributeValues);
        };

        $scope.optionLevelAttributeChange = function(){
            var optionAttributes = $scope.productAttributeValues;
			var portOptions = PAVObjConfigService.getPortOptions();
			
			$scope.localAccessComponentId = $scope.optionGroupService.LocalAccessComponentId;
			$scope.allComponentsToOptionPAVs = $scope.PAVService.setAllComponentsToOptionPAV();
			
			var result = ProductAttributeConfigDataService.optionAttributeChangeConstraint(optionAttributes, portOptions, $scope.AttributeGroups, $scope.productAttributeValues, $scope.localAccessComponentId, $scope.allComponentsToOptionPAVs, $scope.currentOptionGroupName);
			if((!_.isEmpty(result) || !_.isUndefined(result)) && result.lengh > 0){
				$scope.AttributeGroups = result.AttributeGroups;
				$scope.productAttributeValues = result.productAttributeValues;
			}
			
			if(!_.isUndefined(result) && !_.isNull(result) && !_.isUndefined($scope.currentOptionGroupName)){
				if($scope.currentOptionGroupName.toLowerCase() == 'Local Access'.toLowerCase() || $scope.currentOptionGroupName.toLowerCase() == 'Port Options'.toLowerCase()){
					ProductAttributeConfigDataService.checkPortOptionsReconfig(optionAttributes, portOptions, $scope.allComponentsToOptionPAVs);
				}
			}
        }
		
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		$scope.seatTypeExpressions = function(attributes){
			$scope.productAttributeValues = ProductAttributeConfigDataService.seatTypeExpressions($scope.AttributeGroups, $scope.productAttributeValues);
		}
		*/

        function getLocationZOrA(pav){
            if(_.has(pav, 'Location_Z__c'))
                zLoc = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'Location_Z__c');

            if(_.has(pav, 'Location_A__c'))
                aLoc = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'Location_A__c');
        }

        function setCGEAttributes () {
            var allLocations = ProductAttributeValueDataService.allLocations;
            $scope.AttributeGroups = ProductAttributeConfigDataService.getCGELocationsCheck($scope.AttributeGroups, allLocations);

            if(_.has($scope.productAttributeValues, 'Location_A__c')) {
                $scope.productAttributeValues['Location_A__c'] = aLoc;
            }
        }
		
		function setCGEAttributesGrouping () {						
            var allLocations = ProductAttributeValueDataService.allLocations;
            $scope.attrGroups = ProductAttributeConfigDataService.getCGELocationsCheck($scope.attrGroups, allLocations);
			
			if(_.has($scope.attrGroupsVals, 'Location_A__c'))
                var aLocGroup = ProductAttributeConfigDataService.getAttributeFromBundle($scope.attrGroupsVals, 'Location_A__c');

            if(_.has($scope.attrGroupsVals, 'Location_A__c')) {
                $scope.attrGroupsVals['Location_A__c'] = aLocGroup;
            }
        }

        function setBandWidthToUNIAttributes(){
            ProductAttributeConfigDataService.setBandWidthToUNIAttributes($scope.AttributeGroups, $scope.productAttributeValues);
        }
		
		function setDistanceToFiberFormula(){
            ProductAttributeConfigDataService.setDistanceToFiberFormula($scope.AttributeGroups, $scope.productAttributeValues);
        }

        function calculateGeography(){
            var allLocations = ProductAttributeValueDataService.allLocations;
            ProductAttributeConfigDataService.calculateGeography($scope.productAttributeValues, allLocations);
        }
		
		function updateLocationsInCache(pav){
            if(_.has(pav, 'Location_Z__c')){
                LineItemAttributeValueDataService.locationZ = pav['Location_Z__c'];
            }
            if(_.has(pav, 'Location_A__c')){
                LineItemAttributeValueDataService.locationA = pav['Location_A__c'];
            }
        }

        $scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', 'BaseService', 'BaseConfigService', 'RemoteService', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService', 'RemoteService', 'LineItemAttributeValueDataService', 'LineItemService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);