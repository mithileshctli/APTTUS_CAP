/*
    This service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    angular.module('APTPS_ngCPQ').service('SensitiveHelpDataService', SensitiveHelpDataService); 
    SensitiveHelpDataService.$inject = ['$q', '$log'];
    function SensitiveHelpDataService($q, $log) {
        var service = this;		
		var currentOptionComponent = '';		
		
		service.currentOptionComponent = currentOptionComponent;
		service.setSensitiveFields = setSensitiveFields;
		service.removeSpecialChars = removeSpecialChars;
		
		function setSensitiveFields(component){
			var sensitiveFieldsKeys = _.keys(component.sensitiveHelpFieldsMap);
			var sensitiveHelpFields = [];
			var sensitiveInfo = [];
			
			sensitiveInfo.productName = component.productName;
			
			
			if(sensitiveFieldsKeys != null || sensitiveFieldsKeys != 'undefined'){
				_.each(sensitiveFieldsKeys, function(key){
					var fieldValue = component.product[key];
				if (typeof fieldValue === 'string' || fieldValue instanceof String){
					fieldValue = removeSpecialChars(fieldValue);
				}
						
						//var fieldValue = component.product[key];
					sensitiveHelpFields.push({name:component.sensitiveHelpFieldsMap[key], value:fieldValue});
				});
			}
			sensitiveInfo.infoData = sensitiveHelpFields;
			
			return sensitiveInfo;
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