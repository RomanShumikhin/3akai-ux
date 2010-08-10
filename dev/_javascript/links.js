var sakai = sakai || {};

sakai.links = function(){

    // page elements
    var $suggestedSites = $(".suggested_sites");
    var $allSites = $(".all_sites");

    // templates
    var suggested_sites_template = "suggestedsites_links_template";
    var all_sites_template = "allsites_links_template";

    // data files and paths
    var userLinksObj = {};
    var userLinks = "my_links";
    var linksDataNode = "/~" + sakai.data.me.user.userid + "/private/" + userLinks;

    // Still working out some problems with the loading of default data from /var
    var directoryLinksLocation = "/var/defaults/mylinks/links-directory.json";
 
    var directory = {};
    
    /**
     * Write the users links to JCR.
     * @param {object} updatedList The current state of the user's list.
     */
    var saveLinkList = function(updatedList){
        sakai.api.Server.saveJSON(linksDataNode, updatedList);
    };
    
    /**
     * A function that can search for a given id in a given array.
     * Returns the index in that array where the id occurs.
     * @param {Object} id The id we are looking for.
     * @param {Object} array The array we are looking in.
     */
    var searchIndex = function(id, array){
        var length = array.length;
        for (var i = 0; i < length; i++) {
            if (id == array[i].id) {
                return i;
            }
        }
    };
    
    /**
     * Adds a link to the user's data list. Returns updated list.
     * @param {Object} toAdd Link to add to user data.
     * @param {Object} data User data.
     */
    var addLink = function(toAdd){
        userLinksObj.links.push(toAdd);
        return userLinksObj;
    };
    
    /**
     * Removes the link from the user's data list. Returns updated list.
     * @param {Object} toRemove Link to remove from user data.
     * @param {Object} data User data.
     */
    var removeLink = function(toRemove){
        var lookingFor = toRemove.id;
        var index = searchIndex(lookingFor, userLinksObj.links);
        userLinksObj.links.splice(index, 1);
        return userLinksObj;
    };
    
    /**
     * Update the list according to whether a link was added or
     * removed by either adding or removing from the user's link list.
     * array (based on the operation it is passed).
     * @param {Object} operation What operation to perform; either "add" or "remove".
     * @param {Object} id The id of the link to perform the operation on.
     * @param {Object} data User's current data.
     */
    var updateLinkList = function(operation, toOperateOn, data){
        // User added a link to their data list.
        if (operation === "add") {
            updateduserLinksObj = addLink(toOperateOn, data);
        }
        // User removed a link from their data list.
        if (operation === "remove") {
            updateduserLinksObj = removeLink(toOperateOn, data);
        }
        else {
            // throw an error...
        }
        saveLinkList(updateduserLinksObj);
    };
    /**
     * Function for when user checks a link in the featured section.
     * Will have id format of id.
     * @param {Object} toCheck Checkbox element that was checked.
     * @param {Object} data User's current data.
     */
    var checkFeatured = function(toCheck){
        var id = toCheck.next("label").attr("id");
        // The information for the link we are about to either check or uncheck.       
        var toOperateOn = {
            id: id,
            name: $("#urlfor_" + id).attr("innerHTML"),
            url: $("#urlfor_" + id).attr("href")
        };
        // The link was previously checked, so now we uncheck it and set its attributes accordingly.
        if (toCheck.is(":checked")) {
            toCheck.next("label").addClass("LabelSelected").attr("title", "Remove from myLinks.");
            $('#' + id + '_box').attr("checked", true);
            $('#' + id + '_label').addClass("LabelSelected").attr("title", "Remove from myLinks.");
            updateLinkList("add", toOperateOn, userLinksObj);
        }
        // The link was previously unchecked, so now we check it and set its attributes accordingly.
        else {
            toCheck.next("label").removeClass("LabelSelected").attr("title", "Add to myLinks.");
            $('#' + id + '_box').attr("checked", false);
            $('#' + id + '_label').removeClass("LabelSelected").attr("title", "Add to myLinks.");
            updateLinkList("remove", toOperateOn, userLinksObj);
        }
    };
    
    /**
     * Function for when user checks a link in the general (all) section.
     * Will have id of format id_label.
     * @param {Object} toCheck Checkbox element that was checked.
     * @param {Object} data User's current data.
     */
    var checkGeneral = function(toCheck){
        // We strip off the "_label" suffix for general links.
        var id = toCheck.next("label").attr("id");
        var pos = id.indexOf("_label");
        var newID = id.slice(0, pos);
        var isFeatured = false;
        // The information for the link we are about to either check or uncheck.
        var toOperateOn = {
            id: newID,
            name: $("#urlfor_" + newID).attr("innerHTML"),
            url: $("#urlfor_" + newID).attr("href")
        };
        var featuredLength = directory.featured.length;
        // We first check if the link is also a featured link.
        for (var k = 0; k < featuredLength; k++) {
            if (directory.featured[k] === newID) {
                isFeatured = true;
            }
        }
        // The link was previously checked, so now we uncheck it and set its attributes accordingly.
        // If it is featured, we also deal with that. 
        if (toCheck.is(":checked")) {
            toCheck.next("label").addClass("LabelSelected").attr("title", "Remove from myLinks.");
            if (isFeatured) {
                $('#' + newID + '_checkbox').attr("checked", true);
                $('#' + newID).addClass("LabelSelected").attr("title", "Remove from myLinks.");
            }
            updateLinkList("add", toOperateOn, userLinksObj);
        }
        // The link was previously unchecked, so now we check it and set its attributes accordingly.
        // If it is featured, we also deal with that. 
        else {
            toCheck.next("label").removeClass("LabelSelected").attr("title", "Add to myLinks.");
            if (isFeatured) {
                $('#' + newID + '_checkbox').attr("checked", false);
                $('#' + newID).removeClass("LabelSelected").attr("title", "Add to myLinks.");
            }
            updateLinkList("remove", toOperateOn, userLinksObj);
        }
    };
    
    /**
     * Will react when the user causes a change to any of the checkboxes
     * on the page. It then determines if that checkbox is featured or
     * one of the general (all) links, and calls the appropriate function.
     */
    var checkStars = function(){
        $(":checkbox").change(function(data){
            if ($(this).attr("class") === "FeaturedCheckBoxClass") {
                checkFeatured($(this), userLinksObj);
            }
            if ($(this).attr("class") === "CheckBoxClass") {
                checkGeneral($(this), userLinksObj);
            }
        });
    };
    
    /**
     * Pre-checking the stars of the links the user has saved in their data.
     */
    var preCheckStars = function(){
        var length = userLinksObj.links.length;
        $(":checkbox").each(function(){
            var id = $(this).next("label").attr("id");
            for (var i = 0; i < length; i++) {
                if (id === userLinksObj.links[i].id || id === userLinksObj.links[i].id + "_label") {
                    $(this).attr("checked", true);
                    if ($(this).next("label").attr("class") !== "LabelRequired") {
                        $(this).next("label").addClass("LabelSelected").attr("title", "Remove from myLinks.");
                    }
                }
            }
        });
    };
    
    /**
     * Runs through the trimpath functions to populate the page with
     * the proper data.
     * @param {Object} directory All links, number of columns, and featured links.
     * @param {Object} userLinks User's current data.
     */
    var createDirectory = function(directory, userLinks){
        $suggestedSites.html($.TemplateRenderer(suggested_sites_template, directory));
        $allSites.html($.TemplateRenderer(all_sites_template, directory));
        preCheckStars(userLinks);
        checkStars(userLinks);
    };
    
    /**
     * A getter function that gets and creates the directory of links.
     */
    var getAndCreateDirectory = function(userLinks){
        $.ajax({
            url: directoryLinksLocation,
            cache: false,
            success: function(returnedDirectory){
                directory = returnedDirectory;
                userLinksObj = userLinks;
                createDirectory(directory, userLinks);
            },
            error: function(xhr, textStatus, thrownError){
                //alert("An error has occured");
                return null;
            }
        });
    };
    
    /**
     * Retrieves the current list of links for the current user
     * if the user does have any links, returns the default list
     * @param {Boolean} success Whether the loadJSON got its data.
     * @param {Object} data Contains the user's links record.
     */
    // If data is empty, then throw an error.
    var loadLinksList = function(success, data){
        getAndCreateDirectory(data);
    };
    
    // First get user's link list, then populate directory with static directory data.
    var doInit = function(){
        sakai.api.Server.loadJSON(linksDataNode, loadLinksList);
    };
    
    doInit();
    
};

sakai.api.Widgets.Container.registerForLoad("sakai.links");
