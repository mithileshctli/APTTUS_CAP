(function() {
    var MessageController;
	MessageController = function($scope, $log, MessageService) {
	    $scope.msgService = MessageService;
	    // $scope.messages = MessageService.getMessages();
	    $scope.closeMsg = function(index) {
	        $scope.messages[index].remove();
	    };

	    $scope.$watch('msgService.getMessages()', function(newVal) {
            if(newVal)
            {
                $scope.messages = newVal;
            }    
        });
		$scope.closeAlert = function(index) {
			$scope.msgService.removeMessage(index);
	  	};
	};

	MessageController.$inject = ['$scope', '$log', 'MessageService'];
    angular.module('APTPS_ngCPQ').controller('MessageController', MessageController);
}).call(this);