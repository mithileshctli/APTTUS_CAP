(function() {
	angular.module('APTPS_ngCPQ').service('LineItemAttributeValueDataService', LineItemAttributeValueDataService); 
	LineItemAttributeValueDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService','RemoteService'];
	function LineItemAttributeValueDataService($q, $log, BaseService, BaseConfigService, RemoteService) {
		var service = this;

		var bundleproductattributevalues = {};
		var lineItemIdToAttributesMap = {};
		
		service.isValid = false;
		service.getLineItemAttributeValues = getLineItemAttributeValues;
		service.setbundleproductattributevalues = setbundleproductattributevalues;
		service.getbundleproductattributevalues = getbundleproductattributevalues;
		service.getlineItemIdToAttributesValues = getlineItemIdToAttributesValues;
		service.mergeComponentPavsWithLineItemPavs = mergeComponentPavsWithLineItemPavs;
		service.locationZ = null;
		service.locationA = null;

		function getProductAttributeValues_bulk(){
			var productAttributeValueDataRequest = {cartId: BaseConfigService.cartId
													, lineNumber: BaseConfigService.lineItem.lineNumber};
			var requestPromise = RemoteService.getProductAttributeValueData(productAttributeValueDataRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializeLineItemAttributeValues(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAVLoadComplete();
				return lineItemIdToAttributesMap;
			});
		}

		function getLineItemAttributeValues(lineItemId){
			if(_.has(lineItemIdToAttributesMap, lineItemId) && !lineItemIdToAttributesMap[lineItemId].Id){
				service.isValid = false;
			}

			if(service.isValid == true)
			{
				if(!_.has(lineItemIdToAttributesMap, lineItemId))
					lineItemIdToAttributesMap[lineItemId] = {};
				return $q.when(lineItemIdToAttributesMap[lineItemId]);
			}

			return getProductAttributeValues_bulk().then(function(result){
				if(!_.has(lineItemIdToAttributesMap, lineItemId))
					lineItemIdToAttributesMap[lineItemId] = {};
				return lineItemIdToAttributesMap[lineItemId];
			})
		}

		function setbundleproductattributevalues(pav){
        	if(_.isEmpty(bundleproductattributevalues))
        	{
        		bundleproductattributevalues = pav;
        	}
        }

        function getbundleproductattributevalues(){
        	return bundleproductattributevalues;
        }

        function getlineItemIdToAttributesValues(){
			return lineItemIdToAttributesMap;
		}

		function initializeLineItemAttributeValues(response){


			service.isValid = true;
			_.each(response.pavWrapList, function(pavwrapper){
				// bundle pav if Apttus_Config2__OptionId__c is null.
				if(!_.has(pavwrapper.lineItem, 'Apttus_Config2__OptionId__c')
					|| _.isNull(pavwrapper.lineItem.Apttus_Config2__OptionId__c))
				{
					setbundleproductattributevalues(pavwrapper.pav);
				}// option line
				else{
					if(pavwrapper.pav.Id && !lineItemIdToAttributesMap[pavwrapper.lineItem.Id]){
						var pav2Values = [];
						if(!_.isEmpty(pavwrapper.pav) && _.has(pavwrapper.pav, 'ProductAttributeValueId1__r')){
							pav2Values = pavwrapper.pav['ProductAttributeValueId1__r'];

							_.each(pav2Values, function(item, key){
								if(key != 'Id' || key != 'ProductAttributeValueId__c'){
									pavwrapper.pav['ProductAttributeValueId1__r.'+key] = item;
								}

							})
						}
						lineItemIdToAttributesMap[pavwrapper.lineItem.Id] = pavwrapper.pav;
						
						if(!service.locationZ && _.has(pavwrapper.pav, 'Location_Z__c')){
						   service.locationZ = pavwrapper.pav['Location_Z__c'];
						}
						if(!service.locationA && _.has(pavwrapper.pav, 'Location_A__c')){
						   service.locationA = pavwrapper.pav['Location_A__c'];
						}
					}
					
					
				}
			})
		}

		function mergeComponentPavsWithLineItemPavs(lineItems, lineItemPAVs, optionPAVs){
			_.each(lineItemPAVs, function(lineItemPAV, lineItemId){
				if(!lineItemId || !lineItemPAV || lineItemId == "undefined" || _.isEmpty(lineItemPAV)){
					return;
				}

				var lineItem = lineItems[lineItemId];

				if(!lineItem){
					return;
				}

				var optionPAV = optionPAVs[lineItem.componentId];

				if(!optionPAV || optionPAV.Id){
					return;
				}

				_.each(optionPAV, function(value, key){
					lineItemPAV[key] = value;
				});

				delete optionPAVs[lineItem.componentId];
			});
		}
	}
})();