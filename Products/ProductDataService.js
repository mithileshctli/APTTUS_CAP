(function() {
	angular.module('APTPS_ngCPQ').service('ProductDataService', ProductDataService); 
	ProductDataService.$inject = ['$q', '$log', 'RemoteService'];
	function ProductDataService($q, $log, RemoteService){
		var service = this;
		var productIdtoProductMap = {};

		service.getProducts = getProducts;

		function getProducts(productIds){
			var ProductIds_filtered = _.difference(productIds, _.keys(productIdtoProductMap));
			// _.filter(productIds, function(Id){return !_.contains(existingproductIds, Id);});
			if(_.size(ProductIds_filtered) < 1)
			{
				return $q.when(getRequestedProductsMap(productIds));
			}

			var productsRequest = {productIds : ProductIds_filtered};
			var requestPromise = RemoteService.getProducts(productsRequest);
			return requestPromise.then(function(response){
				initializeproductIdtoProductMap(response);
				return getRequestedProductsMap(productIds);
			})
		}

		function initializeproductIdtoProductMap(response){
			_.each(response.products, function(p){
				productIdtoProductMap[p.Id] = p;
			})
			// service.productIdtoProductMap = _.object(_.map(products, function(p){return [p.Id, p];}));
		}

		function getRequestedProductsMap(productIds){
			var res = {};
			_.each(productIds, function(pId){
				res[pId] = productIdtoProductMap[pId];
			})
			return res;
		}
	}
})();