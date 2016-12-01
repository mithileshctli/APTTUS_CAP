(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService);
	LocationDataService.$inject = ['$q', '$log', 'BaseService', 'LocationCache', 'BaseConfigService', 'RemoteService', 'ProductDataService'];
	function LocationDataService($q, $log, BaseService, LocationCache, BaseConfigService, RemoteService, ProductDataService) {
		var service = this;
		var locations;
		var cqlLocations = {};

		var locationIdSet = [];
		var locIdtolocAvlsMap = {};
		var locIdtoOptionProductsMap = {};
		var availableOptionProducts = [];
		var bundleProduct = [];
		var bundleProductId = [];
		var forShowSRLocations = [];
		var liteToDetailProductsMap = [];

		service.selectedlpa = {};
		service.isRemotecallComplete = false;
		service.hasServicelocations = false;
		service.showServiceLocations = true;
		service.showLoc = true;
		service.selectedisCQL = false;

		service.zLocations = [];

		// location methods.
		service.gethasServicelocations = gethasServicelocations;
		service.getlocItems = getlocItems;
		service.getselectedlpa = getselectedlpa;
		service.setselectedlpa = setselectedlpa;
		service.getselectedlpaId = getselectedlpaId;
		service.getalllocationIdSet = getalllocationIdSet;
		service.getisRemotecallComplete = getisRemotecallComplete;
		service.getLocationAvailabilityforBundle = getLocationAvailabilityforBundle;
		service.getLocationAvailabilityforOption = getLocationAvailabilityforOption;
		service.getAvailableOptionProducts = getAvailableOptionProducts;
		service.getLocationAvailabilityMetroAccess = getLocationAvailabilityMetroAccess;
		service.checkLocationPattern = checkLocationPattern;
		service.getDisplayLocations = getDisplayLocations;
		service.specialCharsValidation = specialCharsValidation;
		service.initializeLiteToDetailProductsMap = initializeLiteToDetailProductsMap;
		service.getCQLLocs = getCQLLocs;
		service.addCQLtoSL = addCQLtoSL;
		service.allLocationsValidate = [];
		service.copySiteLocation = copySiteLocation;
		service.getCopySiteSelectedLocationData = getCopySiteSelectedLocationData;

		/*function getlocItems() {
		 if (LocationCache.isValid) {
		 var cachedLocations = LocationCache.getLocations();
		 // logTransaction(cachedLocations);
		 return $q.when(cachedLocations);
		 }

		 var locationRequest = {
		 productId: BaseConfigService.lineItem.bundleProdId
		 , opportunityId: BaseConfigService.opportunityId
		 };
		 var requestPromise = RemoteService.getServiceLocations(locationRequest);
		 BaseService.startprogress();// start progress bar.
		 return requestPromise.then(function(response){
		 LocationCache.initializeLocations(response.locations);
		 service.isRemotecallComplete = true;
		 BaseService.setLocationLoadComplete();
		 if(response.locations.length > 0)
		 {
		 service.hasServicelocations = true;
		 setalllocationIdSet(_.pluck(response.locations, 'Id'));
		 }

		 // logTransaction(response, categoryRequest);
		 var locationId = BaseConfigService.lineItem.serviceLocationId;
		 if(!_.isUndefined(locationId)
		 && !_.isNull(locationId))
		 {
		 setselectedlpa(_.findWhere(response.locations, {Id:locationId}));
		 }
		 return LocationCache.getLocations();
		 });
		 }*/
		 
		 function initializeLiteToDetailProductsMap(){
			if(_.isEmpty(liteToDetailProductsMap)){
				var requestPromise = RemoteService.getLiteToDetailProductsMap();
				BaseService.startprogress();
				return requestPromise.then(function(result){
					liteToDetailProductsMap = result;
				});				
			}
		}

		function getlocItems() {
			if (locations) {
				return $q.when(locations);
			}

			service.checkLocationPattern();
			var productId = BaseConfigService.lineItem.bundleProdId;
			var oppId = BaseConfigService.opportunityId;
			// chain the CQL call and location availability calls.
			var locationRequest = {
				productId		: productId,
				opportunityId	: oppId
			};
			_.each(liteToDetailProductsMap, function(liteToDetailProduct){
				_.each(liteToDetailProduct, function(lite){
					if(lite.Detail_Product_Id__c && lite.Lite_Product_Name__c == BaseConfigService.lineItem.bundleProdName)	
						locationRequest = { productId: lite.Detail_Product_Id__c,opportunityId: BaseConfigService.opportunityId };
				});					
			});
			
			var requestPromise = RemoteService.getServiceLocations(locationRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(locationresponse){
				var CQLrequestPromise = RemoteService.getCQLLocations(locationRequest);
				return CQLrequestPromise.then(function(cqlResponse){
					initializeLocations(locationresponse, cqlResponse);

					var locationAvailabiltyRequest = { servicelocationIdSet:locationIdSet
						,bundleprodId: BaseConfigService.lineItem.bundleProdId
					};

					// chain the locations call and location availability calls.
					requestPromise = RemoteService.getLocationAvailabilities(locationAvailabiltyRequest);

					return requestPromise.then(function(laresponse){
						initializelocationAvailabilities(laresponse);
						BaseService.setLocationLoadComplete();
						service.isRemotecallComplete = true;
						return locations;
					});
				});
			});
		}

		function checkLocationPattern(){
			bundleProductId.push(BaseConfigService.lineItem.bundleProdId);
			var productsRequest = {productIds : bundleProductId};
			var requestPromisePattern = RemoteService.getProducts(productsRequest);

			requestPromisePattern.then(function(response){
				bundleProduct = response;
				if(!_.isEmpty(bundleProduct)){
					var bundleProd = bundleProduct['products']
					if(_.has(bundleProd[0], 'Location_Pattern__c')){
						var getBundleProd = bundleProd[0];
						if(getBundleProd['Location_Pattern__c'].toLowerCase() != 'Bundle Level'.toLowerCase()){
							service.showServiceLocations = false;
						}
					}
				}
			});
		}

		function getDisplayLocations(){
			if(!_.isUndefined(service.showServiceLocations) && !_.isUndefined(service.gethasServicelocations)){
				if(!service.showServiceLocations)
					service.showLoc = false;
				if(service.showServiceLocations && !service.gethasServicelocations)
					service.showLoc = false;
			}
			service.hasServicelocations = service.showLoc;
			return service.showLoc;
		}

		function getLocationAvailabilityMetroAccess(locId){
			// find the location availability first Access Metro by locId if exists
			var accessMarket = '';
			if(_.has(locIdtolocAvlsMap, locId))
			{
				_.each(locIdtolocAvlsMap[locId], function(item){
					if(_.has(item, 'Access_Market__c') && item.Access_Market__c != null){
						accessMarket = item.Access_Market__c;
						return;
					}
				})
			}
			return accessMarket;
		}

		function initializeLocations(response, cqlResponse) {
			locations = response.locations;
			cqlLocations = cqlResponse.cqlLocations;
			locations = addCQLtoSL(locations);

			if(locations.length > 0)
			{
				service.hasServicelocations = true;
				setalllocationIdSet(_.pluck(locations, 'Id'));
			}
		}

		function initializelocationAvailabilities(response){
			_.each(response.locAvailabilities, function(la){
				var las = [];
				var locId = la.Service_Location__c ? la.Service_Location__c : la.Company_Qualified_Location__c;
				if(!la.Service_Location__c){
					console.log(111)
				}
				if(_.has(locIdtolocAvlsMap, locId))
				{
					las = locIdtolocAvlsMap[locId];
				}
				las.push(la);
				locIdtolocAvlsMap[locId] = las;

				// if option product exits then add them to locIdtoOptionProductsMap.
				if(_.has(la, 'Option_Product__c')){
					if(!_.isUndefined(la.Long_Local_Access_Speed__c)
						&& !_.isNull(la.Long_Local_Access_Speed__c)){
						var optionProd = la.Option_Product__c;
						var pIds = [];
						if(_.has(locIdtoOptionProductsMap, locId))
						{
							pIds = locIdtoOptionProductsMap[locId];
						}

						pIds.push(optionProd);
						locIdtoOptionProductsMap[locId] = pIds;
					}
				}
			});

			//set selected lpa after the location availability initialization.
			var locationId = BaseConfigService.lineItem.serviceLocationId;
			
			//added by David (Dato) Tsamalashvili - to support CQL selection as well.
			var cqlLocId = BaseConfigService.lineItem.companyQulaifiedLocId;
			if((_.isNull(locationId) || _.isUndefined(locationId)) && !_.isNull(cqlLocId) && !_.isUndefined(cqlLocId))
				locationId = cqlLocId;
			
			if(!_.isUndefined(locationId)
				&& !_.isNull(locationId))
			{
				setselectedlpa(_.findWhere(locations, {Id:locationId}));
			}
		}

		function getLocationAvailabilityforBundle(locId, productId){
			// find the location availability record where location matches with service location and productId matches with bundle product and option product = null
			var res = [];
			if(_.has(locIdtolocAvlsMap, locId))
			{
				_.each(_.where(locIdtolocAvlsMap[locId], {Bundle_Product__c: productId}),
					function(la){
						if(!_.has(la, 'Option_Product__c'))
							res.push(la);
					});
			}
			return res;
		}

		function getLocationAvailabilityforOption(locId, productId){
			// find the location availability record where location matches with service location and option product = productId
			var res = [];
			if(_.has(locIdtolocAvlsMap, locId))
			{
				res = _.where(locIdtolocAvlsMap[locId], {Option_Product__c: productId});
			}
			return res;
		}

		function setAvailableOptionProductsforLocation(locId){
			if(_.has(locIdtoOptionProductsMap, locId))
				availableOptionProducts = locIdtoOptionProductsMap[locId];
			else
				availableOptionProducts = [];
		}
		
				function copySiteLocation(selectedCopyLocIds, configId, bundleNumber){			
			var copySiteRequest = {
                    selectedLocIds:selectedCopyLocIds
                    , configId: configId
                    , bundleLineNumber: bundleNumber};
					
			var requestPromise = RemoteService.copySite(copySiteRequest);
			requestPromise.then(function(copySiteResult){
				console.log('a');
			});
		}
		
		function getCopySiteSelectedLocationData(prodId, configurationId, qproposalId, bundleLineNumber){			
			var selectedLOCDataRequest = {
                    productId: prodId
                    , configId: configurationId
					, proposalId: qproposalId
                    , bundleNumber: bundleLineNumber};
					
			var requestPromise = RemoteService.getSelectedLocationData(selectedLOCDataRequest);
			requestPromise.then(function(selLocDataResult){
				console.log('ainside');
			});
		}

		function getAvailableOptionProducts(){
			return availableOptionProducts;
		}

		function gethasServicelocations(){
			return service.hasServicelocations;
		}
		function setselectedlpa(selectedlpa) {
			service.selectedlpa = selectedlpa;
			setAvailableOptionProductsforLocation(getselectedlpaId());

			// create z-location list based on selected location.{all locations except selected location.}
			var cachedLocations = LocationCache.getLocations();
			service.zLocations = [];// clear previos zLocations on new location selection.
			_.each(cachedLocations, function(loc){
				if(!_.isUndefined(selectedlpa)
					&& loc.Id != selectedlpa.Id){
					service.zLocations.push(loc);
				}
			});
		}

		function getselectedlpa() {
			return service.selectedlpa;
		}

		function getselectedlpaId() {
			//added by David (Dato) Tsamalashvili & Gabriel Turkadze - to check location is SL or CQL
			if(_.isObject(service.selectedlpa)){
				if(service.selectedlpa.isCQL){
					service.selectedisCQL = true;
				}else{
					service.selectedisCQL = false;
				}					
			}
			
			return _.isObject(service.selectedlpa) ? service.selectedlpa.Id : '';
		}

		function setalllocationIdSet(locIds){
			locationIdSet = locIds;
		}

		function getalllocationIdSet(){
			return locationIdSet;
		}

		function getisRemotecallComplete(){
			return service.isRemotecallComplete;
		}
		/*function createlocationRequestDO(){
		 var request = [];
		 $log.log('argument count inside createlocationRequestDO is: '+arguments.length);
		 for (var argIndex = 0; argIndex < arguments.length; argIndex++) {
		 request.push(arguments[argIndex]);
		 }
		 return request;
		 }*/
		 
		function getCQLLocs(){
			var locationRequest = { productId: BaseConfigService.lineItem.bundleProdId
				,opportunityId: BaseConfigService.opportunityId
			};			
			var requestPromise = RemoteService.getCQLLocations(locationRequest);
			return requestPromise.then(function(cqlResponse){
				cqlLocations = cqlResponse.cqlLocations;
				if(cqlLocations.length > 0)
				{
					setalllocationIdSet(_.pluck(cqlLocations, 'Id'));
				}
			});
		}
		
		function addCQLtoSL(allLocItems){
			if(!_.isEmpty(allLocItems)){
				_.each(allLocItems, function(slItem){
					slItem.isCQL = false;
					slItem.locationType = 'SVC Loc';
				});
			}
			
			if(!_.isEmpty(cqlLocations) && !_.isUndefined(cqlLocations)){
				_.each(cqlLocations, function(cqlItem){
					if(cqlItem.CQL_Loc_Type__c.toLowerCase() != 'E-Line POP'){
						cqlItem.isCQL = true;
						cqlItem.locationType = cqlItem.CQL_Loc_Type__c;
						allLocItems.push(cqlItem);
					}					
				});
			}
			
			service.allLocationsValidate = allLocItems;
			
			return allLocItems;
		}
		 
		function specialCharsValidation(locItems){
			_.each(locItems, function(item){
				var locName = removeSpecialChars(item.Name);
				var address = item.Service_Address_Line_1__c ? item.Service_Address_Line_1__c : item.Address__c;
				var locServiceAddr = removeSpecialChars(address);
				item.Name = locName;
				item.Service_Address_Line_1__c = locServiceAddr;
			});
			
			return locItems;
		}
		
		function removeSpecialChars(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            //unescape: replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);           
            return changedItem;
        }
	}
})();