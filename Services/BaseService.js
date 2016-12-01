(function() {
    angular.module('APTPS_ngCPQ').service('BaseService', BaseService); 
    BaseService.$inject = ['$log','ngProgress'];
    function BaseService($log, ngProgress) {
        var service = this;

        var progressBarInProgress = {
            status: false,
            freezePage: true
        };

        var pageloadComplete = false;
        var ProgressBartinprogress = false;
        var isLocationLoadComplete = false;
        var isPricingMatrixLoadComplete = false;
        var isOptionGroupLoadComplete = false;
        var isPAVObjConfigLoadComplete = false;
        var isPAConfigLoadComplete = false;
        var isOptiontoOptionAttributeLoadComplete = false;
        var isPAVLoadComplete = false;
        var isSaveCallinProgress = false;
        var isSavecallRequested = false;
		var isCapReadOnly = false;

        service.startprogress = startprogress;
        service.completeprogress = completeprogress;
        service.completeSaveProgress = completeSaveProgress;
        service.getProgressBartinprogress = getProgressBartinprogress;
        service.getProgressBarInProgress = getProgressBarInProgress;
        service.getpageloadComplete = getpageloadComplete;
		//service.isCapReadOnly = isCapReadOnly;

        service.setLocationLoadComplete = function(){
            isLocationLoadComplete = true;
            completeprogress();
        }
        service.setPricingMatrixLoadComplete = function(){
            isPricingMatrixLoadComplete = true;
            completeprogress();
        }
        service.setOptionGroupLoadComplete = function(){
            isOptionGroupLoadComplete = true;
            completeprogress();
        }
        service.setPAVObjConfigLoadComplete = function(){
            isPAVObjConfigLoadComplete = true;
            completeprogress();
        }
        service.setPAConfigLoadComplete = function(){
            isPAConfigLoadComplete = true;
            completeprogress();
        }
        service.setOptiontoOptionAttributeLoadComplete = function(){
            isOptiontoOptionAttributeLoadComplete = true;
            completeprogress();
        }
        service.setPAVLoadComplete = function(){
            isPAVLoadComplete = true;
            completeprogress();
        }
        service.setisSaveCallinProgress = function(){
            isSaveCallinProgress = true;
        }
        service.setisSavecallRequested = function(val){
            isSavecallRequested = val;
        }

        service.getLocationLoadComplete = function(){
            return isLocationLoadComplete;
        }
        service.getPricingMatrixLoadComplete = function(){
            return isPricingMatrixLoadComplete;
        }
        service.getOptionGroupLoadComplete = function(){
            return isOptionGroupLoadComplete;
        }
        service.getPAVObjConfigLoadComplete = function(){
            return isPAVObjConfigLoadComplete;
        }
        service.getPAConfigLoadComplete = function(){
            return isPAConfigLoadComplete;
        }
        service.getOptiontoOptionAttributeLoadComplete = function(){
            return isOptiontoOptionAttributeLoadComplete;
        }
        service.getPAVLoadComplete = function(){
            return isPAVLoadComplete;
        }
        service.getisSaveCallinProgress = function(){
            return isSaveCallinProgress;
        }
        service.getisSavecallRequested = function(){
            return isSavecallRequested;
        }
        
        function init(){
            // set the color and height for status bar.
            ngProgress.color('#5c8427');
            ngProgress.height('6px');
        }
        
        // start the page level progress bar.
        function startprogress(freezePage){
            if(!progressBarInProgress.status)
            {
                $log.log('inside startprogress');
                setProgressBarInProgress(true, freezePage);
                ngProgress.reset();// reset the progress bar if not completed by previous methids.
                ngProgress.start(); // start progress.
            }
        }
        
        // complete the page level progress on Save bar. Use this only for save call.
        function completeSaveProgress(){
            // complete progress only after all loads are complete.
            $log.log('inside completeprogress');
            ngProgress.complete();
            isSaveCallinProgress = false;
            setProgressBarInProgress(false, false);
        }
        
        // complete the page level progress bar.
        function completeprogress(){
            // complete progress only after all loads are complete.
            if(isLocationLoadComplete
                && isPricingMatrixLoadComplete
                && isOptionGroupLoadComplete
                && isPAVObjConfigLoadComplete
                && isPAConfigLoadComplete
                && isOptiontoOptionAttributeLoadComplete
                && isPAVLoadComplete)
            {
                $log.log('inside completeprogress');
                ngProgress.complete();
                pageloadComplete = true;
                setProgressBarInProgress(false, false);
            }
        }

        function getProgressBartinprogress(){
            return ProgressBartinprogress;
        }

        function getProgressBarInProgress(){
            return progressBarInProgress;
        }

        function setProgressBarInProgress(status, freezePage){
            progressBarInProgress = {status: status, freezePage: freezePage};
        }

        function getpageloadComplete(){
            return pageloadComplete;
        }

        init();
    }
})();