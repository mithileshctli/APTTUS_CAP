;(function() {
    'use strict';

    ehconfigBlock.$inject = ['$provide'];

    function ehconfigBlock($provide){
        $provide.decorator("$exceptionHandler", ['$delegate', 'MessageService', function($delegate, MessageService){
                return function(exception, cause){
                    var errormessage = 'Please contact Admin. Message: '+exception.message+' (caused by "' + cause + '")';
                    $delegate(exception, cause);
                    
                    // end progress bar so atleast user can abandon on hard-error.
                    // BaseService.resetProgressBartinprogress();// end progress bar.
                    
                    MessageService.addMessage('angularerror', errormessage);
            };
        }])
    }

    /*angular.module('APTPS_ngCPQ').factory('$exceptionHandler', function() {
        return function(exception, cause) {
            exception.message += ' (caused by "' + cause + '")';
        throw exception;
        };
    });*/

    angular.module('APTPS_ngCPQ').config(ehconfigBlock);
})();