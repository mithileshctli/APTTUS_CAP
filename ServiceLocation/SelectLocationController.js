(function() {
    var SelectLocationController;

    SelectLocationController = function($scope, $log, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
            $scope.selectedlpa = {};
            $scope.locationService = LocationDataService;
            $scope.displaylocations = false;
        }
        $scope.init();

        $scope.$watch('locationService.getselectedlpa()', function(newVal) {
            if(newVal)
            {
                $scope.selectedlpa = newVal;
            }    
        });

        $scope.$watch('locationService.gethasServicelocations()', function(newVal, oldVal) {
            if(newVal != oldVal
                && !_.isNull(newVal))
            {
                $scope.displaylocations = $scope.locationService.gethasServicelocations();
            }    
        });
    };
    
    SelectLocationController.$inject = ['$scope', '$log', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('SelectLocationController', SelectLocationController);
}).call(this);