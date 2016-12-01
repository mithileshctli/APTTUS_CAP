/*
    This service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    angular.module('APTPS_ngCPQ').service('LineItemService', LineItemService); 
    LineItemService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'RemoteService', 'MessageService',
                                'LineItemCache', 'OptionGroupDataService', 'LineItemAttributeValueDataService', 'ProductAttributeValueDataService'];
    function LineItemService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService,
                             LineItemCache, OptionGroupDataService, LineItemAttributeValueDataService, ProductAttributeValueDataService) {
        var service = this;
        
        var currentSelectedLineItemBundle = {};
        var lineItemsToSave = {};
        var reRenderLineItems = false;
        var locationWasChanged = false;
        var lineItemsNames = [];
        var reloadOptionAttributes = {};

        /*var lineItemIdTOComponentId = {'))OKHHJASDADs': 'aaa'}

        optionAttr lineItemAttr

        wrapper : {lineItemId:asdasdasd, component, attr:{}}


        PAV = []

        var tempArray = [];
        for(lineItemId : lineItesAttr){
            lineItem = getLineItem(lineItemId)

            tempArray.push(lineItem.componentId);

            PAV.push({
                componentId: lineItem.componentId,
                lineItemId: lineItemId,
                attr: lineItesAttrs[lineItemId]
            })
        }

        for(componentId: componentPavs){
            if(!contains(tempArray)){
                PAV.push({
                    componentId: componentId,
                    lineItemId: null,
                    attr: componentPavs[componentId]
                })
            }
        }*/


        // option group methods.
        service.getLineItems = getLineItems;
        service.getLineItem = getLineItem;
        service.getCurrentSelectedLineItemBundle = getCurrentSelectedLineItemBundle;
        service.getReRenderLineItems = getReRenderLineItems;
        service.setReRenderLineItems = setReRenderLineItems; 
        service.setLineItemsToSave = setLineItemsToSave;
        service.getLineItemsToSave = getLineItemsToSave;
        service.getAllLineItems = getAllLineItems;
        service.getUNILineItems = getUNILineItems;
        service.locationWasChanged = locationWasChanged;
        service.checkUNIserviceLocations = checkUNIserviceLocations;
        service.setReloadOptionAttributes = setReloadOptionAttributes;
        service.getReloadOptionAttributes = getReloadOptionAttributes;
		service.isL3PP = isL3PP;
		service.updateLineItemCach = updateLineItemCach;

        function getLineItems(deferred) {
            if (!deferred) {
                deferred = $q.defer();
            }

            var lineItemRequest = {
                                       cartId       : BaseConfigService.cartId ,
                                       lineNumber   : BaseConfigService.lineItem.lineNumber
                                    };
            var requestPromise = RemoteService.getLineItems(lineItemRequest.cartId, lineItemRequest.lineNumber);
            requestPromise.then(function(response) {
                /*if(Object.keys(response).length == 1) {
                 deferred.resolve();
                 BaseService.setOptionGroupLoadComplete();
                 return deferred.promise;
                 }*/
                LineItemCache.initializeLineItems(response);

                validateBuildOutOption(response);
                validateLineIteAttributes(response);

                deferred.resolve();
                BaseService.setOptionGroupLoadComplete();
                return deferred.promise;
            });

            deferred.notify();
            return deferred.promise;
        }

        function getLineItem(parentBundleId) {
            if (!parentBundleId) parentBundleId = BaseConfigService.lineItem.primaryLineNumber;
            var cachedLineItems = LineItemCache.getLineItems();
            if (LineItemCache.isValid
                && _.has(cachedLineItems, parentBundleId)){
                setCurrentSelectedLineItemBundle(cachedLineItems[parentBundleId]);
                return $q.when(cachedLineItems[parentBundleId]);
            }

            return getLineItems().then(function(response){
                var cachedLineItems = LineItemCache.getLineItems();
                setCurrentSelectedLineItemBundle(cachedLineItems[parentBundleId]);
                return cachedLineItems[parentBundleId];
            })
        }

        function getAllLineItems(){
            return LineItemCache.getAllLineItems();
        }

        function getUNILineItems(){
            var allLineItems = LineItemCache.getAllLineItems();
            var uniLineItemNames = getUniLineItemNames();

            var uniLineItems = {};

            _.each(allLineItems, function(lineItem, lineItemKey){
                if(_.contains(uniLineItemNames, lineItem.optionName)){
                    uniLineItems[lineItemKey] = lineItem;
                }
            });

            return uniLineItems;
        }

        function getCurrentSelectedLineItemBundle(){
            return currentSelectedLineItemBundle;
        }

        function setCurrentSelectedLineItemBundle(result){
            currentSelectedLineItemBundle = result;
        }

        function setReRenderLineItems (val, forceRender) {
            reRenderLineItems = val;

            if(forceRender)
                LineItemCache.isValid = false;
        }

        function getReRenderLineItems () {
            return reRenderLineItems;
        }

        function setLineItemsToSave(pavs){
            lineItemsToSave = pavs;
        }

        function getLineItemsToSave(){
            return lineItemsToSave;
        }

       
		function validateBuildOutOption(lineItems){
            var buildOut = _.findWhere(lineItems, {optionName: 'Build Out'});

            var allGroups = OptionGroupDataService.getallOptionGroups();

            if(!allGroups)
                return;

            _.each(allGroups, function(topLevelGroups){
                _.each(topLevelGroups, function(group){
                    if(group.name.indexOf("UNI") > -1){
                        _.each(group.productOptionComponents, function(productOptionComponent){
                            if(productOptionComponent.productName == "Build Out"){
                                productOptionComponent.isselected = buildOut ? true : false;
                            }
                        });
                    }
                });
            });

            OptionGroupDataService.setrerenderHierarchy(true);
        }

        function validateLineIteAttributes(lineItems) {
            var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();
            var notLoadedAttributes = false;
            _.each(lineItems, function(lineItem){
                if(notLoadedAttributes) return;
                if(!_.has(lineItemsToOptionPAVMap, lineItem.lineItemId) && lineItem.hasAttributes)
                    notLoadedAttributes = true;

            });

            if(notLoadedAttributes){
                LineItemAttributeValueDataService.getLineItemAttributeValues().then(function(){
                    var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
                    var lineItemsAttributes = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();

                    LineItemAttributeValueDataService.mergeComponentPavsWithLineItemPavs(lineItems, lineItemsAttributes, allcomponentIdToOptionPAVMap);

                    if(service.currentSelectedLineItemId){
                        var lineItemsAttribute = lineItemsAttributes[service.currentSelectedLineItemId];

                        service.setReloadOptionAttributes(lineItemsAttribute);
                    }

                    if(service.currentOption && !service.currentOption.lineItem){
                        componentLineItems = lineItemsByComponentId(service.currentOption.componentId);

                        if(componentLineItems && componentLineItems.length > 0 && componentLineItems[0].lineItemId){
                            var lineItemsAttribute = lineItemsAttributes[componentLineItems[0].lineItemId];


                            service.setReloadOptionAttributes(lineItemsAttribute);
                        }
                    }
                });
            }
        }

        function lineItemsByComponentId(componentId){
            var lineItems = getAllLineItems();

            var componentLineItems = _.where(lineItems, {componentId: componentId});

            return componentLineItems;
        }

        function getUniLineItemNames(){
            if(!_.isEmpty(lineItemsNames)){
                return lineItemsNames;
            }

            var allGroups = OptionGroupDataService.getallOptionGroups();

            if(!allGroups)
                return lineItemsNames;

            _.each(allGroups, function(topLevelGroups){
                _.each(topLevelGroups, function(group){
                    if(group.name.indexOf("UNI") > -1){
                        if(!_.contains(lineItemsNames, group.name))
                            lineItemsNames.push(group.name);

                        _.each(group.productOptionComponents, function(productOptionComponent){
                            if(!_.contains(lineItemsNames, productOptionComponent.productName))
                                lineItemsNames.push(productOptionComponent.productName);
                        });
                    }
                });
            });

            return lineItemsNames;
        }

        function checkUNIserviceLocations(){
            var lineItems = getUNILineItems();

            //if(!lineItems){
			if(_.isEmpty(lineItems)){	
                return;
            }

            var lineItemsToOptionPAVMap = LineItemAttributeValueDataService.getlineItemIdToAttributesValues();

            var lineItemToSave = {};

            _.each(lineItems, function(lineItem){
                if(!lineItem.serviceLocationAddress){
                    var parentLineItem = _.findWhere(lineItems, {primaryLineNumber: lineItem.parentBundleNumber});

                    if(parentLineItem){
                        var PAV = lineItemsToOptionPAVMap[lineItem.lineItemId];
                        var parentPAV = lineItemsToOptionPAVMap[parentLineItem.lineItemId];

                        if(PAV && parentPAV) {
                            PAV['Location_A__c'] = parentPAV['Location_A__c'];
                            lineItemToSave[lineItem.lineItemId] = PAV;
                        }
                    }
                }
            });

            if(!_.isEmpty(lineItemToSave)){
                setLineItemsToSave(lineItemToSave);
            }
        }
		
        function setReloadOptionAttributes(obj){
            reloadOptionAttributes = obj;
        }

        function getReloadOptionAttributes(){
            return reloadOptionAttributes;
        }

		function isL3PP(){
            var bundleProductName = BaseConfigService.lineItem.bundleProdName;
            if(!bundleProductName)
                return false;
            if(bundleProductName.toLowerCase() != 'L3 IQ Networking Private Port'.toLowerCase())
                return false;
            return true;
        }
		
		function updateLineItemCach(){
			LineItemCache.isValid = false;
		}
    }
})();