/*
    Save of the option groups should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    'use strict';
    
    var BaseController;

    BaseController = function($scope, $q, $log, $timeout, $window, $dialogs, BaseService, SystemConstants,
                              BaseConfigService, MessageService, RemoteService, OptionGroupDataService, SaveConfigService, LineItemService, ProductAttributeValueDataService, LineItemAttributeValueDataService) {
        // all variable intializations.
        $scope.baseService = BaseService;
        //$scope.locationService = LocationDataService;
        //$scope.pricingMatrixService = PricingMatrixDataService;
        $scope.optionGroupService = OptionGroupDataService;
        //$scope.PAVService = ProductAttributeValueDataService;
        //$scope.PACService = ProductAttributeConfigDataService;
        $scope.ProgressBartinprogress = false;
        $scope.showOptionsTab = true;
        
        /*var productIdtoComponentMap = {};
        var productIdtoGroupMap = {};
        var allcomponentIdToOptionPAVMap = {};
        var pavFieldNametoDFRMap = {};
        var prodductIdtoattributegroupsMap = {};*/
        $scope.imagesbaseURL = SystemConstants.baseUrl+'/Images';
		
		$scope.approvalStage = '';
		$scope.designApprovalStatus = '';
		$scope.isBlankApprolStage = false;
		$scope.isBlankDesignStatus = false;
		$scope.approvalStage = _.isNull(BaseConfigService.proposal.approvalStage) ? null : BaseConfigService.proposal.approvalStage;
		$scope.designApprovalStatus = _.isNull(BaseConfigService.proposal.designApprovalStatus) ? null : BaseConfigService.proposal.designApprovalStatus;
		$scope.isLargeQuote = BaseConfigService.isLargeQuote;
		//$scope.configStatus = _.isNull(BaseConfigService.proposal.configStatus) ? null : BaseConfigService.proposal.configStatus;
		$scope.configurations = BaseConfigService.configurationInfo;
		$scope.lineOfBusiness = BaseConfigService.proposal.lineOfBusiness;
		$scope.isFinalized = false;
		
		if(!_.isUndefined($scope.approvalStage) && !_.isNull($scope.approvalStage)){
			$scope.isBlankApprolStage = true;
		}
		
		if(!_.isUndefined($scope.designApprovalStatus) && !_.isNull($scope.designApprovalStatus)){
			$scope.isBlankDesignStatus = true;		
		}
		
		if($scope.isBlankApprolStage && $scope.approvalStage.toLowerCase() == 'In Review'.toLowerCase()){
				BaseService.isCapReadOnly = true;
		}else if($scope.isBlankDesignStatus && $scope.designApprovalStatus.toLowerCase() == 'Approved'.toLowerCase()){
				BaseService.isCapReadOnly = true;
		}else{
			BaseService.isCapReadOnly = false;
		}
		
        $scope.$watch('baseService.getProgressBarInProgress()', function(newVal, oldVal){
            $scope.ProgressBartinprogress = newVal.status;
        });
        
        $scope.$watch('optionGroupService.showOptions', function(newVal, oldVal){
            if($scope.optionGroupService.showOptions == false){
                $scope.showOptionsTab= false;
            }
        });
		if(!_.isUndefined($scope.lineOfBusiness) && !_.isNull($scope.lineOfBusiness)){
			if($scope.lineOfBusiness.toLowerCase() == 'Hosting'.toLowerCase() && $scope.configurations.length == 2){
				var configStatuses = [];
				_.each($scope.configurations, function(item){
					configStatuses[item.Apttus_Config2__Status__c.toLowerCase()] = item.Apttus_Config2__Status__c.toLowerCase();
				});
				
				if(_.has(configStatuses, 'Finalized'.toLowerCase()) && _.has(configStatuses, 'New'.toLowerCase()))
					$scope.isFinalized = true;
			}
		}
		

        /*$scope.validateonsubmit = function(){
            MessageService.clearAll();
            // Validation 1 : Service location has to be selected.
            var res = true;
            var servicelocation = $scope.locationService.getselectedlpa();
            var hasLocations = $scope.locationService.gethasServicelocations();
            if(_.isEmpty(servicelocation)
                && hasLocations)
            {
                // alert('Please select service location to proceed.');
                MessageService.addMessage('danger', 'Please select location to Proceed.');
                res = false;
            }
            
            // Validation 2 : validate Min/Max options on option groups.
            var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
            var mainBundleProdId = BaseConfigService.lineItem.bundleProdId;
            var allcomponentIdToOptionPAVMap = $scope.PAVService.getoptionproductattributevalues();
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
                MessageService.addMessage('danger', 'Required Fields('+requiredFields.join(', ')+') on '+mainBundleProdName+' are missing.');
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
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent, optiongroup))
                            {
                                var componentId = productcomponent.componentId;
                                var productId = productcomponent.productId;

                                if(_.has(allcomponentIdToOptionPAVMap, componentId))
                                {
                                    var optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                    requiredFields = getMissingRequiredFields(productId, optionPAV);
                                    if(_.size(requiredFields) > 0)
                                    {
                                        MessageService.addMessage('danger', 'Required Fields('+requiredFields.join(', ')+') on '+productcomponent.productName+' are missing.');
                                        res = false;
                                    }    
                                }  
                            }
                        });
                    }
                })
            })
            return res;
        }*/

        $scope.launch = function(which){
            var dlg = null;
            switch(which){

                /*// Error Dialog
                case 'error':
                dlg = $dialogs.error('This is my error message');
                break;

                // Wait / Progress Dialog
                case 'wait':
                dlg = $dialogs.wait(msgs[i++],progress);
                fakeProgress();
                break;

                // Notify Dialog
                case 'notify':
                dlg = $dialogs.notify('Something Happened!','Something happened that I need to tell you.');
                break;*/

                // Abandon Confirm Dialog
                case 'confirmAbandon':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to abandon the current cart?');
                    dlg.result.then(function(btn){
                        $scope.Abandon();
                    },function(btn){
                        
                });
                break;

                // Remove Item Confirm Dialog
                case 'confirmRemoveItem':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to remove the current Line item?');
                    dlg.result.then(function(btn){
                        $scope.removeItemFromCart();
                    },function(btn){
                    
                });
                break;
            }; // end switch
        }; // end launch

        $scope.Abandon = function(){
            var cartId = BaseConfigService.cartId, quoteId = BaseConfigService.proposal.Id;
            var requestPromise = RemoteService.doAbandonCart(cartId, quoteId);
            return requestPromise.then(function(response){
                var URL = parsePagereference(response);
                if(!_.isNull(URL))
                    $window.location.href = URL;
            });
        }

        // [05/18/2016 - Jeff Rink (JPR) - introduced to support US57338]
        // handle switch to Configure Bundle tab
        // - invoked when the Configure Bundle tab is selected
        $scope.onSelectConfigureBundle = function(){
            // hide any open Option Attributes panel
            // - This clean up forces the user to re-open the Option Attributes panel after making changes to the parent bundle,
            //   which helps force re-rendering of the Option Attributes (which may change as a result of changes to the parent bundle)
            $scope.optionGroupService.setHideOptionAttributes(true);
        }

        $scope.removeItemFromCart = function(){
            //var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName, primaryLineNumber = BaseConfigService.lineItem.primaryLineNumber, bundleProdId = BaseConfigService.lineItem.bundleProdId;
            //var requestPromise = RemoteService.removeBundleLineItem(cartId, configRequestId, flowName, primaryLineNumber, bundleProdId);
            //var lineNumber_tobedeleted = BaseConfigService.lineItem.lineNumber, bundleProdId = BaseConfigService.lineItem.bundleProdId;
            var deleteLineItemFromCartRequestDO = getDeleteLineItemFromCartRequestDO();
            var requestPromise = RemoteService.deleteLineItemFromCart(deleteLineItemFromCartRequestDO);
            BaseService.startprogress();// start progress bar.
            return requestPromise.then(function(response){
                var URL = parsePagereference(response.ref);
                BaseService.completeprogress();
                if(!_.isNull(URL))
                    $window.location.href = URL;
            });
        }

        $scope.addMoreProducts = function(){
            // apply timeout if saveCall is in progress.
            $timeout(function() {
                SaveConfigService.saveinformation().then(function(response){
                    if(response == true)
                    {
                        var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                        var requestPromise = RemoteService.addMoreProducts(cartId, configRequestId, flowName);
                        return requestPromise.then(function(response){
                            var URL = parsePagereference(response);
                            if(!_.isNull(URL))
                                $window.location.href = URL;
                        });
                    }
                })
            }, gettimeinmillis());
        }

        $scope.GoToPricing = function(){
             // apply timeout if saveCall is in progress.
			if(BaseConfigService.isLargeQuote){
				$timeout(function() {                 
					 MessageService.clearAll();
					 
					 var saveInformation = SaveConfigService.saveinformation();                 
                
				}, gettimeinmillis());
			}else{
				var baseProduct = BaseConfigService.bundleLineItemInfo.productName;
                var primaryBunleLineNumber = BaseConfigService.bundleLineItemInfo.lineItem.Apttus_Config2__LineNumber__c;
                var proposalId = BaseConfigService.proposal.Id;
                MessageService.clearAll();
                 
                // Check UNI's line items service locations
                //LineItemService.checkUNIserviceLocations();
                 
                var validateUNIs = SaveConfigService.validateUNIs(baseProduct);
                var saveInformation = SaveConfigService.saveinformation();
                 
                $q.all([validateUNIs, saveInformation]).then(function(response){
                    var uniPromise = response[0];
                    var savePromise = response[1];
                    if(uniPromise && savePromise){
                        var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                        var requestPromise = RemoteService.goToPricing(cartId, configRequestId, flowName, primaryBunleLineNumber, proposalId);
                        return requestPromise.then(function(response){
                            var URL = parsePagereference(response);
                            if(!_.isNull(URL))
                                $window.location.href = URL;
                        });
                    }
                });
			}
        }

        /*@Validate
            Save Config and run constraint rules.
        */
        $scope.Validate = function(){
			//$scope.validationStartProcess();
            SaveConfigService.saveinformation().then(function(response){
                if(response == true)
                {
                    
                }
            })	
			//$scope.validationEndProcess();
        }

        $scope.cloneUNIOptions = function(lineItem, freezePage){
            var cartId = BaseConfigService.cartId;
            BaseService.startprogress(freezePage);// start progress bar.
            var requestPromise = RemoteService.cloneUNIOptions(cartId, [lineItem.primaryLineNumber]);
            return requestPromise.then(function(response){
                LineItemService.getLineItems().then(function(response){
                    LineItemAttributeValueDataService.isValid = false;
                    LineItemService.setReRenderLineItems(true);
                    LineItemService.getReRenderLineItems();
                    BaseService.completeprogress();
                });
            });
        }

        $scope.removeBundle = function(lineItem, freezePage, isEvc){
            var cartId = BaseConfigService.cartId;
            BaseService.startprogress(freezePage);// start progress bar.
			if(isEvc){
				var requestPromise = RemoteService.removeOptionCustom(cartId, lineItem.primaryLineNumber);
				return requestPromise.then(function(response){
					LineItemService.getLineItems().then(function(response){
						LineItemService.setReRenderLineItems(true);
						LineItemService.getReRenderLineItems();
						BaseService.completeprogress();
					});
				});
			}else{
				var requestPromise = RemoteService.removeBundle(cartId, [lineItem.primaryLineNumber]);
				return requestPromise.then(function(response){
					LineItemService.getLineItems().then(function(response){
						LineItemService.setReRenderLineItems(true);
						LineItemService.getReRenderLineItems();
						BaseService.completeprogress();
					});
				});
			}
			
        }

        $scope.getLineItems = function(optionGroup){
            var cartId = BaseConfigService.cartId;

            var requestPromise = RemoteService.getLineItems(cartId, 1);
            return requestPromise.then(function(response){
                console.log(response);
            });
        }

        $scope.saveLineItemCustom = function(lineItem){
            var deferred = $q.defer();

            var pcomponent = lineItem.pcomponent;

            pcomponent.isselected = true;
            pcomponent = _.omit(pcomponent, ['$$hashKey', 'isDisabled', 'isLocationZ', 'product', 'sensitiveHelpFieldsMap']);

            var cartId = BaseConfigService.cartId;
            var bundleLine = BaseConfigService.lineItem;

            var lineNumber = bundleLine.lineNumber;
            var parentBundleLineItemId = LineItemService.currentSelectedLineNumber;
            BaseService.startprogress();// start progress bar.

            // remote call to save Line Item.
            var saveRequest = {
                cartId:cartId,
                pcomponent: pcomponent,
                lineNumber: lineNumber,
                parentBundleLineItemId: parentBundleLineItemId
            };
            var requestPromise = RemoteService.saveLineItemCustom(saveRequest);
            requestPromise.then(function(saveresult){
                if(saveresult.isSuccess)// if save call is successfull.
                {
                    LineItemService.setReRenderLineItems(true, true);
                    LineItemService.getReRenderLineItems();

                    BaseService.completeprogress();

                }// end of saveresult.isSuccess check.
                else{
                    MessageService.addMessage('danger', saveresult.messageWrapList);
                    BaseService.completeprogress();
                    // $scope.safeApply();
                    deferred.reject('Save Failed.');
                    return deferred.promise;
                }
            })// end of saveQuoteConfig remote call.

            return deferred.promise;
        };
        
        function getDeleteLineItemFromCartRequestDO(){
            var requestDO = {
                "cartHeader":BaseConfigService.cartHeader,
                "lineItemNumber_tobedeleted":BaseConfigService.lineItem.lineNumber,
                "currentLineNumber":BaseConfigService.lineItem.lineNumber,
                "bundleProdId":BaseConfigService.lineItem.bundleProdId
            };
            return requestDO;
        }
        
        $scope.launchCopySite = function(){
            var dlg = null;
            var caseHelp = 'notify';
            var copySiteViewURL = SystemConstants.baseUrl+'/Templates/CopySiteView.html';
            
            dlg = $dialogs.create(copySiteViewURL,'CopySiteController','',{key: false,back: 'false'});
            dlg.result.then(function(data){
                //$scope.data = data;
            });
        };

        /*$scope.saveinformation = function(){
            var deferred = $q.defer();
            if($scope.validateonsubmit())
            {
                // if save call is in progress then do not proceed.
                if($scope.baseService.getisSaveCallinProgress() == true)
                {
                    deferred.reject('Save call in progress.');
                    return deferred.promise;
                }
                else// set the savecallprogress so next request will be denied.
                   $scope.baseService.setisSaveCallinProgress();
                
                $scope.baseService.startprogress();// start progress bar.

                // selected service location Id.
                var servicelocationId = $scope.locationService.getselectedlpaId();
                
                // get the firstPMRecordId from PricingMatrixDataService and set PriceMatrixEntry__c on bundle.
                var pricingmatrixId = $scope.pricingMatrixService.getfirstPMRecordId();
                
                // prepare the bundleLine item to be passed to Remote actions.
                var bundleLine = BaseConfigService.lineItem;
                var cartID = BaseConfigService.cartId;
                var bundleLineId = bundleLine.Id;
                var mainBundleProdId = BaseConfigService.lineItem.bundleProdId;
                var bundleLineNumber = bundleLine.lineNumber;
                var bundlePrimaryNumber = bundleLine.primaryLineNumber;

                var bundleLineItem ={Id:bundleLineId, 
                                        Apttus_Config2__ConfigurationId__c:cartID,
                                        Service_Location__c:servicelocationId,
                                        Apttus_Config2__ProductId__c:mainBundleProdId, 
                                        Apttus_Config2__LineNumber__c:parseInt(bundleLineNumber),
                                        PriceMatrixEntry__c:pricingmatrixId, 
                                        Apttus_Config2__PrimaryLineNumber__c:parseInt(bundlePrimaryNumber)};

                var productcomponentstobeUpserted = [];
                var componentIdtoPAVMap = {};
                var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
                var allcomponentIdToOptionPAVMap = $scope.PAVService.getoptionproductattributevalues();
                
                allOptionGroups = locationValidation(allOptionGroups, allcomponentIdToOptionPAVMap, mainBundleProdId, productIdtoComponentMap, productIdtoGroupMap, servicelocationId);
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
                                if(isProdSelected(productcomponent,optiongroup))
                                {
                                    productcomponent.isselected = true;
                                    productcomponent = _.omit(productcomponent, ['$$hashKey', 'isDisabled', 'isLocationZ']);
                                    
                                    var componentId = productcomponent.componentId;
                                    var otherSelected = false;
                                    if(_.has(allcomponentIdToOptionPAVMap, componentId))
                                    {
                                        var optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                        // Other picklist is selected then set OtherSelected to true.
                                        if(!_.isUndefined(_.findKey(optionPAV, function(value, pavField){return pavField.endsWith('Other');}))){
                                            otherSelected = true;
                                        }
                                        // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                                        componentIdtoPAVMap[componentId] = formatPAVBeforeSave(optionPAV);
                                    }
                                    productcomponent.customFlag = otherSelected;
                                    productcomponentstobeUpserted.push(productcomponent);
                                }
                            })
                        }// end of if - only if parent component is selected.
                    })
                })
                
                // add bundleLine PAV.
                var otherSelected_bundle = false;
                var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
                // Other picklist is selected then set OtherSelected to true.
                if(!_.isUndefined(_.findKey(bundlePAV, function(value, pavField){return pavField.endsWith('Other');}))){
                    otherSelected_bundle = true;
                }

                // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                componentIdtoPAVMap[mainBundleProdId] = formatPAVBeforeSave(bundlePAV);
                bundleLineItem = _.extend(bundleLineItem, {Custom__c:otherSelected_bundle});

                // remote call to save Quote Config.
                var saveRequest = {
                                    bundleLineItem:bundleLineItem
                                    , productOptionComponents: productcomponentstobeUpserted
                                    , componentIdtoPAVMap: componentIdtoPAVMap};
                var requestPromise = RemoteService.saveQuoteConfig(saveRequest);
                requestPromise.then(function(saveresult){
                    if(saveresult.isSuccess)// if save call is successfull.
                    {
                        $scope.optionGroupService.runConstraintRules().then(function(constraintsResult){
                            if(constraintsResult.numRulesApplied > 0)
                            {
                                // render Hierarchy Once Constraint rules are run.
                                $scope.optionGroupService.setrerenderHierarchy(true);
                                deferred.reject('Constraint rules Error.');    
                            }
                            else{
                                // resolve the save promise after constraint remote call is complete with no constraint actions.
                                deferred.resolve(true);
                            }
                            $scope.baseService.completeSaveProgress();// end progress bar.
                        })
                    }// end of saveresult.isSuccess check.
                    else{
                        MessageService.addMessage('danger', 'Save call is Failing: '+saveresult.errorMessage);
                        $scope.baseService.completeSaveProgress();// end progress bar.
                        $scope.safeApply();
                        deferred.reject('Save Failed.');
                        return deferred.promise;
                    }
                })// end of saveQuoteConfig remote call.
            }// end of validateonsubmit.
            else{
                // $scope.baseService.completeprogress();// end progress bar.
                deferred.reject('Validations Failed.');
                return deferred.promise;
            }	
            return deferred.promise;
        }
        
        $scope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };
		
		function locationValidation(allOptionGroups, optionPAVs, mainBundleProdId, productIdtoComponentMap, productIdtoGroupMap, servicelocationId){			
			var locZZ = null;
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
									
									if(_.has(optionPAVs, componentId)){										
										var currentOptionAttributes = optionPAVs[componentId];
											if(_.has(currentOptionAttributes, 'Location_Z__c')){
												locZZ = currentOptionAttributes['Location_Z__c'];
											}
									}

									if(locZZ != null && isLocz){
										productcomponent.serviceLocationId = locZZ;
									}else{
										productcomponent.serviceLocationId  = servicelocationId;
									}									
								}
							});
						}
				});
			});
			
			
			return allOptionGroups;
		}
        
        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected 
                 && optiongroup.ischeckbox)
                    || (productcomponent.productId == optiongroup.selectedproduct 
                        && !optiongroup.ischeckbox))
            return true;
            return false;
        }

        function formatPAVBeforeSave(pav){
            //// set the other picklist to original fields.
            pav = _.omit(pav, 'isDefaultLoadComplete');
            _.each(_.filter(_.keys(pav), function(pavField){
                            return pavField.endsWith('Other');
                        }), 
                function(key){
                    var keywithnoother = key.slice( 0, key.lastIndexOf( "Other" ) );
                    if(pav[keywithnoother] == 'Other')    
                        pav[keywithnoother] = pav[key]+'**';
                    pav = _.omit(pav, key);
            })
            
            // remove Otherdb field.
            return pav;
        }*/

        function parsePagereference(pgReference){
            var res = null;
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                res = _.unescape(pgReference);
            return res;
        };
		
		/*$scope.validationStartProcess =  function(){
			document.getElementById("onBundleAttrValidation").className = "onValidation";
			document.getElementById("onOptionValidation").className = "onValidation";
			document.getElementById("onOptionAttrValidation").className = "onOptionAttrValidation";
		}
		
		$scope.validationEndProcess = function(){
			document.getElementById("onBundleAttrValidation").className = "afterValidation";
			document.getElementById("onOptionValidation").className = "afterValidation";
			document.getElementById("onOptionAttrValidation").className = "afterValidation";
		}*/

        function gettimeinmillis(){
            if($scope.baseService.getisSaveCallinProgress() == true)
                return 5000;
            else
                return 100;
        }

        /*function getMissingRequiredFields(productId, pav){
            var res = [];
            if(_.has(prodductIdtoattributegroupsMap, productId))
            {
                _.each(prodductIdtoattributegroupsMap[productId], function(attributeGroup){
                    _.each(attributeGroup.productAtributes, function(prodAttribute){
                        // if attribute is required and not selected then add the field.
                        var attributeapi = prodAttribute.fieldName;
                        if(!_.isUndefined(attributeapi)
                            && !prodAttribute.isHidden 
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
        }*/
	};
    
    BaseController.$inject = ['$scope', '$q', '$log', '$timeout', '$window', '$dialogs', 'BaseService', 'SystemConstants', 'BaseConfigService',
        'MessageService', 'RemoteService', 'OptionGroupDataService', 'SaveConfigService', 'LineItemService', 'ProductAttributeValueDataService', 'LineItemAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);