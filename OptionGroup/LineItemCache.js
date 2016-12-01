(function() {
	angular.module('APTPS_ngCPQ').service('LineItemCache', LineItemCache); 

	function LineItemCache() {
		var service = this;
		var lineItems = {};
		var allLineItems = {};

		service.isValid = false;

		service.getLineItems = getLineItems;
		service.getAllLineItems = getAllLineItems;
		service.initializeLineItems = initializeLineItems;

		function getLineItems() {
			return lineItems;
		}

		function getAllLineItems(){
			return allLineItems;
		}

		function initializeLineItems(response) {
            var array = [];
            _.each(response, function(value, index) {
                //if(value.optionName != 'UNI' && value.parentBundleNumber==1) return;
                array.push(value);
            });

			allLineItems = response;
			lineItems = _.groupBy(array, 'parentBundleNumber');
            console.log('lineItems', lineItems)
			service.isValid = true;
		}
	}
})();