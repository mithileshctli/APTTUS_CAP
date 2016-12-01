(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, $dialogs, SystemConstants, BaseService, BaseConfigService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService, OptionGroupDataService, SensitiveHelpDataService,ReusableUniSelectorDataService, MessageService) {
		var aLoc1 = '';
        var aLoc2 = '';
        var aLoc3 = '';
        var aLoc4 = '';
        var aLoc5 = '';
        
        // all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.PAConfigService = ProductAttributeConfigDataService;
            $scope.OptionGrpService = OptionGroupDataService;

            $scope.constants = SystemConstants;
            $scope.baseConfig = BaseConfigService;
            
            $scope.AttributeGroups = [];// attribute config groups for main bundle.
            $scope.pavfieldDescribeMap = {};
            $scope.productAttributeValues = {};
            $scope.remotecallinitiated = false;
			
			//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
			//$scope.SeatCountForBundle = 0;
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && $scope.remotecallinitiated == false)
            {   
                $scope.retrieveproductattributeGroupData();
            }    
        });

        $scope.$watch('locationService.getisRemotecallComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && $scope.remotecallinitiated == false)
            {   
                $scope.retrieveproductattributeGroupData();
            }    
        });
		
         $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true)
            {
                $scope.locationService.getlocItems().then(function(result){
                    $scope.getAllLocations = result;
                    // This is for UNI Line Item locations
                    ProductAttributeValueDataService.allLocations = $scope.getAllLocations;
                });
            }    
        });
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		$scope.$watch('OptionGrpService.seatTypeCount', function(newVal, oldVal){
			$scope.SeatCountForBundle = $scope.OptionGrpService.seatTypeCount;
			//if($scope.productAttributeValues.hasOwnProperty('Total_Seats__c') && $scope.SeatCountForBundle > 0){
			if($scope.SeatCountForBundle != 'undefined' || $scope.SeatCountForBundle != null){
				$scope.productAttributeValues['Total_Seats__c'] = $scope.SeatCountForBundle;
			}
            if($scope.remotecallinitiated == false)
            {
                $scope.retrieveproductattributeGroupData();
            }
        });
		*/
        
        // Note : this method should be invoked only when remotecallinitiated flag is false;
        $scope.retrieveproductattributeGroupData = function(){
            // run only if location remote call is complete.
            if($scope.locationService.getisRemotecallComplete() == true)
            {
                $scope.remotecallinitiated = true;
                var alllocationIdSet = $scope.locationService.getalllocationIdSet();
                var selectedlocationId = $scope.locationService.getselectedlpaId();
                var bundleProductId = BaseConfigService.lineItem.bundleProdId;
                PAVObjConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
                    if(_.isEmpty($scope.pavfieldDescribeMap))
                    {
                        $scope.pavfieldDescribeMap = fieldDescribeMap;
                    }
                    $scope.PAConfigService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                        $scope.PAVService.getProductAttributeValues(bundleProductId).then(function(result)
                        {
                            $scope.PAConfigService.setBundleAttributeFields(attributeconfigresult);
                            var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
                            renderBundleAttributes(attributeconfigresult, bundlePAV);
                            $scope.remotecallinitiated = false;
                        })
                    })
                })
            }
        }
		
		$scope.largeQuoteMessages = function(){
			if(BaseConfigService.proposal.isLargeQuote){
				if(_.has(BaseConfigService.lineItem, 'errorMessage') && !_.has(BaseConfigService.lineItem, 'errorMessageType')){
					if(!_.isEmpty(BaseConfigService.lineItem.errorMessage) && !_.isUndefined(BaseConfigService.lineItem.errorMessage)){
						var values = BaseConfigService.lineItem.errorMessage.split(',//');
						_.each(values, function(msg){
							MessageService.addMessage('Warning', msg);
						});
					}						
				}else if(_.has(BaseConfigService.lineItem, 'errorMessage') && _.has(BaseConfigService.lineItem, 'errorMessageType')){
					if(!_.isEmpty(BaseConfigService.lineItem.errorMessage) && !_.isUndefined(BaseConfigService.lineItem.errorMessage)){
						var values = BaseConfigService.lineItem.errorMessage.split(',//');
						_.each(values, function(msg){
							MessageService.addMessage(BaseConfigService.lineItem.errorMessageType, msg);
						});	
					}
				}
			}
		}
		
		function renderBundleAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
			getLocations(pav);
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;
			var bundleLineItemStatus = BaseConfigService.lineItem.bundleLineItemStatus;			
			$scope.isCapReadOnly = BaseService.isCapReadOnly;
			
			$scope.largeQuoteMessages();
			
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;
			
			//added by David (Dato) Tsamalashvili - 10/19/2016 - to remove space at the begining of value.
			ProductAttributeConfigDataService.removeExtraSpace($scope.AttributeGroups, $scope.productAttributeValues);
			
            PAVObjConfigService.configurePAVFields($scope.AttributeGroups, $scope.productAttributeValues);
            $scope.PAVService.setbundleproductattributevalues($scope.productAttributeValues);
			ProductAttributeConfigDataService.getReqiredDynamicAttributes($scope.AttributeGroups);
            //Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
			//$scope.totalSeatCheck();
            //added by David Tsamalashvili - 04/01/2016 - To Set Network Z Country for Exchange Connectivity 1.0.
            ProductAttributeConfigDataService.setNewtorkZCountry($scope.locationService.getselectedlpa(), bundleProductName, $scope.AttributeGroups, $scope.productAttributeValues);
			ProductAttributeConfigDataService.setVantiveSiteId($scope.locationService.getselectedlpa(), $scope.AttributeGroups, $scope.productAttributeValues);

			$scope.bundlePortOptions();
			$scope.specialCharsCheck();	
			$scope.ZoneValidation();	
			ProductAttributeConfigDataService.unifiedStorageValidation($scope.AttributeGroups, $scope.productAttributeValues, bundleProductName);
			ProductAttributeConfigDataService.vchsValidation($scope.AttributeGroups, $scope.productAttributeValues, bundleLineItemStatus, bundleProductName);
			
			ProductAttributeConfigDataService.legacyValidation($scope.AttributeGroups, bundleLineItemStatus);
			// Mithilesh : to support conditionally rendering CCID Attributes per US66453
             ProductAttributeConfigDataService.setCCID($scope.AttributeGroups, bundleProductName, $scope.productAttributeValues);
			
			//added by David (Dato) Tsamalashvili - DE 12843 - 09/01/2016
			$scope.AttributeGroups = ProductAttributeConfigDataService.removeSpecialCharsPAVChange($scope.AttributeGroups);
			
			//MaxNetwork
			ProductAttributeConfigDataService.setBandwidthLimit(pav,attrgroups,bundleProductName); 
            // US79959
            setLocations(pav);
			
			//Added by David (Dato) Tsamalashvili - DE15266 - 10/24/2016
			ProductAttributeConfigDataService.liteServiceTerm($scope.AttributeGroups, BaseConfigService.proposal.quoteSourceCode);
            
            $scope.safeApply();   
        }

        function getLocations(pav) {
            if(_.has(pav, 'Location_A__c'))
                aLoc1 = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'Location_A__c');
            if(_.has(pav, 'ProductAttributeValueId1__r.Location_A2__c'))
                aLoc2 = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'ProductAttributeValueId1__r.Location_A2__c');
            if(_.has(pav, 'ProductAttributeValueId1__r.Location_A3__c'))
                aLoc3 = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'ProductAttributeValueId1__r.Location_A3__c');
            if(_.has(pav, 'ProductAttributeValueId1__r.Location_A4__c'))
                aLoc4 = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'ProductAttributeValueId1__r.Location_A4__c');
            if(_.has(pav, 'ProductAttributeValueId1__r.Location_A5__c'))
                aLoc5 = ProductAttributeConfigDataService.getAttributeFromBundle(pav, 'ProductAttributeValueId1__r.Location_A5__c');
        }
        
         // US79959
        function setLocations(){
            var allLocations = ProductAttributeValueDataService.allLocations;
            $scope.AttributeGroups = ProductAttributeConfigDataService.getCGELocationsCheck($scope.AttributeGroups, allLocations);

            if(_.has($scope.productAttributeValues, 'Location_A__c')) 
                $scope.productAttributeValues['Location_A__c'] = aLoc1;
            
             if(_.has($scope.productAttributeValues, 'ProductAttributeValueId1__r.Location_A2__c'))
                 $scope.productAttributeValues['ProductAttributeValueId1__r.Location_A2__c'] = aLoc2;
             
             if(_.has($scope.productAttributeValues, 'ProductAttributeValueId1__r.Location_A3__c'))
                 $scope.productAttributeValues['ProductAttributeValueId1__r.Location_A3__c'] = aLoc3;
             
             if(_.has($scope.productAttributeValues, 'ProductAttributeValueId1__r.Location_A4__c'))
                 $scope.productAttributeValues['ProductAttributeValueId1__r.Location_A4__c'] = aLoc4;
             
             if(_.has($scope.productAttributeValues, 'ProductAttributeValueId1__r.Location_A5__c'))
                 $scope.productAttributeValues['ProductAttributeValueId1__r.Location_A5__c'] = aLoc5;
        }
        
		$scope.ZoneValidation = function(){
			ProductAttributeConfigDataService.validateZoneAttributes($scope.AttributeGroups, $scope.productAttributeValues);
			// console.log('Zone Validation');
		}
        
        $scope.PAVAttributeChange = function(fieldName){
            // set bundle attribute change for option attribute cascade
            ProductAttributeValueDataService.setbundleAttributeChanged(true);
        }
		
		$scope.bundlePortOptions = function(){
			var bundlePortOptions = PAVObjConfigService.getBundlePortOptions();
			
			var result = ProductAttributeConfigDataService.bundleAttributeChangeConstraint($scope.AttributeGroups, $scope.productAttributeValues, bundlePortOptions);
			if(!_.isEmpty(result) || !_.isUndefined(result)){
				$scope.AttributeGroups = result.AttributeGroups;
				$scope.productAttributeValues = result.pav;
			}
			console.log('Result for Bundle Port Options');
		}
        
        $scope.PAVPicklistChange = function(fieldName, oldValue){

			if(!fieldName.endsWith('Other')){
            	var otField = fieldName+'Other';
            	if(_.has($scope.productAttributeValues, otField)){
            		$scope.productAttributeValues = _.omit($scope.productAttributeValues, otField);
            	}
            }

            renderBundleAttributes($scope.AttributeGroups, $scope.productAttributeValues);
			
			_.each($scope.AttributeGroups, function(attrGroups){
				var groupName = $scope.removeSpecialChars(attrGroups.groupName);
				attrGroups.groupName = groupName;
				_.each(attrGroups.productAtributes, function(attribs){
					_.each(attribs.picklistValues, function(item){
						var pickLabel = '';
						var pickValue = '';
						if(item.label != null){
							pickLabel = $scope.removeSpecialChars(item.label);
						}
						if(item.value != null){
							pickValue = $scope.removeSpecialChars(item.value);
						}							
							
						item.label = pickLabel;
						item.value = pickValue;
					});
				});
			});
			var newValue = $scope.productAttributeValues[fieldName];
			ProductAttributeConfigDataService.validateUNI(fieldName, oldValue, newValue);

            // set bundle attribute change for option attribute cascade
            ProductAttributeValueDataService.setbundleAttributeChanged(true);
        }
		
		//Set Total Seat Count When quantity is changed on Option level.
		//Commented by David (Dato) Tsamalashvili - March 18 2016, DE4908
		/*
		$scope.totalSeatCheck = function(){
			_.each($scope.AttributeGroups,  function(attributeGrp){
				_.each(attributeGrp.productAtributes, function(attribute){
					if(attribute.fieldName == 'Total_Seats__c'){
						attribute.isReadOnly = true;
					}
				});
			});
		}
		*/
		
		$scope.specialCharsCheck = function(){
			if($scope.AttributeGroups != null || $scope.AttributeGroups != 'undefined'){
				_.each($scope.AttributeGroups, function(groups){
					_.each(groups.productAtributes, function(attributes){
						_.each(attributes.picklistValues, function(pav){
							if(pav.value != null){
								pav.label = $scope.removeSpecialChars(pav.label);
								pav.value = $scope.removeSpecialChars(pav.value);
							}
						});
					});
				});
			}
			
			_.each($scope.productAttributeValues, function(key, value){
				if(angular.isString(key)){					
						var newValue = $scope.removeSpecialChars(key);
						//value = newValue;
						//console.log('Key IS  - ' + value);
						$scope.productAttributeValues[value] = newValue;
				}				
			});
			
		}
		
		$scope.removeSpecialChars = function characterRepaceDependent(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            //unescape: replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);           
            return changedItem;
        }

        $scope.launchHelp = function(componentForDialog){
            var dlg = null;
            var caseHelp = 'notify';
            var sensitiveViewURL = SystemConstants.baseUrl+'/Templates/SensitiveHelpView.html';
            SensitiveHelpDataService.currentOptionComponent = componentForDialog;
            switch(caseHelp){
                // Sensitive Help for Options
                case 'notify':                  
                    dlg = $dialogs.create(sensitiveViewURL,'SensitiveHelpController','',{key: false,back: 'static'});
                    dlg.result.then(function(btn){
                        
                    },function(btn){
                        
                });
                break;
            };
        };
		
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

        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', '$dialogs', 'SystemConstants', 'BaseService', 'BaseConfigService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService', 'OptionGroupDataService', 'SensitiveHelpDataService', 'ReusableUniSelectorDataService', 'MessageService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);