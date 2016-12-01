(function() {
	angular.module('APTPS_ngCPQ').service('LocationCache', LocationCache); 
	LocationCache.$inject = ['$log'];
	function LocationCache($log) {
		var service = this;
		service.locations = [];
		service.isValid = false;
		

		// location Cache methods.
		service.getLocations = getLocations;
		service.initializeLocations = initializeLocations;
		
		function getLocations() {
			return service.locations;
		}

		function initializeLocations(locations) {
			service.locations = locations;
			service.isValid = true;
		}
	}
})();