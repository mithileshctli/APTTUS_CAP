/**
 * Directive: ConstraintMessages
 *  defines the directive and the controller used in the directive 
 */
(function() {
    'use strict';

    angular.module('APTPS_ngCPQ').directive('constraintMessages', ConstraintMessages);

    ConstraintMessages.$inject = ['SystemConstants'];
    function ConstraintMessages(SystemConstants) {
        return {
            controller: ConstraintMessagesCtrl,
            controllerAs: 'messageCtrl',
            bindToController: true,
            templateUrl: SystemConstants.baseUrl + '/Templates/constraint-messages.html'
        };
    }

    ConstraintMessagesCtrl.$inject = [
        'ConstraintRuleDataService'
    ];
    
    function ConstraintMessagesCtrl(ConstraintRuleDataService) {
        var ctrl = this;
        
        this.isErrorCollapsed = false;

        // ctrl.errorMessages = [];
        ctrl.messageField = 'Message';

        ctrl.pageErrors = function() {
            return ctrl.messenger.getMessages().page.error;
        };

        ctrl.pageWarnings = function() {
            return ctrl.messenger.getMessages().page.warning;
        };

        /*function processCommonErrors() {
            ctrl.errorMessages.length = 0;

            var contextBundleNumber = ConstraintRuleDataService.getContextBundleNumber();
            var errorLineNumbers = ctrl.messenger.getCommonErrorLines();

            if (errorLineNumbers.length !== 0) {
                var lineItemsWithErrors = OptionGroupDataService.getLineItems(errorLineNumbers);
                angular.forEach(lineItemsWithErrors, function(nextLineItem, index) {
                    var lineSequence = nextLineItem.primaryLine().sequence();
                    var productName = nextLineItem.productName();
                    var newError = {
                        message: 'Configuration Pending for: '+productName;
                    }; 
                    ctrl.errorMessages.push(newError);
                });
            }
            return ctrl.errorMessages;
        }*/

        ctrl.pageInfos = function() {
            return ctrl.messenger.getMessages().page.info;
        };

        ctrl.hasError = function() {
            return ctrl.messenger.getMessages().page.error.length !== 0;
        };

        ctrl.hasWarning = function() {
            return ctrl.messenger.getMessages().page.warning.length !== 0;
        };

        /*ctrl.hasCommonErrors = function() {
            return ctrl.messenger.getCommonErrorLines().length !== 0;
        };*/

        ctrl.hasInfo = function() {
            return ctrl.messenger.getMessages().page.info.length !== 0;
        };

        ctrl.hasMessages = function() {
            return ctrl.hasError() || ctrl.hasWarning() || ctrl.hasInfo();// || ctrl.hasCommonErrors();
        };

        ctrl.messenger = ConstraintRuleDataService;

        //initialize
        //processCommonErrors();

        return ctrl;
    }

}).call(this);