(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'BaseConfigService', 'RemoteService'];
	function MiniCartDataService($q, $log, BaseConfigService, RemoteService){
		var service = this;
		var miniCartLines = [];
		var miniCartLinesCount = 0;

		service.isValid = false;
		
		service.getMiniCartLines = getMiniCartLines;
		service.getminiCartLinesCount = getminiCartLinesCount;
		service.setMinicartasDirty = setMinicartasDirty;
		service.configureLineItem = configureLineItem;
		service.deleteLineItemFromCart = deleteLineItemFromCart;
		
		function getMiniCartLines() {
			if (service.isValid) {
				return $q.when(miniCartLines);
			}
			
			var miniCartRequest = {cartId : BaseConfigService.cartId};
			var requestPromise = RemoteService.getMiniCartLines(miniCartRequest);
			return requestPromise.then(function(response){
				service.isValid = true;
				miniCartLines = response.lineItems;
				miniCartLinesCount = response.length;
				return miniCartLines;
			});
		}

		function configureLineItem(lineItemId){
			var configureLineItemRequestDO = getConfigureLineItemRequestDO(lineItemId);
			var requestPromise = RemoteService.configureLineItem(configureLineItemRequestDO);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function deleteLineItemFromCart(lineNumber_tobedeleted, bundleProdId){
			var deleteLineItemFromCartRequestDO = getDeleteLineItemFromCartRequestDO(lineNumber_tobedeleted, bundleProdId);
            var requestPromise = RemoteService.deleteLineItemFromCart(deleteLineItemFromCartRequestDO);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function getDeleteLineItemFromCartRequestDO(lineNumber_tobedeleted, bundleProdId){
            var requestDO = {
                "cartHeader":BaseConfigService.cartHeader,
                "lineItemNumber_tobedeleted":lineNumber_tobedeleted,
                "currentLineNumber":BaseConfigService.lineItem.lineNumber,
                "bundleProdId":bundleProdId
            };
            return requestDO;
        }

		function getConfigureLineItemRequestDO(lineItemId){
            var requestDO = {
                "cartHeader":BaseConfigService.cartHeader,
                "lineItemId":lineItemId
            };
            return requestDO;
        }

		function setMinicartasDirty(){
			service.isValid = false;
		}

		function getminiCartLinesCount(){
			return miniCartLinesCount;
		}
	}
})();