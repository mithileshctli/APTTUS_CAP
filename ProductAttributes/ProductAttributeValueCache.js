(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueCache', ProductAttributeValueCache); 
	ProductAttributeValueCache.$inject = ['$log'];
	function ProductAttributeValueCache($log) {
		var service = this;
		var productIdtoPAVMap = {};

		service.isValid = false;
		
		service.getProductAttributeValues = getProductAttributeValues;
		service.initializeProductAttributeValues = initializeProductAttributeValues;

		function getProductAttributeValues(){
			return productIdtoPAVMap;
		}

		function initializeProductAttributeValues(response){
			service.isValid = true;
			_.each(response, function(pavwrapper){
				productIdtoPAVMap[pavwrapper.productId] = pavwrapper.pav;
			})
		}
	}
})();