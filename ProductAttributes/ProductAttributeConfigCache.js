(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeConfigCache', ProductAttributeConfigCache); 
	ProductAttributeConfigCache.$inject = ['$log'];
	function ProductAttributeConfigCache($log) {
		var service = this;
		service.isValid = false;

		var prodductIdtoattributegroupsMap = {};
		var productIdtodynamicattributegroupMap = {};
		
		
		// Product Attribute Cache methods.
		service.getProductAttributesConfig = getProductAttributesConfig;
		service.initializeProductAttributes = initializeProductAttributes;
		service.getProdductIdtoattributegroupsMap = getProdductIdtoattributegroupsMap;
		
		function getProductAttributesConfig() {
			var attributeResult = {'prodductIdtoattributegroupsMap' : prodductIdtoattributegroupsMap, 'productIdtodynamicattributegroupMap': productIdtodynamicattributegroupMap};
			return attributeResult;
		}

		function initializeProductAttributes(result) {
			_.each(result.productIdtoproductgroupIdsMap, function (groupIdsSet, prodId) {
                var attributeGroups = [];
                _.each(groupIdsSet, function(groupId){
            		attributeGroups.push(result.groupIdtoattributegroupMap[groupId]);
                });
                /* removal of special characters*/
                _.each(attributeGroups, function(group){
                	group.groupName = characterRepace(group.groupName);
                })
                
                prodductIdtoattributegroupsMap[prodId] = attributeGroups;
            });
            
            // dynamic attribute groups.
			_.each(result.productIdtodynamicattributegroupMap, function (attributeGroup, prodpluslocationId) {
            	productIdtodynamicattributegroupMap[prodpluslocationId] = attributeGroup;
            });
			service.isValid = true;
		}

		function characterRepace(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            //unescape: replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);           
            return changedItem;
        }

        function getProdductIdtoattributegroupsMap(){
        	return prodductIdtoattributegroupsMap;
        }
	}
})();