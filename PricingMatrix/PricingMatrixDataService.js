(function() {
	angular.module('APTPS_ngCPQ').service('PricingMatrixDataService', PricingMatrixDataService); 
	PricingMatrixDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'PAVObjConfigService', 'RemoteService'];
	function PricingMatrixDataService($q, $log, BaseService, BaseConfigService, PAVObjConfigService, RemoteService) {
		var service = this;

		var pricingMatrixSearchResult = {};
		var isValid = false;
		var firstPMRecordId = null;
		var hasPricingMatrix = false;
		
		// Pricing Methods.
		service.getPricingMatrix = getPricingMatrix;
		service.setfirstPricingMatrixRecord = setfirstPricingMatrixRecord;
		service.getfirstPMRecordId  = getfirstPMRecordId;
		service.gethasPricingMatrix = gethasPricingMatrix;
		
		function getPricingMatrix() {
			if (isValid) {
				return $q.when(pricingMatrixSearchResult);
			}
			
			var pricingMatrixRequest = {productId: BaseConfigService.lineItem.bundleProdId};
			var requestPromise = RemoteService.getPricingMatrixData(pricingMatrixRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializePricingMatrix(response);
				BaseService.setPricingMatrixLoadComplete();
				return pricingMatrixSearchResult;
			});
		}

		function initializePricingMatrix(response){
			var dimensions = [];
			var PAVlines = [];
			var pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
			
			var priceMatrices = response.priceMatrices;
			if(priceMatrices.length > 0)
			{
				hasPricingMatrix = true;
			}
			_.each(priceMatrices, function(pm){
				var dimension1 = _.has(pm, 'Apttus_Config2__Dimension1Id__r') ? pm.Apttus_Config2__Dimension1Id__r.Apttus_Config2__Datasource__c : null;
				var dimension2 = _.has(pm, 'Apttus_Config2__Dimension2Id__r') ? pm.Apttus_Config2__Dimension2Id__r.Apttus_Config2__Datasource__c : null;
				var dimension3 = _.has(pm, 'Apttus_Config2__Dimension3Id__r') ? pm.Apttus_Config2__Dimension3Id__r.Apttus_Config2__Datasource__c : null;
				var dimension4 = _.has(pm, 'Apttus_Config2__Dimension4Id__r') ? pm.Apttus_Config2__Dimension4Id__r.Apttus_Config2__Datasource__c : null; 
				var dimension5 = _.has(pm, 'Apttus_Config2__Dimension5Id__r') ? pm.Apttus_Config2__Dimension5Id__r.Apttus_Config2__Datasource__c : null;
				var dimension6 = _.has(pm, 'Apttus_Config2__Dimension6Id__r') ? pm.Apttus_Config2__Dimension6Id__r.Apttus_Config2__Datasource__c : null;
				if(!_.isUndefined(dimension1) 
					&& !_.isNull(dimension1) 
					&& !_.contains(dimensions, dimension1)
					&& _.has(pavfieldDescribeMap, dimension1))
						dimensions.push(dimension1);
				if(!_.isUndefined(dimension2) 
					&& !_.isNull(dimension2) 
					&& !_.contains(dimensions, dimension2)
					&& _.has(pavfieldDescribeMap, dimension2))
						dimensions.push(dimension2);
				if(!_.isUndefined(dimension3) 
					&& !_.isNull(dimension3) 
					&& !_.contains(dimensions, dimension3)
					&& _.has(pavfieldDescribeMap, dimension3))
						dimensions.push(dimension3);
				if(!_.isUndefined(dimension4) 
					&& !_.isNull(dimension4) 
					&& !_.contains(dimensions, dimension4)
					&& _.has(pavfieldDescribeMap, dimension4))
						dimensions.push(dimension4);
				if(!_.isUndefined(dimension5) 
					&& !_.isNull(dimension5) 
					&& !_.contains(dimensions, dimension5)
					&& _.has(pavfieldDescribeMap, dimension5))
						dimensions.push(dimension5);
				if(!_.isUndefined(dimension6) 
					&& !_.isNull(dimension6) 
					&& !_.contains(dimensions, dimension6)
					&& _.has(pavfieldDescribeMap, dimension6))
						dimensions.push(dimension6);
				var pmEntries = pm.Apttus_Config2__MatrixEntries__r;
				_.each(pmEntries, function(pme){
					var PMEntry = {};
					if(_.contains(dimensions, dimension1))
						PMEntry[dimension1] = pme.Apttus_Config2__Dimension1Value__c;
					if(_.contains(dimensions, dimension2))
						PMEntry[dimension2] = pme.Apttus_Config2__Dimension2Value__c;
					if(_.contains(dimensions, dimension3))
						PMEntry[dimension3] = pme.Apttus_Config2__Dimension3Value__c;
					if(_.contains(dimensions, dimension4))
						PMEntry[dimension4] = pme.Apttus_Config2__Dimension4Value__c;
					if(_.contains(dimensions, dimension5))
						PMEntry[dimension5] = pme.Apttus_Config2__Dimension5Value__c;
					if(_.contains(dimensions, dimension6))
						PMEntry[dimension6] = pme.Apttus_Config2__Dimension6Value__c;
					PMEntry['Price__c'] = pme.Apttus_Config2__AdjustmentAmount__c;
					PMEntry['Pricing_Matrix_Id__c'] = pme.Id;
					PMEntry['PMEntryName'] = pme.Name;

					PAVlines.push(PMEntry);
				})
			})
			
			if(_.size(dimensions) > 0)
				dimensions.push('Price__c');
			pricingMatrixSearchResult = {lines:PAVlines, dimensions:dimensions};
			isValid = true;
		}
		function gethasPricingMatrix(){
			return hasPricingMatrix;
		}
		
		function setfirstPricingMatrixRecord(pmId){
			firstPMRecordId = pmId;
		}

		function getfirstPMRecordId(){
			return firstPMRecordId;
		}
		
		function getattributefieldlabeltoPMlabelMap(priceMatrixrawheaders){
	        var res = {};
	        for(var i = 1; i< 7;i++){
	            var key = 'Dimension'+i;
	            if(_.has(priceMatrixrawheaders, key)){
	                res[priceMatrixrawheaders[key]] = key;
	            }
	        }
	        return res;
	    }
	}
})();