/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
/*global $, Config, opensocial */

var sakai = sakai || {};
sakai.notificationsinbox = function(){

    /**
     *
     * CONFIGURATION
     *
     */
    sakai.config.URL.ALL_MESSAGE_BOX_SERVICE = "/var/message/box.json";
    
    var messagesPerPage = 12; // The number of messages per page
    var allMessages = []; // Array that will hold all the messages
    var me = sakai.data.me;
    var generalMessageFadeOutTime = 3000; // The amount of time it takes till the general message box fades out
    var selectedMessage = {}; // The current message
    var selectedType = 'drafts';
    var selectedCategory = "";
    var sortOrder = "descending";
    var sortBy = "date";
    var currentPage = 0;
    var messagesForTypeCat; // The number of messages for this type/cat
    var cats = "";
    var chooseCategory = {"Message": "message", "Reminder": "reminder"};
    var inboxComposeNewPanelOpen = false;
    
    /**
     *
     * CSS IDS
     *
     */
    var inbox = "inbox";
    var inboxID = "#inbox";
    var inboxClass = ".inbox";
    
    // Global vars
    var inboxGeneralMessage = inboxID + "_general_message";
    var inboxMessageError = inbox + "_error_message";
    var inboxMessageNormal = inbox + "_normal_message";
    var inboxPager = inboxID + "_pager";
    var inboxResults = inboxID + "_results";
    var inboxArrow = inboxClass + "_arrow";
    var inboxFolders = inboxID + "_folders";
    
    // Filters on the left side menu
    var inboxFilter = inboxID + "_filter";
    var inboxFilterClass = inboxClass + "_filter";
    var inboxFilterDrafts = inboxFilter + "_drafts";   
    var inboxFilterQueue = inboxFilter + "_queue";
    var inboxFilterArchive = inboxFilter + "_archive";
    var inboxFilterTrash = inboxFilter + "_trash";  
    var inboxBold = inbox + "_bold";
    var currentFilter;
    
    // Different panes (inbox, notification detail)
    var inboxPane = inboxID + "_pane";
    var inboxPaneClass = inboxClass + "_pane";
    var inboxPaneInbox = inboxPane + "_inbox";
    var inboxPaneCompose = inboxPane + "_compose";
    var inboxPaneMessage = inboxPane + "_message";
    
    // Main inbox view
    var inboxTable = inboxID + "_table";
    var inboxTablePreloader = inboxTable + "_preloader";
    var inboxTableHeader = inboxTable + "_header";
    var inboxTableHeaderFrom = inboxTableHeader + "_from";
    var inboxTableHeaderFromContent = inboxTableHeaderFrom + " span";
    var inboxTableMessage = inboxClass + "_message"; // A row in the table
    var inboxTableMessageID = inboxTable + "_message_";
    var inboxTableMessagesTemplate = inbox + "_" + inbox + "_messages_template";
    var inboxTableSubject = inboxTable + "_subject_";
    
    var inboxInbox = inboxID + "_inbox";
    var inboxInboxClass = inboxClass + "_inbox";
    
    var inboxInboxSortUp = inboxInbox + "_sort_up";
    var inboxInboxSortDown = inboxInbox + "_sort_down";
    
    var inboxInboxCheckAll = inboxInbox + "_checkAll";    
    
    var inboxInboxMessage = inboxInboxClass + "_message";
    var inboxInboxHeader = inboxInboxClass + "_header";
    var inboxInboxCheckMessage = inboxInboxClass + "_check_message";
    
    var inboxTableHeaderSort = inboxInboxClass + "_table_header_sort";
        
    // Specific message
    var inboxSpecificMessage = inboxID + "_message";    
    var inboxSpecificMessageBody = inboxSpecificMessage + "_body";
    var inboxSpecificMessageDate = inboxSpecificMessage + "_date";
    var inboxSpecificMessageFrom = inboxSpecificMessage + "_from";
    var inboxSpecificMessageSubject = inboxSpecificMessage + "_subject";
    var inboxSpecificMessagePicture = inboxSpecificMessage + "_picture";          
    
    // Notification Detail (create or edit notifications)
    var inboxCompose = inboxID + "_compose";
    var inboxComposeNew = inboxCompose + "_new";
    var inboxComposeNewContainer = inboxComposeNew + "_container";       
    var inboxComposeNewPanel = inboxComposeNew + "_panel";  
       
    // Errors and messages
    var inboxGeneralMessages = inboxID + "_generalmessages";
    var inboxGeneralMessagesError = inboxGeneralMessages + "_error";
    var inboxGeneralMessagesErrorGeneral = inboxGeneralMessagesError + "_general";
    var inboxGeneralMessagesErrorReadFail = inboxGeneralMessagesError + "_read_fail";
    var inboxGeneralMessagesNrNewMessages = inboxGeneralMessages + "_nr_new_messages";
    var inboxGeneralMessagesDeleted = inboxGeneralMessages + "_deleted";
    var inboxGeneralMessagesDeleted_1 = inboxGeneralMessagesDeleted + "_1";
    var inboxGeneralMessagesDeleted_x = inboxGeneralMessagesDeleted + "_x";
    var inboxGeneralMessagesMoved = inboxGeneralMessages + "_moved";
    var inboxGeneralMessagesMoved_1 = inboxGeneralMessagesMoved + "_1";
    var inboxGeneralMessagesMoved_x = inboxGeneralMessagesMoved + "_x";
    var inboxGeneralMessagesSent = inboxGeneralMessages + "_sent";
    var inboxGeneralMessagesDeletedFailed = inboxGeneralMessagesDeleted + "_failed";
    var inboxGeneralMessagesSendFailed = inboxGeneralMessages + "_send_fail";
    var inboxGeneralMessagesMovedFailed = inboxGeneralMessagesMoved + "_failed";      
        
    // Keep JSLint.com happy...    
    var getCount = function(){
    };
    var getAllMessages = function(){
    };
    
    /**
     *
     * AID FUNCTIONS
     *
     */
    var unreadMessages = 0;
    
    /**
     * This function will redirect the user to the login page.
     */
    var redirectToLoginPage = function(){
        document.location = sakai.config.URL.GATEWAY_URL;
    };
    
    /**
     * This will show the preloader.
     */
    var showLoader = function(){
        $(inboxTable).append($.TemplateRenderer(inboxTablePreloader.substring(1), {}));
    };
    
    /**
     * Scroll to a specific element in a page.
     * @param {Object} element The element you want to scroll to.
     */
    var scrollTo = function(element){
        $("html, body").animate({
            scrollTop: element.offset().top
        }, 1);
    };
    
    /**
     * Shows a general message on the top screen.
     * @param {String} msg The message you want to display.
     * @param {Boolean} isError True for error (red block) or false for normal message(green block).
     */
    var showGeneralMessage = function(msg, isError){    
        // Check whether to show an error type message or an information one.
        var type = isError ? sakai.api.Util.notification.type.ERROR : sakai.api.Util.notification.type.INFORMATION;
        
        // Show the message to the user.
        sakai.api.Util.notification.show("", msg, type);        
    };
    
    /**
     * This will hide all the panes.
     */
    var hideAllPanes = function(){
        $(inboxPaneClass).hide();
    };
    
    /**
     * Will show the required pane and hide all the others.
     * @param {String} pane The id of the pane you want to show.
     */
    var showPane = function(pane){
        // We do a check to see if the pane isn't already visible.
        // Otherwise, we get an annoying flicker.
        if (!$(pane).is(":visible")) {
            hideAllPanes();
            $(pane).show();
        }
    };
    
    /**
     * Check or uncheck all messages depending on the top checkbox.
     */
    var tickMessages = function(){
        $(inboxInboxCheckMessage).attr("checked", ($(inboxInboxCheckAll).is(":checked") ? "checked" : ''));
    };
    
    /**
     * This will display the first page of the specified messages.
     * @param {String} type The type of the messages (inbox, queue, archive, trash or * for all of them). 
     * @param {String} read Whether we should fetch messages that are read, unread or all of them. (options: true, false, all)
     * @param {String} id The id of the filter that got clicked in the side panel.
     */
    var filterMessages = function(type, read, id){            
        // The small header/titlebar above the current pane.
        $(inboxInboxHeader).hide();
        $(inboxID + "_" + type).show();               
        
        // Remember the type we want to see.
        selectedType = type;
        
        // Display the first page of msgs.       
        showPage(1);
        
        // Show the inbox pane.
        showPane(inboxPaneInbox);
        
        // Set the title bold.
        $(inboxFilterClass).removeClass(inboxBold);
        $(id).addClass(inboxBold);
    };
    
    /**
     * Removes all the messages out of the DOM.
     * It will also remove the preloader in the table.
     */
    var removeAllMessagesOutDOM = function(){
        $(inboxTableMessage).remove();
    };
    
        
    /**
     *
     * RENDER MESSAGES
     *
     */    
 
    /**
     * Used for the date formatter.
     */
    var replaceChars = {
        date: new Date(),
        shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        
        // Day
        d: function(){
            return (replaceChars.date.getDate() < 10 ? '0' : '') + replaceChars.date.getDate();
        },
        D: function(){
            return replaceChars.shortDays[replaceChars.date.getDay()];
        },
        j: function(){
            return replaceChars.date.getDate();
        },
        l: function(){
            return replaceChars.longDays[replaceChars.date.getDay()];
        },
        N: function(){
            return replaceChars.date.getDay() + 1;
        },
        S: function(){
            return (replaceChars.date.getDate() % 10 === 1 && replaceChars.date.getDate() !== 11 ? 'st' : (replaceChars.date.getDate() % 10 === 2 && replaceChars.date.getDate() !== 12 ? 'nd' : (replaceChars.date.getDate() % 10 === 3 && replaceChars.date.getDate() !== 13 ? 'rd' : 'th')));
        },
        w: function(){
            return replaceChars.date.getDay();
        },
        z: function(){
            return "Not Yet Supported";
        },
        // Week
        W: function(){
            return "Not Yet Supported";
        },
        // Month
        F: function(){
            return replaceChars.longMonths[this.getMonth()];
        },
        m: function(){
            return (replaceChars.date.getMonth() < 11 ? '0' : '') + (replaceChars.date.getMonth() + 1);
        },
        M: function(){
            return replaceChars.shortMonths[replaceChars.date.getMonth()];
        },
        n: function(){
            return replaceChars.date.getMonth() + 1;
        },
        t: function(){
            return "Not Yet Supported";
        },
        // Year
        L: function(){
            return "Not Yet Supported";
        },
        o: function(){
            return "Not Supported";
        },
        Y: function(){
            return replaceChars.date.getFullYear();
        },
        y: function(){
            return ('' + replaceChars.date.getFullYear()).substr(2);
        },
        // Time
        a: function(){
            return replaceChars.date.getHours() < 12 ? 'am' : 'pm';
        },
        A: function(){
            return replaceChars.date.getHours() < 12 ? 'AM' : 'PM';
        },
        B: function(){
            return "Not Yet Supported";
        },
        g: function(){
            return replaceChars.date.getHours() % 12 || 12;
        },
        G: function(){
            return replaceChars.date.getHours();
        },
        h: function(){
            return ((replaceChars.date.getHours() % 12 || 12) < 10 ? '0' : '') + (replaceChars.date.getHours() % 12 || 12);
        },
        H: function(){
            return (replaceChars.date.getHours() < 10 ? '0' : '') + replaceChars.date.getHours();
        },
        i: function(){
            return (replaceChars.date.getMinutes() < 10 ? '0' : '') + replaceChars.date.getMinutes();
        },
        s: function(){
            return (replaceChars.date.getSeconds() < 10 ? '0' : '') + replaceChars.date.getSeconds();
        },
        // Timezone
        e: function(){
            return "Not Yet Supported";
        },
        I: function(){
            return "Not Supported";
        },
        O: function(){
            return (replaceChars.date.getTimezoneOffset() < 0 ? '-' : '+') + (replaceChars.date.getTimezoneOffset() / 60 < 10 ? '0' : '') + (replaceChars.date.getTimezoneOffset() / 60) + '00';
        },
        T: function(){
            return "Not Yet Supported";
        },
        Z: function(){
            return replaceChars.date.getTimezoneOffset() * 60;
        },
        // Full Date/Time
        c: function(){
            return "Not Yet Supported";
        },
        r: function(){
            return replaceChars.date.toString();
        },
        U: function(){
            return replaceChars.date.getTime() / 1000;
        }
    };
    
    
    /**
     * Format a date to a string.
     * See replaceChars for the specific options.
     * @param {Date} d 
     * @param {String} format
     */
    var formatDate = function(d, format){
        var returnStr = '';
        replaceChars.date = d;
        var replace = replaceChars;
        for (var i = 0; i < format.length; i++) {
            var curChar = format.charAt(i);
            if (replace[curChar]) {
                returnStr += replace[curChar].call(d);
            }
            else {
                returnStr += curChar;
            }
        }
        return returnStr;
    };
    
    /**
     * Adds the correct format to a message.
     * ex: parsing the date
     * @param {Object} message
     */
    var formatMessage = function(message){            
        var dateString = message["sakai:sendDate"];
        var d = new Date();
        d.setFullYear(parseInt(dateString.substring(0, 4), 10));
        d.setMonth(parseInt(dateString.substring(5, 7), 10) - 1);
        d.setDate(parseInt(dateString.substring(8, 10), 10));
        d.setHours(parseInt(dateString.substring(11, 13), 10));
        d.setMinutes(parseInt(dateString.substring(14, 16), 10));
        d.setSeconds(parseInt(dateString.substring(17, 19), 10));
        //Jan 22, 2009 10:25 PM
        message.date = formatDate(d, "M j, Y");
              
        if (message.previousMessage) {
            message.previousMessage = formatMessage(message.previousMessage);
        }
        
        // pictures
        if (message.userFrom && $.isArray(message.userFrom)) {
            for (var i = 0, il = message.userFrom.length; i < il; i++) {
                if (message.userFrom[i].picture && $.parseJSON(message.userFrom[i].picture).name) {
                    message.userFrom[i].photo = $.parseJSON(message.userFrom[i].picture).name;
                }
            }
        }        
        if (message.userTo && $.isArray(message.To)) {
            for (var j = 0, jl = message.userTo.length; j < jl; j++) {
                if (message.userTo[j].picture && $.parseJSON(message.userTo[j].picture).name) {
                    message.userTo[j].photo = $.parseJSON(message.userTo[j].picture).name;
                }
            }
        }
        
        return message;
    };
    
    /**
     * Renders the messages.
     * @param {Object} The JSON response from the server. Make sure it has a .message array in it.
     */
    var renderMessages = function(response){                  
        for (var j = 0, l = response.results.length; j < l; j++) {
            // temporary internal id.
            // Use the name for the id.
            response.results[j].nr = j;
            response.results[j].subject = response.results[j]["sakai:subject"];
            response.results[j].body = response.results[j]["sakai:body"];
            response.results[j].messagebox = response.results[j]["sakai:messagebox"];
            response.results[j] = formatMessage(response.results[j]);
        }
        
        allMessages = response.results;
        
        // show messages
        var tplData = {
            "messages": response.results
        };
        
        // remove previous messages
        removeAllMessagesOutDOM();
        
        // add them to the DOM
        $(inboxTable).children("tbody").append($.TemplateRenderer(inboxTableMessagesTemplate, tplData));
        
        // do checkboxes
        tickMessages();
    };
    
    /**
     *
     * PAGER
     *
     **/
    
    /**
     * Show a certain page of messages.
     * @param {int} pageNumber The page number you want to display.
     */
    var showPage = function(pageNumber){       
        // Remove all messages.
        // remove previous messages.
        removeAllMessagesOutDOM();
        // Set the pager.
        // removing paging for POC - eli 10.5.10
        // pageMessages(pageNumber);
        // Remember which page were on.
        // currentPage = pageNumber - 1;
        // Show set of messages.
        getAllMessages();
    };
    
    /**
     * Draw up the pager at the bottom of the page.
     * @param {int} pageNumber The number of the current page
     */
    pageMessages = function(pageNumber){       
        $(inboxPager).pager({
            pagenumber: pageNumber,
            pagecount: Math.ceil(messagesForTypeCat / messagesPerPage),
            buttonClickCallback: showPage
        });
        currentPage = pageNumber;
    };       
    
    /**
     *
     * SERVER FUNCTIONS
     *
     **/
    
    /**
     * Gets all the messages from the JCR.
     */
    getAllMessages = function(callback){            

        var url = sakai.config.URL.ALL_MESSAGE_BOX_SERVICE + "?box=" + selectedType;        
        
        var types = "&types=" + selectedType;
        if (typeof selectedType === "undefined" || selectedType === "") {
            types = "";
        }
        else 
            if (typeof selectedType === "Array") {
                types = "&types=" + selectedType.join(",");
            }        
        
        $.ajax({
            url: url,
            cache: false,
            success: function(data){
                if (data.results) {                
                    // Render the messages
                    renderMessages(data);                   
                }
                if (typeof callback !== "undefined") {
                    callback();
                }                
            },
            error: function(xhr, textStatus, thrownError){
                showGeneralMessage($(inboxGeneralMessagesErrorGeneral).text());
                $(inboxResults).html(sakai.api.Security.saneHTML($(inboxGeneralMessagesErrorGeneral).text()));
            }
        });
    };
            
    
    /**
     *
     * DISPLAY SPECIFIC MESSAGE
     *
     */
    
    /**
     * Get the message out of the list with the specific id.
     * @param {String} id The id of a message.
     */
    var getMessageWithId = function(id){
        for (var i = 0, j = allMessages.length; i < j; i++) {
            if (allMessages[i]["jcr:name"] === id) {
                return allMessages[i];
            }
        }        
        return {};
    };
    
    
    /**
     * Displays only the message with that id.
     * @param {String} id The id of a message.
     */
    var displayMessage = function(id){                          
        // Get the specific message data.
        selectedMessage = getMessageWithId(id);
        if (typeof selectedMessage !== "undefined") {            
            var messageBox = selectedMessage["sakai:messagebox"]; 
                       
            // Show the correct nofitication detail pane to get ready for the widget.                          
            showPane(inboxPaneCompose);                       
            
            // Initialise the widget, which will prepopulate the fields.
            sakai.composenotification.initialise(messageBox, selectedMessage);                                                              
        }                          
    }               
        
    /**
     *
     * SEND MESSAGE
     *
     **/
    
    /**
     * When a message has been sent this function gets called.
     * @param {Object} data A JSON object that contains the response from the server.
     */
    var sendMessageFinished = function(success, data){    
        showGeneralMessage($(inboxGeneralMessagesSent).text(), false);                        
    };
    
    
    /**
     *
     * DELETING A MESSAGE
     *
     **/
    
    /**
     * Removes all the messages from memory that are in pathToMessages if success = true
     * success = false will show an error.
     * @param {String[]} pathToMessages
     * @param {Boolean} success
     */
    var deleteMessagesFinished = function(pathToMessages, success){
        if (success) {
            // Repage the inbox.
            
            currentPage = currentPage + 1;
            showPage(currentPage);
            
            var txt = "";
            if (pathToMessages.length === 1) {
                txt = $(inboxGeneralMessagesDeleted_1).text();
            }
            else {
                txt = pathToMessages.length + $(inboxGeneralMessagesDeleted_x).text();
            }
            
            showGeneralMessage(txt, false);
        }
        else {
            showGeneralMessage($(inboxGeneralMessagesDeletedFailed).text());
        }
    };
    
    /**
     * This will do a DELETE request to the specified path and harddelete that message.
     * @param {String[]} path The message that you want to delete.
     * @param {int} index The index of the array that needs to be deleted.
     */
    var hardDeleteMessage = function(pathToMessages) {
        var requests = [];
        $(pathToMessages).each(function(i,val) {
            var req = {
                "url": val,
                "method": "POST",
                "parameters": {
                    ":operation": "delete"
                }
            };
            requests.push(req);
        });
        $.ajax({
            url: sakai.config.URL.BATCH,
            traditional: true,
            type: "POST",
            data: {
                requests: $.toJSON(requests)
            },
            success: function(data) {
                deleteMessagesFinished(pathToMessages, true);
            },
            error: function(xhr, textStatus, thrownError) {
               deleteMessagesFinished(pathToMessages, false);
            }
        });
    };
    
    /**
     * Delete all the messages that are in path.
     * Hard delete is for if we are calling this from the trash pane.
     * @param {Array} pathToMessages An array of ids that have to be deleted.
     * @ param {boolean} hardDelete Are we calling this from trash?
     */
    var deleteMessages = function(pathToMessages, hardDelete){    
        if (typeof hardDelete === "undefined") {
            hardDelete = false;
        }
        if (hardDelete) {
            // We will have to do a hard delete to all the JCR files.
            hardDeleteMessage(pathToMessages);
        }
        else {
            var toDelete = pathToMessages.length;
            var deleted = 0;
            
            for (var d = 0, e = pathToMessages.length; d < e; d++) {
                $.ajax({
                    url: pathToMessages[d],
                    type: "POST",
                    success: function(data){
                        deleted++;
                        if (deleted === toDelete) {
                            deleteMessagesFinished(pathToMessages, true);
                        }
                    },
                    error: function(xhr, textStatus, thrownError){
                        deleted++;
                        if (deleted === toDelete) {
                            deleteMessagesFinished(pathToMessages, false);
                        }
                    },
                    data: {
                        "sakai:messagebox": "trash",
                        "_charset_": "utf-8"
                    }
                });
            }
        }
    };
    
    /**
     * Delete all checked messages on current page.
     */
    var deleteChecked = function(){   
        // pathToMessages = an array of all checked messages    
        var pathToMessages = [];
        $(inboxInboxCheckMessage + ":checked").each(function(){
            var pathToMessage = $(this).val();
            pathToMessages.push(pathToMessage);
        });    
            
        // Reset 'Check All' checkbox just in case it's clicked.
        $(inboxInboxCheckAll).attr("checked", false);
        
        // If we are in trash we hard delete the messages.
        deleteMessages(pathToMessages, (selectedType === sakai.config.Messages.Types.trash));
    };        
    
    
    /**
     *
     * EVENT HANDLING
     *
     */
    // For when user clicks on "Create New" button.
    $("#inbox-new-button").live("click", function(){
        showPane(inboxPaneCompose);
        // unhighlight the tabs
        $("[id|=tab]").removeClass("current_tab");
        // initialise the composenotification widget  
        sakai.composenotification.initialise(null, null);        
    });
    
    // For when user cancels notification authoring (cancel button on pane 2).
    $("#cn-cancel-button").live("click", function(){
        // jump back to previous pane
        showPane(inboxPaneInbox);
        $(".inbox_inbox_header").each(function(){            
            if ($(this).is(":visible")) {
                correctHighlightedTab($(this).attr("id").substring(6, $(this).attr("id").length));
            }
        });
        $(inboxInboxCheckAll).attr("checked", false);
    });
    
    // Various filter functions.
    $(inboxFilterDrafts).click(function(){       
        filterMessages("drafts", "", "all", inboxFilterDrafts);
        correctButtonList("drafts");   
        correctHighlightedTab("drafts");     
        $(inboxInboxCheckAll).attr("checked", false);
    });
    
    $(inboxFilterQueue).click(function(){              
        filterMessages("queue", "", "all", inboxFilterQueue);  
        correctButtonList("queue");
        correctHighlightedTab("queue");    
        $(inboxInboxCheckAll).attr("checked", false);         
    });
    
    $(inboxFilterArchive).click(function(){             
        filterMessages("archive", "", "all", inboxFilterArchive);         
        correctButtonList("archive");
        correctHighlightedTab("archive");
        $(inboxInboxCheckAll).attr("checked", false);
    });
    
    $(inboxFilterTrash).click(function(){        
        filterMessages(sakai.config.Messages.Types.trash, "", "all", inboxFilterTrash);
        correctButtonList("trash");
        correctHighlightedTab("trash");
        $(inboxInboxCheckAll).attr("checked", false);
    });        
           
    // Check all messages.
    $(inboxInboxCheckAll).change(function(){
        tickMessages();
    });    
    
    // Delete all checked messages on drafts page.
    $("#inbox-draftsdelete-button").click(function(){               
        deleteChecked();        
    });
    
    // Copy the checked messages on the drafts page.
    $("#inbox-copy-button").click(function() {
        //copyChecked("drafts");
        alert("COPY FUNCTIONALITY NEEDS TO BE FINISHED");
    });
    
    // Delete all checked messages on queue page.
    $("#inbox-queuedelete-button").click(function(){               
        deleteChecked();            
    });  
    
    $("#inbox-emptytrash-button").click(function(){
        deleteChecked();
    });              
    
    $("#inbox-movetodrafts-button").click(function() {
       moveChecked("drafts"); 
    });
    
     var moveMessagesFinished = function(pathToMessages, success, toWhere){        
        if (success) {
            // Repage the inbox.            
            currentPage = currentPage + 1;
            showPage(currentPage);
            
            var txt = "";
            if (pathToMessages.length === 1) {
                txt = $(inboxGeneralMessagesMoved_1).text()+toWhere+".";
            }
            else {
                txt = pathToMessages.length+$(inboxGeneralMessagesMoved_x).text()+toWhere+".";
            }
            
            showGeneralMessage(txt, false);
        }
        else {
            showGeneralMessage($(inboxGeneralMessagesMovedFailed).text());
        }
    };
    
    var moveMessages = function(pathToMessages, toWhere){
        alert("moveMessages called!");
        var toMove = pathToMessages.length;
        var moved = 0;
        
        for (var d = 0, e = pathToMessages.length; d < e; d++) {
            $.ajax({
                url: pathToMessages[d],
                type: "POST",
                success: function(data){
                    moved++;
                    if (moved === toMove) {
                        moveMessagesFinished(pathToMessages, true, toWhere);
                    }
                },
                error: function(xhr, textStatus, thrownError){
                    moved++;
                    if (moved === toMove) {
                        moveMessagesFinished(pathToMessages, false);
                    }
                },
                data: {
                    "sakai:messagebox": toWhere,
                    "_charset_": "utf-8"
                }
            });
        }        
    }
    
    var moveChecked = function(toWhere){
        alert("moveChecked called!");
        // pathToMessages = an array of all checked messages    
        var pathToMessages = [];
        $(inboxInboxCheckMessage + ":checked").each(function(){
            var pathToMessage = $(this).val();
            pathToMessages.push(pathToMessage);
        });
        
        // Reset 'Check All' checkbox just in case it's clicked.
        $(inboxInboxCheckAll).attr("checked", false);
                
        moveMessages(pathToMessages, toWhere);
    }                 
    
    /**
     *
     * SHOW A SPECIFIC MESSAGE
     *
     */
    $(inboxInboxMessage).live("click", function(e, ui){    
        var id = e.target.id;
        id = id.split('_');
        displayMessage(id[id.length - 1]);
    });
    
    /**
     * Highlights the current filter the user is on.
     * First unhighlights all tabs, then correctly highlights the current tab.
     * @param {Object} type The type of filter whose tab we want highlighted.
     */
    var correctHighlightedTab = function(type){       
        $("[id|=tab]").removeClass("current_tab");
        $("#tab-"+type).addClass("current_tab");
    };
    
    /**
     * Toggles the bottom button list between filters. 
     * First hides all visible button lists, then displays the correct one.     
     * @param {Object} type The type of filter whose button list we want visible.
     */
    var correctButtonList = function(type) {    
        alert("Putting "+type); 
        $("[id|=buttons]").hide();
        $("#buttons-"+type).show();
    };           
       
    // Sorters for the inbox.
    $(inboxTableHeaderSort).bind("mouseenter", function(){
        if (sortOrder === 'descending') {
            $(this).append(sakai.api.Security.saneHTML($(inboxInboxSortUp).html()));
        }
        else {
            $(this).append(sakai.api.Security.saneHTML($(inboxInboxSortDown).html()));
        }
    });
    $(inboxTableHeaderSort).bind("mouseout", function(){
        $(inboxTable + " " + inboxArrow).remove();
    });
    $(inboxTableHeaderSort).bind("click", function(){
        sortBy = $(this).attr("id").replace(/inbox_tableHeader_/gi, "");
        sortOrder = (sortOrder === "descending") ? "ascending" : "descending";
        
        getAllMessages();
    });      
    
    /**
     *
     * Init
     *
     */
    var doInit = function(){
        // Check if we are logged in or out.
        var person = sakai.data.me;
        var uuid = person.user.userid;
        if (!uuid || person.user.anon) {
            redirectToLoginPage();
        }
        else {
            // We are logged in. Do all the necessary stuff.
            // Load the list of messages.            
            getAllMessages();
            
            var qs = new Querystring();
            var qs_messageid = qs.get("message");
            
            if (qs_messageid) {            
                var callback = function(){
                    displayMessage(qs_messageid);
                };                
                getAllMessages(callback);                
            }
            else {            
                // Show messages by default (as if click on "Inbox").
                filterMessages("drafts", "", "all", inboxFilterDrafts);
            }            
        }        
    };    
    doInit();
};

sakai.api.Widgets.Container.registerForLoad("sakai.notificationsinbox");

