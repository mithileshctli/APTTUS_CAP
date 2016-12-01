;(function() {
    'use strict';
    
    angular.module('APTPS_ngCPQ').service('CartDataService', CartDataService); 
    CartDataService.$inject = [ '$q', 
                                  '$log', 
                                  'BaseService', 
                                  'BaseConfigService', 
                                  'RemoteService',
                                  'OptionGroupDataService',
                                  'MiniCartDataService'
                                ];
    function CartDataService($q, $log, BaseService, BaseConfigService, RemoteService, OptionGroupDataService, MiniCartDataService){
        var service = this;
        var nsPrefix = 'Apttus_Config2__';
        var allOptionGroups = {};

        // include/exclude constraints
        service.clearPriorExclusions = clearPriorExclusions;
        service.autoIncludeOptions = autoIncludeOptions;
        service.disableOptionSelections = disableOptionSelections;

        // constraint recommendations.
        service.addToBundle = addToBundle;
        service.addToCart = addToCart;
        service.removeFromBundle = removeFromBundle;
        service.removeFromCart = removeFromCart;
        
        service.getAllSelectedOptions = getAllSelectedOptions;
        //service.getLineItems = getLineItems;

        function clearPriorExclusions(){
            allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        // Enable all previously disabled options. and exclude/include based on constraint rule action info's.
                        if(_.has(productcomponent, 'isDisabled')
                            && productcomponent['isDisabled'] == true)
                        {
                            productcomponent['isDisabled'] = false;
                        }
                    })
                })
            })
        }

        function autoIncludeOptions(productIds){
            //Ensure array of product DOs
            // var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIds, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(!isProdSelected(productcomponent, optiongroup))
                            {    
                                
                                // if product is radio then include using group by setting selectedproduct.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = productcomponent.productId;
                                }
                                else{
                                    // if product is checkbox then include it.
                                    productcomponent.isselected = true;
                                }
                                // selectOptionProduct(productcomponent, optiongroup, true);
                            }
                            //break;
                        }
                    })
                })
            })
        }

        function disableOptionSelections(productIds){
            // var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIds, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(isProdSelected(productcomponent, optiongroup))
                            {
                                // if disabled product is selected as radio then remove it.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = null;
                                }
                                else{
                                    // if disabled product is selected as checkbox then remove it.
                                    productcomponent.isselected = false;
                                }
                                // productcomponent.isselected = false;
                            }

                            productcomponent['isDisabled'] = true;
                            //break;
                        }
                    })
                })
            })
        }

        /**
         * Add option line items to bundle based on product id.
         * @param targetBundleNumber primary line number of the target bundle
         * @param productDO productSO wrapper which is an option
         */
        function addToBundle(products) {
            //Ensure array of product DOs
            var productIdList = [];
            if(_.isArray(products))
                productIdList = _.pluck(products, 'Id');
            else
                productIdList.push(products.Id);
            // var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIdList, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(!isProdSelected(productcomponent, optiongroup))
                            {    
                                
                                // if product is radio then include using group by setting selectedproduct.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = productcomponent.productId;
                                }
                                else{
                                    // if product is checkbox then include it.
                                    productcomponent.isselected = true;
                                }
                            }
                            //break;
                        }
                    })
                })
            })

            // initiate the save call on option inclusion.
            BaseService.setisSavecallRequested(true);
        }

        /**
         * Add one or more products to the cart and return the new line items.
         * A product wrapper just needs the properties "productSO" and "quantity",
         *  which is made to fit with how products are wrapped by the category directive.
         * If the input is exactly one product object instead of an array, the promise
         *  resolves with one line item instead of an array of line items. May change
         *  this for consistency.
         *  
         * @param {object/array}        productWrappers 
         * @return {promise}    promise that resolves with the collection of new line items
         */
        function addToCart(products) {
            $log.info('adding products to Cart.'+products);
            //Ensure array structure
            var productIdList = [];
            if(_.isArray(products))
                productIdList = _.pluck(products, 'Id');
            else
                productIdList.push(products.Id);
            var AddProductstoCartRequestDO = getAddProductstoCartRequestDO(productIdList);
            var requestPromise = RemoteService.addProductstoCart(AddProductstoCartRequestDO);
            var deferred = $q.defer();
            BaseService.startprogress();// start the progress bar.
            requestPromise.then(function(result){
                MiniCartDataService.setMinicartasDirty();// reload mini-cart on new products addition.
                BaseService.completeprogress();// complete progress bar and re-load mini cart.
            });
            return deferred.promise;
        }

        /**
         * Remove an option on a particluar bundle. 
         * @param targetBundleNumber primary line number of the target bundle
         * @param productDO productSO wrapper which is an option
         * @return {[type]}                    [description]
         */
        function removeFromBundle(productList) {
            //Ensure array of product DOs
            var productIdList = _.pluck(productList, 'Id');
            // var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIdList, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(isProdSelected(productcomponent, optiongroup))
                            {
                                // if disabled product is selected as radio then remove it.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = null;
                                }
                                else{
                                    // if disabled product is selected as checkbox then remove it.
                                    productcomponent.isselected = false;
                                }
                            }
                            // productcomponent['isDisabled'] = true;
                            //break;
                        }
                    })
                })
            })
            
            // initiate the save call on option exclusion.
            BaseService.setisSavecallRequested(true);
        }

        /**
         * Remove an array of line items from cart. These items can be
         *  from the server or temporary items -- the cache handles 
         *  organizing what to delete.
         *  
         * @param  {array}  lineItems 
         * @return {promise}    promise that resolves with the cart line
         *                    items either immediately or after the 
         *                    delete has ben sync'd
         */
        function removeFromCart(lineNumbers, products) {
            $log.info('removing products from Cart. lineNumbers: '+lineNumbers+' products:'+products);
            var productIdList = [];
            if(_.isArray(products))
                productIdList = _.pluck(products, 'Id');
            else
                productIdList.push(products.Id);
            var RemoveProductsfromCartRequestDO = getRemoveProductsfromCartRequestDO(lineNumbers, productIdList);
            var requestPromise = RemoteService.removeProductsfromCart(RemoveProductsfromCartRequestDO);
            var deferred = $q.defer();
            BaseService.startprogress();// start the progress bar.
            requestPromise.then(function(result){
                MiniCartDataService.setMinicartasDirty();// reload mini-cart on delete of lines.
                BaseService.completeprogress();// complete progress bar and re-load mini cart.
            });
            return deferred.promise;
        }

        /*function getLineItems(primaryNumber){
            // return all option products under this bundle primaryNumber
            return [];
        }*/

        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected 
                 && optiongroup.ischeckbox)
                    || (productcomponent.productId == optiongroup.selectedproduct 
                        && !optiongroup.ischeckbox))
            return true;
            return false;
        }

        function getCartHeader() {
            var cartHeader = {
                "cartId": BaseConfigService.cartId,
                "configRequestId": BaseConfigService.configRequestId,
                "flowName": BaseConfigService.flowName
            };

            return cartHeader;
        }

        function getAddProductstoCartRequestDO(productIdList){
            var requestDO = {
                "cartHeader":getCartHeader(),
                "productIdList":productIdList
            };
            return requestDO;
        }

        function getRemoveProductsfromCartRequestDO(LineNumbersList, productIdList){
            var requestDO = {
                "cartHeader":getCartHeader(),
                "LineNumbersList":LineNumbersList,
                "productIdList":productIdList
            };
            return requestDO;   
        }

        function getAllSelectedOptions(){
            return OptionGroupDataService.getAllSelectedOptions();
        }
    }                                  
})();