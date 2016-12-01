(function() {
    'use strict';
    angular.module('APTPS_ngCPQ').service('ConstraintRuleDataService', ConstraintRuleDataService); 
    ConstraintRuleDataService.$inject = ['$log', 'BaseConfigService', 'RemoteService', 'CartDataService', 'ProductDataService', 'MessageService'];
    function ConstraintRuleDataService($log, BaseConfigService, RemoteService, CartDataService, ProductDataService, MessageService){
        var service = this;

        var linesWithMessage = {};
        var ruleTypes = ['error', 'warning', 'info'];
        var messageField = 'Message';
        var processedIds = {};
        // var recommendedProducts = [];
        var constraintErrorMessagesCount = 0 ;

        //targetBundleNumder to message map
        var messages = {
                
        };

        var messageTemplate = {
                page: {
                    error: [],
                    warning: [],
                    info: []
                },
                prompt: []
        };

        var actionRulesMapTemplate = {
            error:[],
            warning:[],
            info:[]
        };

        /*var recommendationProductTemplate = {
            action:'',
            productDO:{}
        };*/

        // Constant action types
        service.ACTIONTYPE_INCLUDE = 'Inclusion';
        service.ACTIONTYPE_EXCLUDE = 'Exclusion';
        service.ACTIONTYPE_RECOMMEND = 'Recommendation';
        service.ACTIONTYPE_VALIDATE = 'Validation';
        service.ACTIONTYPE_REPLACE = 'Replacement';

        service.ACTIONINTENT_SHOWMESSAGE = 'Show Message';
        service.ACTIONINTENT_PROMPT = 'Prompt';
        service.ACTIONINTENT_AUTOINCLUDE = 'Auto Include';;
        service.ACTIONINTENT_DISABLESELECTION = 'Disable Selection';

        service.ACTION_ADDTOCART = 'add To Cart';
        service.ACTION_ADDTOBUNDLE = 'add To Bundle';

        // return the list of recommended products.
        /*service.getRecommendedProductsList = function(){
            return recommendedProducts;
        }

        service.clearRecommendation = function(recProductWrap) {
            if (_.contains(recommendedProducts, recProductWrap)) {
                recommendedProducts = _.without(recommendedProducts, _.find(recommendedProducts, function(pWrap){return pWrap.productDO.Id == recProductWrap.productDO.Id}));
                
            }
        };*/

        /**
         * @return 0 or context bundles primary line number
         */ 
        service.getContextBundleNumber = function() {
            return BaseConfigService.lineItem.primaryLineNumber;
        }

        /**
         * @return {Object} message structure
         */
        service.getMessages = function() {
            var contextBundleNumber = service.getContextBundleNumber();
            if (angular.isUndefined(messages[contextBundleNumber])) {
                messages[contextBundleNumber] = angular.copy(messageTemplate);
            }
            return messages[contextBundleNumber];

        };

        /**
         * returns all prompts with target bundle number as zero. 
         * used in options page to display primary prompt in addition to its own prompts
         */
        var getPrimaryPrompts = function() {
            var contextBundleNumber = 0; // service.getContextBundleNumber();
            if (angular.isUndefined(messages[contextBundleNumber])) {
                messages[contextBundleNumber] = angular.copy(messageTemplate);
            }
            return messages[contextBundleNumber].prompt;

        };

        /**
         * returns next active prompt
         */
        service.getNextPrompt = function(){
            //display all primary prompts in all pages
            var primaryPrompts = getPrimaryPrompts();
            var activePrompt;
            var i, prompt;
            for (i = 0; i < primaryPrompts.length; i++) {
                prompt = primaryPrompts[i];
                if (processedIds[prompt.AppliedActionId] !== true 
                    && prompt['IsIgnoredByUser'] !== true) {
                    activePrompt = primaryPrompts[i];
                    break;
                }
            }
            
            if (angular.isUndefined(activePrompt)) {
                var optionPrompts = service.getMessages().prompt;
                for (i = 0; i < optionPrompts.length; i++) {
                    prompt = optionPrompts[i];
                    if (processedIds[prompt.AppliedActionId] !== true 
                        && prompt['IsIgnoredByUser'] !== true) {
                        activePrompt = optionPrompts[i];
                        break;
                    }
                }
                
            }
            return activePrompt;
            
        };

        /**
         * @return [Object] list of warnings 
         */
        /*service.getCommonErrorLines = function() {
            var contextBundleNumber = service.getContextBundleNumber();
            var errorLines = [];
            angular.forEach(linesWithMessage, function(value, key){
                if(value === 'error') {
                    if (key != contextBundleNumber) {
                        errorLines.push(key);
                    }
                }
                
            });
            return errorLines;
            
        };*/

        /**
         * Insert new rule actions into stored actions.
         * Currently just overwrites, maybe should merge?
         * 
         * @param  {Object} newActions Actions structure
         * @return {Object}            Reference to rule actions 
         */
        service.updateRuleActions = function(newActions) {
            //cleanup all messages
            messages = {};
            messages[0] = angular.copy(messageTemplate);
            linesWithMessage = {};
            constraintErrorMessagesCount = 0;

            //do nothing if there are no messages.
            if (!newActions) {
                return;
            }

            CartDataService.clearPriorExclusions();

            var ruleTypetoActionsMap = angular.copy(actionRulesMapTemplate);
            _.each(newActions, function(ruleAction){
                ruleTypetoActionsMap[angular.lowercase(ruleAction.MessageType)].push(ruleAction);
            })

            // messages.prompt = [];
            _.each(ruleTypes, function (ruleType) {
                var ruleActions = ruleTypetoActionsMap[ruleType];
                _.each(ruleActions, function (ruleAction) {
                    var targetBundleNumber = ruleAction['TargetBundleNumber'];//TODO: set as zero for null
                    linesWithMessage[targetBundleNumber] = ruleType;
                    
                    if (angular.isUndefined(messages[targetBundleNumber])) {
                        messages[targetBundleNumber] = angular.copy(messageTemplate);
                    }
                    var targetMessages = messages[targetBundleNumber];
                    
                    // ruleAction['IsShowPrompt']
                    if (ruleAction['ActionIntent'] == service.ACTIONINTENT_PROMPT
                         && !ruleAction['IsIgnoredByUser']) {
                        targetMessages.prompt.push(ruleAction);
                        
                    } else {
                        //targetMessages.page[ruleType].push(ruleAction);
                        // add page level message if not blank
                        if(ruleAction['ActionIntent'] == service.ACTIONINTENT_SHOWMESSAGE
                            && !_.isUndefined(ruleAction[messageField])
                            && !_.isEmpty(ruleAction[messageField]))
                        {
                            MessageService.addMessage('constrainterror', ruleAction[messageField]);
                            
                            if(ruleType == 'error'){
                                constraintErrorMessagesCount++;
                            }
                        }
                        
                        // process auto inclusions and exclusions. Only if targetted to current bundle.
                        // commented by H.E - 03/07/2016 to fix DE4287 {Inclusion Rule doesn't work when condition product has options}
                        //if(targetBundleNumber == service.getContextBundleNumber())
                            processInclusionsandExclusions(ruleAction);

                        // process the recommendations.
                        // processRecommendations(ruleAction);
                    }
                });

            });

            $log.debug('Updated constraint rule messages: ', messages);
            return messages;

        };

        /**
         * flag as processed. TODO: handle min-required
         */
        service.markAsProcessed = function(activePrompt) {
            processedIds[activePrompt.AppliedActionId] = true;
            
        };

        /**
         * @param [RuleAction] activePrompt
         * @return {[type]} [description]
         */
        service.ignoreRuleAction = function(activePrompt) {
            var ruleActionId = activePrompt.AppliedActionId;
            processedIds[activePrompt.AppliedActionId] = true;
            activePrompt['IsIgnoredByUser'] = true;
            
            // to be implemented.
            var ignoreRuleActionRequest = getignoreRuleActionRequestDO(ruleActionId);
            RemoteService.ignoreRuleAction(ignoreRuleActionRequest).then(function(result) {
                // service.updateRuleActions(result.ruleActions);              
            });
        }

        function processInclusionsandExclusions(ruleAction){
            // var ActionType = ruleAction['ActionType'];
            var ActionIntent = ruleAction['ActionIntent'];
            if(ActionIntent == service.ACTIONINTENT_AUTOINCLUDE)
            {
                CartDataService.autoIncludeOptions(ruleAction['SuggestedProductIds']);
            }
            else if(ActionIntent == service.ACTIONINTENT_DISABLESELECTION)
            {
                CartDataService.disableOptionSelections(ruleAction['SuggestedProductIds']);
            }else{
                
            }
        }

        /*function processRecommendations(ruleAction){
            // var ActionType = ruleAction['ActionType'];
            var ActionIntent = ruleAction['ActionIntent'];
            // add to recommended products list on show message.
            if(ActionIntent == service.ACTIONINTENT_SHOWMESSAGE)
            {
                var productIdList = ruleAction['SuggestedProductIds'];
                var targetBundleNumber = ruleAction['TargetBundleNumber'];
                var actionName = 'Add';
                if (!targetBundleNumber) { //add as primary line
                    actionName = service.ACTION_ADDTOCART;
                    
                } else { //add to bundle
                    actionName = service.ACTION_ADDTOBUNDLE;
                    
                }

                // recommend product which are not already selected.
                var allSelectedOptionProducts = CartDataService.getAllSelectedOptions();
                productIdList = _.difference(productIdList, allSelectedOptionProducts);
                ProductDataService.getProducts(productIdList).then(function(productsMap){
                    _.each(productsMap, function(value, key){
                        var recProd = angular.copy(recommendationProductTemplate);
                        recProd.action = actionName;
                        recProd.productDO = value;
                        // do not add duplicates.
                        var recProd_existing = _.find(recommendedProducts, function(pWrap){return pWrap.productDO.Id == recProd.productDO.Id});
                        if(_.isUndefined(recProd_existing))
                            recommendedProducts.push(recProd);
                    });
                });
            }
        }*/

        function getignoreRuleActionRequestDO(ruleActionId){
            var ruleActionIdList = [ruleActionId]; 
            var requestDO = {
                "cartHeader":BaseConfigService.cartHeader,
                "ruleActionIdList":ruleActionIdList
            };
            return requestDO;
        }

        service.getErrorMessagesCount = function(){
            return constraintErrorMessagesCount;
        }
    }
})();