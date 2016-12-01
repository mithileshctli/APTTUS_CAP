/*
    @author : Mithilesh.
	CGE User Story to Display Reusable UNI in popup
*/
(function() {
    angular.module('APTPS_ngCPQ').service('ReusableUniSelectorDataService', ReusableUniSelectorDataService); 
    ReusableUniSelectorDataService.$inject = ['$q', '$log', 'BaseService'];
    function ReusableUniSelectorDataService($q, $log, BaseService) {
        var service = this;		
		var reusableUNIs = [];
		var availReusableUNIs = [];
		var selectedUNILocation = {};
		var uniBillableBandwidth = {};
		var resourceId = null;
		var productAttributeValues = {};
		
		service.setSelectableReusableUNIs = setSelectableReusableUNIs;
		service.setReusableUNIs = setReusableUNIs;
		service.getReusableUNIs = getReusableUNIs;
		service.setSelectedUNILocation = setSelectedUNILocation;
		service.getSelectedUNILocation = getSelectedUNILocation;
		service.setUNIBillableBandWidth = setUNIBillableBandWidth;
		service.setProductAttributeValues = setProductAttributeValues;
        service.setReusableUNIAttributes = setReusableUNIAttributes;
		
		service.setResourceId = setResourceId;
		service.getResourceId = getResourceId;
		
		function setSelectableReusableUNIs(UNIs){
			var i = 1;
			_.each(UNIs, function(uni){
				var availableBW = uni.BWAvailable;
				var uniBandwidth = convertToMbs(uniBillableBandwidth);
				if(uniBillableBandwidth && availableBW >= uniBandwidth){
					uni.isDisabled = false;
				}else{
					uni.isDisabled = true;
				}

				if(uni.ServiceType == 'EPLINE' || uni.ServiceType == 'EPLAN')
					uni.isDisabled = true;
				
				if(uni.EricssonUNIID == resourceId){
					uni.checked = true;
				} else{
					uni.checked = false;
				}
				uni.AvailVC = uni.MaxNumServicePermitted - uni.ExistingServicesCount;
				uni.Index = 'UNI ' + i;
				uni.Source = 'SR';
				i++;
			});		
				availReusableUNIs = UNIs;
		}
		
		function setReusableUNIs(ESLExistingUNIs){
			reusableUNIs = ESLExistingUNIs;
			setSelectableReusableUNIs(reusableUNIs);
		}
		
		function getReusableUNIs(){
			return availReusableUNIs;
		}
		
		function setSelectedUNILocation(selectedUNILoc){
			selectedUNILocation = selectedUNILoc;
		}
		
		function getSelectedUNILocation(){
			return selectedUNILocation;
		}
		
		function setUNIBillableBandWidth(calculatedUniBandwidth){
			uniBillableBandwidth = calculatedUniBandwidth;
		}
		
		function setResourceId(uniResourceId){
			resourceId = uniResourceId;
		}

		function getResourceId(){
			return resourceId;
		}
		
		function convertToMbs(value){
			if(!value || value == -1)
				return value;
			var numberAndUnit = value.split(' ');
			var newValue = numberAndUnit[1] == "Gbps" ? parseFloat(numberAndUnit[0]) * 1000 : parseFloat(numberAndUnit[0]);
			return newValue;
		}
		function setProductAttributeValues(paValues)
        {
            productAttributeValues = paValues;
        }	

        function setReusableUNIAttributes(attribute)
        {            
            productAttributeValues['Resource_ID__c'] = attribute.EricssonUNIID;
			//Resetting UNI ERROR INDICATOR, if reusable UNI is selected from Inventory.(OR Re-search in inventory and select new UNI)
			productAttributeValues['UNI_ERROR_INDICATOR__c'] = ",,";;
                        
            BaseService.setisSavecallRequested(true);
        }
		
    }
})();