var sakai = sakai || {};

sakai.widgets = {
    "relationships": [
        {"name": "Classmate", "definition": "is my classmate"},
        {"name": "Supervisor", "inverse": "Supervised", "definition": "is my supervisor"},
        {"name": "Supervised", "inverse": "Supervisor", "definition": "is being supervised by me"},
        {"name": "Lecturer", "inverse": "Student", "definition": "is my lecturer"},
        {"name": "Student", "inverse": "Lecturer", "definition": "is my student"},
        {"name": "Colleague", "definition": "is my colleague"},
        {"name": "College Mate", "definition": "is my college mate"},
        {"name": "Shares Interests", "definition": "shares an interest with me"}
    ],
    "groups":[
        "Administrators",
        "Lecturers & Supervisors",
        "Researchers",
        "Students"
    ],
    "layouts": {
        "onecolumn": {
            "name":"One column",
            "widths":[100],
            "siteportal": true
        },
        "dev": {
            "name":"Dev Layout",
            "widths":[50,50],
            "siteportal": true
        },
        "threecolumn": {
            "name":"Three equal columns",
            "widths":[33,33,33],
            "siteportal": false
        },
        "fourcolumn": {
            "name":"Four equal columns",
            "widths":[25,25,25,25],
            "siteportal": false
        },
        "fivecolumn": {
            "name":"Five equal columns",
            "widths":[20,20,20,20,20],
            "siteportal": false
        }
    },
    "defaults": {
        "personalportal": {
            "layout": "dev",
            "columns": [["mygroups", "mycontacts"], ["myprofile", "mycontent"]]
        },
        "siteportal": {
            "layout": "dev",
            "columns": [["sitemembers"], []]
        }
    }
};

/**
 * Store the overall widget configuration object in memory
 * @param {Object} widgets
 * JSON Object that is an aggregation of all widget config.json files
 */
sakai.storeWidgets = function(widgets){
    sakai.widgets.widgets = widgets;
};