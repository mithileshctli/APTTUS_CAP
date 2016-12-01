(function(){
    var myEvent = window.attachEvent || window.addEventListener;
    var chkevent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compatible
    
    myEvent(chkevent, function(e) { // For >=IE7, Chrome, Firefox
        var confirmationMessage = ' ';  // a space
        (e || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
    });    
})();
