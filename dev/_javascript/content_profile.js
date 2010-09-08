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
/*global $, fluid, window */

var sakai = sakai || {};

sakai.content_profile = function(){


    //////////////////////
    // Config variables //
    //////////////////////

    var content_path = ""; // The current path of the content
    var globalJSON;
    var ready_event_fired = 0;
    var list_event_fired = false;


    ///////////////////
    // CSS Selectors //
    ///////////////////

    var $content_profile_error_container = $("#content_profile_error_container");
    var $content_profile_error_container_template = $("#content_profile_error_container_template");


    //////////////////////////
    // Global functionality //
    //////////////////////////

    /**
     * Show a general error message to the user
     * @param {String} error
     * A key for an error message - we use the key and not the text for i18n
     */
    var showError = function(error){
        $.TemplateRenderer($content_profile_error_container_template, {"error": error}, $content_profile_error_container);
    };

    /**
     * Load the content profile for the current content path
     */
    var loadContentProfile = function(){
        // Check whether there is actually a content path in the URL
        if (content_path) {

            $.ajax({
                url: sakai.config.SakaiDomain + content_path + ".2.json",
                success: function(data){

                    // Construct the JSON object
                    var json = {
                        data: data,
                        mode: "content",
                        url: sakai.config.SakaiDomain + content_path
                    };

                    // The request was successful so initialise the entity widget
                    if (ready_event_fired > 0) {
                        sakai.api.UI.entity.render("content", json);
                    }
                    else {
                        $(window).bind("sakai.api.UI.entity.ready", function(e){
                            sakai.api.UI.entity.render("content", json);
                            ready_event_fired++;
                        });
                    }

                    if (!list_event_fired) {
                        // add binding to listpeople widget and buttons
                        addListBinding();
                        list_event_fired = true;
                    }
                },
                error: function(xhr, textStatus, thrownError){

                    // Show an appropriate error message
                    showError("invalid_url");

                    // Log a more descriptive message to the console
                    fluid.log("sakai.content_profile - loadContentProfile - Loading the content for the following path: '" + this.url + "' failed.");

                    // Render the entity widget
                    if (ready_event_fired > 0) {
                        sakai.api.UI.entity.render("content", false);
                    }
                    else {
                        $("body").bind("sakai.api.UI.entity.ready", function(e){
                            sakai.api.UI.entity.render("content", false);
                            ready_event_fired++;
                        });
                    }

                }
            });

        }else{

            // Show an appropriate error message
            showError("invalid_query");

            // Also log an error message to the console
            fluid.log("sakai.content_profile - loadContentProfile - The content_path variable is invalid: '" + content_path + "'.");

            // Render the entity widget
            if (ready_event_fired > 0) {
                sakai.api.UI.entity.render("content", false);
            }
            else {
                $("body").bind("sakai.api.UI.entity.ready", function(e){
                    sakai.api.UI.entity.render("content", false);
                    ready_event_fired++;
                });
            }

        }

    };

    /**
     * Load the content authorizables who have access to the content
     */
    var loadContentUsers = function(tuid){
        // Check whether there is actually a content path in the URL
        if (content_path) {
            var pl_config = {"selectable":true, "subNameInfoUser": "email", "subNameInfoGroup": "sakai:group-description", "sortOn": "lastName", "sortOrder": "ascending", "items": 50 };
            var url = sakai.config.SakaiDomain + content_path + ".members.json";
            $("#content_profile_listpeople_container").show();
            sakai.listPeople.render(tuid, pl_config, url, content_path);
        }
    };

    /**
     * addRemoveUsers users
     * Function that adds or removes selected users to/from the content
     * @param {String} tuid Identifier for the widget/type of user we're adding (viewer or manager)
     * @param {Object} users List of users we're adding/removing
     * @param {String} task Operation of either adding or removing
     */
    var addRemoveUsers = function(tuid, users, task) {
        var updateSuccess = false;

        $.each(users, function(index, user) {
            var data = {
                "_charset_":"utf-8",
                ":viewer": user
            };
            if (tuid === 'managers' && task === 'add') {
                data = {
                    "_charset_":"utf-8",
                    ":manager": user
                };
            } else if (task === 'remove') {
                if (user['userid']) {
                    user = user['userid'];
                } else if (user['groupid']) {
                    user = user['groupid'];
                } else if (user['rep:userId']) {
                    user = user['rep:userId'];
                }
                data = {
                    "_charset_":"utf-8",
                    ":viewer@Delete": user
                };
                if (tuid === 'managers') {
                    data = {
                        "_charset_":"utf-8",
                        ":manager@Delete": user
                    };
                }
            }
            if (user) {
                // update user access for the content
                $.ajax({
                    url: content_path + ".members.json",
                    async: false,
                    data: data,
                    type: "POST",
                    success: function(data){
                        updateSuccess = true;
                    }
                });
            }
        });

        if (updateSuccess) {
            loadContentUsers(tuid);
        }
    };


    ///////////////////////
    // BINDING FUNCTIONS //
    ///////////////////////

    /**
     * Add binding to list elements on the page
     */
    var addListBinding = function(){

        $(window).bind("listpeople_ready", function(e, tuid){
            loadContentUsers(tuid);
        });

        // Bind the remove viewers button
        $("#content_profile_remove_viewers").bind("click", function(){
            addRemoveUsers('viewers', sakai.data.listpeople["viewers"]["selected"], 'remove');
        });

        // Bind the remove managers button
        $("#content_profile_remove_managers").bind("click", function(){
            addRemoveUsers('managers', sakai.data.listpeople["managers"]["selected"], 'remove');
        });

        // Add binding to the pickeruser widget buttons for adding users
        $(window).bind("sakai-pickeruser-ready", function(e){
            var pl_config = {
                "mode": "search",
                "selectable":true,
                "subNameInfo": "email",
                "sortOn": "lastName",
                "items": 50,
                "type": "people",
                "what": "Viewers",
                "where": 'Content'
            };

            // Bind the add viewers button
            $("#content_profile_add_viewers").bind("click", function(){
                pl_config.what = "Viewers";
                $(window).trigger("sakai-pickeruser-init", pl_config, function(people) {
                });
                $(window).unbind("sakai-pickeruser-finished");
                $(window).bind("sakai-pickeruser-finished", function(e, peopleList) {
                    addRemoveUsers('viewers', peopleList.toAdd, 'add');
                });
            });

            // Bind the add managers button
            $("#content_profile_add_managers").bind("click", function(){
                pl_config.what = "Managers";
                $(window).trigger("sakai-pickeruser-init", pl_config, function(people) {
                });
                $(window).unbind("sakai-pickeruser-finished");
                $(window).bind("sakai-pickeruser-finished", function(e, peopleList) {
                    addRemoveUsers('managers', peopleList.toAdd, 'add');
                });
            });
        });
    };


    ////////////////////
    // Initialisation //
    ////////////////////

    /**
     * Initialise the content profile page
     */
    var init = function(){

        // Bind an event to window.onhashchange that, when the history state changes,
        // loads all the information for the current resource
        $(window).bind('hashchange', function(e){
            content_path = e.getState("content_path") || "";
            loadContentProfile();
        });

        // Since the event is only triggered when the hash changes, we need to trigger
        // the event now, to handle the hash the page may have loaded with.
        $(window).trigger('hashchange');

    };

    // Initialise the content profile page
    init();

};

sakai.api.Widgets.Container.registerForLoad("sakai.content_profile");