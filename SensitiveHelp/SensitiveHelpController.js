(function() {
    var SensitiveHelpController;

    SensitiveHelpController = function($scope, $log, $location, $dialogs, $modalInstance, SensitiveHelpDataService) {

		$scope.closeHelpModal = function () {
			$modalInstance.close();
		};
		
		$scope.currentOptionComponent = SensitiveHelpDataService.setSensitiveFields(SensitiveHelpDataService.currentOptionComponent);
		        
    };

    SensitiveHelpController.$inject = ['$scope', '$log', '$location', '$dialogs', '$modalInstance', 'SensitiveHelpDataService'];
    angular.module('APTPS_ngCPQ').controller('SensitiveHelpController', SensitiveHelpController);
}).call(this);