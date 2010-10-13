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

/* global $, Config, opensocial */

var sakai = sakai || {};
sakai.listpage = function(){
    /**
     *
     * Configuration
     *
     */
    var submitData; // Data to be passed to saveJSON
    var allLists = []; // Array of all the lists
    var userUrl;
    var generalMessageFadeOutTime = 3000; // The amount of time it takes till the general message box fades out
    var sortBy = "name";
    var sortOrder = "descending";
    var editExisting = false;
    var currList;


    /**
     *
     * CSS IDs
     *
     */
    var inboxID = "#inbox";
    var inboxClass = ".inbox";
    var inbox = "inbox";
    var inboxArrow = inboxClass + "_arrow";
    var inboxTable = inboxID + "_table";
    var inboxTablePreloader = inboxTable + "_preloader";
    var inboxGeneralMessage = inboxID + "_general_message";
    var inboxMessageError = inbox + "_error_message";
    
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
     * Shows a general message on the top screen
     * @param {String} msg    the message you want to display
     * @param {Boolean} isError    true for error (red block)/false for normal message(green block)
     */
    var showGeneralMessage = function(msg, isError){
    
        // Check whether to show an error type message or an information one
        var type = isError ? sakai.api.Util.notification.type.ERROR : sakai.api.Util.notification.type.INFORMATION;
        
        // Show the message to the user
        sakai.api.Util.notification.show("", msg, type);
        
    };
    
    /**
     * Check or uncheck all messages depending on the top checkbox.
     */
    var tickMessages = function(){
        $(".inbox_inbox_check_list").attr("checked", ($("#inbox_inbox_checkAll").is(":checked") ? "checked" : ''));
    };
    
    var getDataFromInput = function() {
        var result = {};
        
        result.listName = $("#list_name").val();
        result.desc = $("#description").val();
        result.size = $("#list_size").val();
        
        var index = document.createListForm.context.selectedIndex;
        var selectedContext = document.createListForm.context.options[index].value;
        result.context = selectedContext;
        
        var selectedMajors = [];
        $(".major_checkbox:checked").each(function() {
            var major = $(this).val();
            selectedMajors.push(major);
        });
        result.major = selectedMajors;
        
        var standingArray = [];
        index = document.createListForm.standing.selectedIndex;
        var selectedStanding = document.createListForm.standing.options[index].value;
        if(selectedStanding === "all" || selectedStanding === "All") {
            standingArray.push("undergrad");
            standingArray.push("grad");
        } else {
            standingArray.push(selectedStanding)
        }
        result.standing = standingArray;
        
        return result;
    }
    
    /**
     * Updates the input field that displays the current size of the list being created
     */
    sakai.listpage.updateListSize = function(){
        var data = getDataFromInput();

        // DEBUGGING:
        // var size = query(selectedContext, selectedMajor, selectedStanding);
        // document.createListForm.list_size.value = size;
    }
    
    /**
     * Clears input fields
     */
    var clearInputFields = function() {
        document.getElementById("createListForm").reset();
        sakai.listpage.updateListSize();
    };
    
    // TODO: Document properties.
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
        d: function() {
            return (replaceChars.date.getDate() < 10 ? '0' : '') + replaceChars.date.getDate();
        },
        D: function() {
            return replaceChars.shortDays[replaceChars.date.getDay()];
        },
        j: function() {
            return replaceChars.date.getDate();
        },
        l: function() {
            return replaceChars.longDays[replaceChars.date.getDay()];
        },
        N: function() {
            return replaceChars.date.getDay() + 1;
        },
        S: function() {
            return (replaceChars.date.getDate() % 10 === 1 && replaceChars.date.getDate() !== 11 ? 'st' : (replaceChars.date.getDate() % 10 === 2 && replaceChars.date.getDate() !== 12 ? 'nd' : (replaceChars.date.getDate() % 10 === 3 && replaceChars.date.getDate() !== 13 ? 'rd' : 'th')));
        },
        w: function() {
            return replaceChars.date.getDay();
        },
        z: function() {
            return "Not Yet Supported";
        },
        // Week
        W: function() {
            return "Not Yet Supported";
        },
        // Month
        F: function() {
            return replaceChars.longMonths[this.getMonth()];
        },
        m: function() {
            return (replaceChars.date.getMonth() < 11 ? '0' : '') + (replaceChars.date.getMonth() + 1);
        },
        M: function() {
            return replaceChars.shortMonths[replaceChars.date.getMonth()];
        },
        n: function() {
            return replaceChars.date.getMonth() + 1;
        },
        t: function() {
            return "Not Yet Supported";
        },
        // Year
        L: function() {
            return "Not Yet Supported";
        },
        o: function() {
            return "Not Supported";
        },
        Y: function() {
            return replaceChars.date.getFullYear();
        },
        y: function() {
            return ('' + replaceChars.date.getFullYear()).substr(2);
        },
        // Time
        a: function() {
            return replaceChars.date.getHours() < 12 ? 'am' : 'pm';
        },
        A: function() {
            return replaceChars.date.getHours() < 12 ? 'AM' : 'PM';
        },
        B: function() {
            return "Not Yet Supported";
        },
        g: function() {
            return replaceChars.date.getHours() % 12 || 12;
        },
        G: function() {
            return replaceChars.date.getHours();
        },
        h: function() {
            return ((replaceChars.date.getHours() % 12 || 12) < 10 ? '0' : '') + (replaceChars.date.getHours() % 12 || 12);
        },
        H: function() {
            return (replaceChars.date.getHours() < 10 ? '0' : '') + replaceChars.date.getHours();
        },
        i: function() {
            return (replaceChars.date.getMinutes() < 10 ? '0' : '') + replaceChars.date.getMinutes();
        },
        s: function() {
            return (replaceChars.date.getSeconds() < 10 ? '0' : '') + replaceChars.date.getSeconds();
        },
        // Timezone
        e: function() {
            return "Not Yet Supported";
        },
        I: function() {
            return "Not Supported";
        },
        O: function() {
            return (replaceChars.date.getTimezoneOffset() < 0 ? '-' : '+') + (replaceChars.date.getTimezoneOffset() / 60 < 10 ? '0' : '') + (replaceChars.date.getTimezoneOffset() / 60) + '00';
        },
        T: function() {
            return "Not Yet Supported";
        },
        Z: function() {
            return replaceChars.date.getTimezoneOffset() * 60;
        },
        // Full Date/Time
        c: function() {
            return "Not Yet Supported";
        },
        r: function() {
            return replaceChars.date.toString();
        },
        U: function() {
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
    
    var formatList = function(list){
        var dateString = list["sakai:dateModified"] || "";
        
        var d = new Date();
        d.setFullYear(parseInt(dateString.substring(0, 4), 10));
        d.setMonth(parseInt(dateString.substring(5, 7), 10) - 1);
        d.setDate(parseInt(dateString.substring(8, 10), 10));
        d.setHours(parseInt(dateString.substring(11, 13), 10));
        d.setMinutes(parseInt(dateString.substring(14, 16), 10));
        d.setSeconds(parseInt(dateString.substring(17, 19), 10));
        //format Jan 22, 2009 10:25 PM
        list.date = formatDate(d, "M j, Y g:i A");
        
        list.name = list["sakai:name"];
        list.description = list["sakai:description"];
        
        return list;
    }
    
    /**
     * Removes all the messages out of the DOM.
     * It will also remove the preloader in the table.
     */
    var removeAllListsOutDOM = function(){
        $(".inbox_list").remove();
    };
    
    var renderLists = function(response){
        for (var j = 0, l = response.lists.length; j < l; j++) {
            response.lists[j] = formatList(response.lists[j]);
        }
        allLists = response.lists || [];
        
        var data = {
            "links": response.lists
        }
        
        // remove previous lists
        removeAllListsOutDOM();
        
        // Add them to the DOM
        $(inboxTable).children("tbody").append($.TemplateRenderer("#inbox_inbox_lists_template", data));
        
        // do checkboxes
        tickMessages();
    }
    
    /**
     * Get the dynamic list out of the list with the specific id.
     * @param {String} id    The id of a dynamic list
     */
    var getListWithId = function(id){
        for (var i = 0, j = allLists.length; i < j; i++) {
            if (allLists[i]["sakai:id"] === id) {
                return allLists[i];
            }
        }
        return {};
    };
    
    /**
     * Returns the index of the list wtih the specific id.
     * @param {Object} id
     */
    var getIndexFromId = function(id) {
        for (var i = 0, j = allLists.length; i < j; i++) {
            if (allLists[i]["sakai:id"] === id) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Displays only the list with that id.
     * @param {String} id    The id of a list
     */
    var displayList = function(id){
        // Display edit list tab
        $.bbq.pushState({"tab": "new"},2);
        
        // Fill in input fields with list data
        var list = getListWithId(id);
        document.createListForm.list_name.value = list["sakai:name"];
        document.createListForm.description.value = list["sakai:description"];
        document.createListForm.list_size.value = list["sakai:size"];
        $("#context").val(list.query.context);
        
        var majorArray = list.query.major;
        for(var i = 0, j = majorArray.length; i < j; i++) {
            var major = majorArray[i].replace(/ /g, "_");
            $("#" + major).attr("checked", true);
        }
        
        var standingArray = list.query.standing;
        if(standingArray.length != 1) {
             $("#standing").val("all");
        } else {
            $("#standing").val(standingArray[0]);
        }
    }

    // Check all messages
    $("#inbox_inbox_checkAll").change(function(){
        tickMessages();
    });
    
    // Sorters for the inbox.
    $(".inbox_inbox_table_header_sort").bind("mouseenter", function() {
        if (sortOrder === 'descending') {
            $(this).append(sakai.api.Security.saneHTML($(inboxInboxSortUp).html()));
        }
        else {
            $(this).append(sakai.api.Security.saneHTML($(inboxInboxSortDown).html()));
        }
    });
    
    $(".inbox_inbox_table_header_sort").bind("mouseout", function() {
        $(inboxTable + " " + inboxArrow).remove();
    });
    
    $(".inbox_inbox_table_header_sort").bind("click", function() {
        sortBy = $(this).attr("id").replace(/inbox_table_header_/gi, "");
        sortOrder = (sortOrder === "descending") ? "ascending" : "descending";

        getAllMessages();
    });
    
    var deleteLists = function(listsArray) { // DEBUG: removing last dynamic list doesn't work
        var listId = listsArray;
        
        for (var i = 0, j = listId.length; i < j; i++) {
            var index = getIndexFromId(listId[i]);
            if(index >= 0) {
                allLists.splice(index, 1);
                $("#inbox_table_list_" + listId[i]).empty();
                $("#inbox_table_list_" + listId[i]).remove();
            } else {
                alert("List not found");
            }
        }
        
        submitData.lists = allLists;
        sakai.api.Server.saveJSON(userUrl, submitData);
        // loadData(); // DEBUG: doesn't seem to work - need to refresh page first?
    };
    
    var saveList = function(index) {
        var data = getDataFromInput();
        
        // DEBUG: need to loop through major/standing array to concatenate values to id?
        var id = "dl-" + data.listName + data.desc + data.context + data.major + data.standing;
        
        if(index != null) { // we are editing an existing list
            allLists[index]["sakai:id"] = id;
            allLists[index]["sakai:name"] = data.listName;
            allLists[index]["sakai:description"] = data.desc;
            allLists[index]["sakai:dateModified"] = "2010-09-13T13:33:36.927-07:00"; // DEBUG: HOW TO MAKE THIS?
            allLists[index]["sakai:dateModified@TypeHint"] = "date";
            allLists[index]["sakai:modifiedBy"] = sakai.data.me.user.userid;
            allLists[index].query.context = "[" + data.context + "]";
            allLists[index].query.standing = data.standing;
            allLists[index].query.major = data.major;
        } else { // we are creating a new list
            if(id === "something") { // DEBUGGING: need to compare with existing lists
                showGeneralMessage($("#inbox_generalmessages_already_exists").text());
                return;
            }
            
            var list = {
                "sakai:id": id,
                "sakai:name": data.listName,
                "sakai:description": data.desc,
                "sakai:dateModified": "2010-09-13T13:33:36.927-07:00", // DEBUG: HOW TO MAKE THIS?
                "sakai:dateModified@TypeHint": "date",
                "sakai:modifiedBy": sakai.data.me.user.userid,
                "query": {
                    "context": [" " + data.selectedContext + " "],
                    "standing": data.standing,
                    "major": data.major
                }
            }
            allLists.push(list);
        }
        
        submitData.lists = allLists;
        sakai.api.Server.saveJSON(userUrl, submitData);
        loadData(); // DEBUG: doesn't seem to work - need to refresh page first?
        clearInputFields();
        $.bbq.pushState({"tab": "existing"},2);
    };
    
    // Button click events
    $("#inbox_inbox_delete_button").live("click", function(){
        var listId = [];
        $(".inbox_inbox_check_list:checked").each(function(){
            var id = $(this).val();
            listId.push(id);
        });

        if (listId.length < 1) {
            showGeneralMessage($("#inbox_generalmessages_none_selected").text());
        } else {
            // $("#delete_check_dialog").jqmShow(); // DEBUG: not working
            deleteLists(listId);
        }
    });
    
    $("#delete_check_dialog").css("position", "absolute");
    $("#delete_check_dialog").css("top", "250px");
    
    $("#dlc-delete").click(function(){
        $("#delete_check_dialog").jqmHide();
        deleteLists();
    });
    
    
    $("#inbox_inbox_duplicate_button").live("click", function(){
        var listId = [];
        $(".inbox_inbox_check_list:checked").each(function(){
            var id = $(this).val();
            listId.push(id);
        });
        
        $(".inbox_inbox_check_list").attr("checked", "");
        tickMessages();

        if (listId.length < 1) {
            showGeneralMessage($("#inbox_generalmessages_none_selected").text());
        } else if (listId.length > 1) {
            showGeneralMessage($("#inbox_generalmessages_edit_multiple").text());
        } else {
            displayList(listId[0]);
        }
    });
    
    $("#inbox_inbox_edit_button").live("click", function(){        
        var listId = [];
        $(".inbox_inbox_check_list:checked").each(function(){
            var id = $(this).val();
            listId.push(id);
        });
        
        $(".inbox_inbox_check_list").attr("checked", "");
        tickMessages();

        if(listId.length < 1) {
            showGeneralMessage($("#inbox_generalmessages_none_selected").text());
        } else if(listId.length > 1) {
            showGeneralMessage($("#inbox_generalmessages_edit_multiple").text());
        } else {
            editExisting = true;
            currList = listId[0];
            displayList(listId[0]);   
        }
    });
    
    $("#inbox_inbox_back_button").live("click", function(){
        window.location = "http://localhost:8080/dev/inboxnotifier.html";
    });
    
    $("#inbox_inbox_cancel_button").live("click", function(){
        editExisting = false;
        clearInputFields();
        $.bbq.pushState({"tab": "existing"},2);
    });
    
    $("#inbox_inbox_save_button").live("click", function(){
        $("#invalid_name").hide();
        $("#invalid_desc").hide();
        $("#invalid_size").hide();
        var listName = $("#list_name").val();
        var desc = $("#description").val();
        //var size = $("#list_size").val(); // DEBUG
        var size = 5;
        
        if(listName.trim() && desc.trim() && size != 0) {
            if(editExisting) {
                saveList(getIndexFromId(currList));
            } else {
                saveList();   
            }
        } else {
            if(!listName.trim()) {
                $("#invalid_name").show();
            }
            if(!desc.trim()) {
                $("#invalid_desc").show();
            }
            if(size == 0) {
                $("#invalid_size").show();
            }
        }
    });
    
    // On selecting checkbox events
    $(".major_checkbox").click(function() {
        sakai.listpage.updateListSize();
    });
    
    // Tab click events
    $("#existing_link").click(function() {
        $.bbq.pushState({"tab": "existing"},2);
        
        // Set headers and tab styling
        $("#inbox_new").hide();
        $("#inbox_existing").show();
        $("#new_list_tab").removeClass("selected_tab");
        $("#existing_lists_tab").addClass("selected_tab");
        
        // Show/hide appropriate buttons
        $("#inbox_inbox_cancel_button").hide();
        $("#inbox_inbox_save_button").hide();
        $("#inbox_inbox_delete_button").show();
        $("#inbox_inbox_duplicate_button").show();
        $("#inbox_inbox_edit_button").show();
        $("#inbox_inbox_back_button").show();
    });
    
    $("#create_new_link").click(function() {
        $.bbq.pushState({"tab": "new"},2);
        sakai.listpage.updateListSize();
        
        // Set headers and tab styling
        $("#inbox_existing").hide();
        $("#inbox_new").show();
        $("#existing_lists_tab").removeClass("selected_tab");
        $("#new_list_tab").addClass("selected_tab");
        
        // Show/hide appropriate buttons
        $("#inbox_inbox_delete_button").hide();
        $("#inbox_inbox_duplicate_button").hide();
        $("#inbox_inbox_edit_button").hide();
        $("#inbox_inbox_back_button").hide();
        $("#inbox_inbox_cancel_button").show();
        $("#inbox_inbox_save_button").show();
    });
    
    var setTabState = function(){
        var tab = $.bbq.getState("tab");
        if (tab) {
            switch (tab) {
                case "existing":
                    $("#existing_link").click();
                    break;
                case "new":
                    $("#create_new_link").click();
                    break;
            }
        } else {
            $("#existing_link").click();
        }
    };
    
    $(window).bind('hashchange', function(e) {
        setTabState();
    });
    
    var createDefaultList = function() {
        var data = {
            "_MODIFIERS": {},
            "lists": []
        };
        
        var defaultData = {
            "links": data
        }
        
        $(inboxTable).children("tbody").append($.TemplateRenderer("#inbox_inbox_lists_template", defaultData));
    }
    
    /**
     * Takes the data returned by the server and formats it to get it ready for posting to the server
     * @param {Object} data
     */
    var formatData = function(data) {
        var result =  {
            "_MODIFIERS": {},
            "lists": data.lists
        };
        
        return result;
    }
    
    var loadData = function() {
        sakai.api.Server.loadJSON(userUrl, function(success, data){
            $("#tabs").tabs();
            setTabState();
            
            if (success) {
                submitData = formatData(data);
                renderLists(submitData);
            } else {
                createDefaultList();
            }
        });
    }
    
    var doInit = function() {
        // Check if we are logged in or out.
        var person = sakai.data.me;
        var uuid = person.user.userid;
        if (!uuid || person.user.anon) {
            redirectToLoginPage();
        } else {
            userUrl = "/~" + uuid + "/private/dynamic_lists";
            loadData();
        }
    };

    doInit();
}
sakai.api.Widgets.Container.registerForLoad("sakai.listpage");
