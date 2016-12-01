(function() {
    var OptionGroupHierarchyController;

    OptionGroupHierarchyController = function($scope, $log, BaseConfigService, OptionGroupDataService) {
    	// all variable intializations.
        $scope.init = function(){
			$scope.productGroupList =[];// to load hierarchy
			$scope.optionGroupService = OptionGroupDataService;

			$scope.renderhierarchy();
		}

		$scope.$watch('optionGroupService.getrerenderHierarchy()', function(newVal, oldVal) {
			// rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
			if(newVal != oldVal
				&& newVal == true)
			{
				$scope.renderhierarchy();
				$scope.optionGroupService.setrerenderHierarchy(false);
			}
		});

		$scope.rendercurrentproductoptiongroups = function(arg1, arg2, arg3){
			$scope.optionGroupService.setslectedOptionGroupProdId(arg1);
		}

    	$scope.renderhierarchy = function(){
            var selectedproducts = [BaseConfigService.lineItem.bundleProdId];
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();

            var  productGroupList = [
                { "groupName" : BaseConfigService.lineItem.bundleProdName, "groupId" : BaseConfigService.lineItem.bundleProdId, "Parent": "", "isproduct" : true}];
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                if(selectedproducts.indexOf(bundleprodId) > -1)
                {
                    _.each(optiongroups, function(optiongroup){
                        productGroupList.push({"groupName" : optiongroup.groupName, "groupId" : optiongroup.groupId, "Parent": optiongroup.parentId, "isproduct" : false});
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if((productcomponent.isselected && optiongroup.ischeckbox)
                                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
                            {
                                productGroupList.push({"groupName" : productcomponent.productName, "groupId" : productcomponent.productId, "Parent": optiongroup.groupId, "isproduct" : true});
                                selectedproducts.push(productcomponent.productId);
                            }
                        });
                    });
                }
            });

            Array.prototype.insertChildAtId = function (strId, objChild)
            {
                // Beware, here there be recursion
                found = false;
                _.each(this, function(node){
                    if (node.groupId == strId)
                    {
                        // Insert children
                        node.children.push(objChild);
                        return true;
                    }
                    else if (node.children)
                    {
                        // Has children, recurse!
                        found = node.children.insertChildAtId(strId, objChild);
                        if (found) return true;
                    }
                });
                return false;
            };

            // Build the array according to requirements (object in value key, always has children array)
            var target = [];
            _.each(productGroupList, function(productGroup){
                target.push ({"groupName" : productGroup.groupName, "groupId" : productGroup.groupId, "Parent": productGroup.Parent, "isproduct" : productGroup.isproduct,"children": []});
            });

            var i = 0;
            while (target.length>i)
            {
                if (target[i].Parent)
                {
                    // Call recursion to search for parent id
                    target.insertChildAtId(target[i].Parent, target[i]); 
                    // Remove node from array (it's already been inserted at the proper place)
                    target.splice(i, 1); 
                }
                else
                {
                    // Just skip over root nodes, they're no fun
                    i++; 
                }
            }

            $scope.productGroupList = target;
        }
   		
   		$scope.init();
   	};

   	OptionGroupHierarchyController.$inject = ['$scope', '$log', 'BaseConfigService', 'OptionGroupDataService'];
	angular.module('APTPS_ngCPQ').controller('OptionGroupHierarchyController', OptionGroupHierarchyController);
}).call(this);