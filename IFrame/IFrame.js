define("FinAppLendingPage", [], function () {
    return {
        methods: {
            onPlayButtonClick: function () {
                this.sendCoubMessage('play');
            },
            onStopButtonClick: function () {
                this.sendCoubMessage('stop');
            },
            sendCoubMessage: function (message) {
                var myCoub = document.getElementById('coubVideo').contentWindow;
                myCoub.postMessage(message, '*');
            }
        },
        diff: [
            {
                "operation": "insert",
                "name": "IFrameTab",
                "values": {
                    "caption": "IFrame",
                    "items": []
                },
                "parentName": "Tabs",
                "propertyName": "tabs",
                "index": 0
            },
            {
                "operation": "insert",
                "name": "IFrameTabControlGroup",
                "values": {
                    "itemType": Terrasoft.ViewItemType.CONTROL_GROUP,
                    "items": [],
                    "controlConfig": {
                        "collapsed": false
                    }
                },
                "parentName": "IFrameTab",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "insert",
                "name": "IFrameTabGridLayout",
                "values": {
                    "itemType": Terrasoft.ViewItemType.GRID_LAYOUT,
                    "items": []
                },
                "parentName": "IFrameTabControlGroup",
                "propertyName": "items"
            },
            {
                "operation": "insert",
                "name": "PlayButton",
                "values": {
                    "itemType": Terrasoft.ViewItemType.BUTTON,
                    "style": Terrasoft.controls.ButtonEnums.style.GREEN,
                    "click": {"bindTo": "onPlayButtonClick"},
                    "caption": "Play",
                    "items": []
                },
                "parentName": "IFrameTabControlGroup",
                "propertyName": "items",
                "index": 0
            },
            {
                "operation": "insert",
                "name": "StopButton",
                "values": {
                    "itemType": Terrasoft.ViewItemType.BUTTON,
                    "style": Terrasoft.controls.ButtonEnums.style.RED,
                    "click": {"bindTo": "onStopButtonClick"},
                    "caption": "Stop",
                    "items": []
                },
                "parentName": "IFrameTabControlGroup",
                "propertyName": "items",
                "index": 1
            },
            {
                "operation": "insert",
                "parentName": "IFrameTabGridLayout",
                "name": "IFrameTest",
                "propertyName": "items",
                "values": {
                    "itemType": Terrasoft.ViewItemType.CONTAINER,
                    "layout": {"colSpan": 24, "rowSpan": 1, "column": 0, "row": 0},
                    "id": "IFrameTest",
                    "selectors": {"wrapEl": "#IFrameTest"},
                    "html": '<iframe name="coubVideo" id="coubVideo" height="500px"' +
                    'src="https://coub.com/embed/19b2xg" frameborder="0" allowfullscreen></iframe>'
                },
                "index": 2
            }
        ]
    };
});
