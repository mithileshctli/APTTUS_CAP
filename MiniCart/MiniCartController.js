;(function() {
    var MiniCartController = function($scope, $window, $dialogs, SystemConstants, BaseService, MiniCartDataService)
    {
        $scope.init = function(){
            // Initialize Scope Variables
            $scope.miniCartService = MiniCartDataService;
            $scope.baseService = BaseService;
            
            $scope.reverse = false;                
            $scope.itemsPerPage = 5;
            $scope.pagedItems = [];
            $scope.currentPage = 0;
            
            $scope.constants = SystemConstants;
            
            /*$scope.miniCartTemplateURL = SystemConstants.baseUrl+'/Templates/MiniCartView.html';
            $scope.paginationLinksTemplateURL = SystemConstants.baseUrl+'/Templates/PaginationLinksView.html';
            $scope.imagesbaseURL = SystemConstants.baseUrl+'/Images';*/
            $scope.lineCount = 0;
            
            // Group by pages
            $scope.groupToPages();
        }

        $scope.$watch('miniCartService.isValid', function(newVal, oldVal){
            // reload the minicart if data is invalid.
            if(newVal != oldVal
                && newVal == false)
                $scope.groupToPages();
        });

        // Calculate Total Number of Pages based on Records Queried 
        $scope.groupToPages = function () {
            $scope.currentPage = 0;
            $scope.miniCartService.getMiniCartLines().then(function(result) {
                $scope.items = result;
                $scope.lineCount = $scope.items.length;
                $scope.pagedItems = [];
                for (var i = 0; i < $scope.items.length; i++) {
                    if (i % $scope.itemsPerPage === 0) {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.items[i]];
                    } else {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.items[i]);
                    }
                }
            })
        };
            
        $scope.firstPage = function () {
            $scope.currentPage = 0;
        };
        
        $scope.lastPage = function () {
            $scope.currentPage = $scope.pagedItems.length-1;
        };
        
        $scope.prevPage = function () {
            if ($scope.currentPage > 0) {
                $scope.currentPage--;
            }
        };
        
        $scope.nextPage = function () {
            if ($scope.currentPage < $scope.pagedItems.length - 1) {
                $scope.currentPage++;
            }
        };
        
        $scope.setPage = function () {
            $scope.currentPage = this.n;
        };
        
        $scope.invokeDoConfigure = function(lineItemId){
            $scope.miniCartService.configureLineItem(lineItemId).then(function(result){
                // redirect the page to config URL.
                parsenRedirect(result.ref);
            })
        };

        $scope.deleteLineItemFromCart = function(lineNumber_tobedeleted, bundleProdId){
            $scope.baseService.startprogress();// start page level progress bar. 
            $scope.miniCartService.deleteLineItemFromCart(lineNumber_tobedeleted, bundleProdId).then(function(result){
                
                parsenRedirect(result.ref);

                // mark minicart as dirty and reload minicart.
                $scope.miniCartService.setMinicartasDirty();
                // $scope.groupToPages();
                $scope.baseService.completeprogress();// stop page level progress bar.
            })
        };
        
        $scope.launch = function(which, productName, lineNumber, productId){
            var dlg = null;
            switch(which){
                // Delete Line Item Confirm Dialog
                case 'confirmRemoveLine':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to Delete "'+productName+ '" from cart ?');
                    dlg.result.then(function(btn){
                        $scope.deleteLineItemFromCart(lineNumber, productId);
                    },function(btn){
                        
                });
                break;
            }; // end switch
        }; // end launch

        function parsenRedirect(pgReference){
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                pgReference = _.unescape(pgReference);
            
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                $window.location.href = _.unescape(pgReference);
        };

        $scope.init();
    };
    MiniCartController.$inject = ['$scope', '$window', '$dialogs', 'SystemConstants', 'BaseService', 'MiniCartDataService'];
    angular.module('APTPS_ngCPQ').controller('MiniCartController', MiniCartController);
})();