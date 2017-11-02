/*
 * Visualization source
 */

/*
                НЕ БИЛДИТЬ!!! ПРАВИТЬ ПРЯМО В ФАЙЛЕ visualization.js (!!!!!!!!)
*/
define([
            'jquery',
            'underscore',
            'moment',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            "splunkjs/mvc/utils",
            'amcharts/amcharts',
            'amcharts/serial',
            'amcharts/gantt',
            'amcharts/plugins/export/export.min.js',
            'amcharts/themes/light'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            moment,
            SplunkVisualizationBase,
            vizUtils,
            utils
        ) {
    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
  
        initialize: function() {
            var self = this;
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);

            this.uniqViewNum = 'Gantt-' + Math.ceil(Math.random() * 10000);

            this.$el.append('<div id="' + this.uniqViewNum + '" class="gantt-wrapper"></div>');
            this.initedCats = false;

            // Initialization logic goes here
            // TODO add more colors
            this.colors = [
                '#aa0000',
                '#00aa00',
                '#0000aa',
                '#46615e',
                '#727d6f',
                '#8dc49f',
                '#FFE4C4'
            ];
        },

        daysToMilliseconds: function(days) {
          return days * 24 * 60 * 60 * 1000;
        },
        initValsAndCats: function(data) {
            this.initedCats = true;
            var rows = data.rows;
            var fields = data.fields;
            var categoryName = this.getProperty('category');
            var stateName = this.getProperty('state');
            var timeName = '_time';
            var durationName = this.getProperty('duration');

            for (var i = 0, len = fields.length; i < len; ++i) {
                if (fields[i].name === categoryName) {
                    this.catNum = i;
                }


                if (fields[i].name === stateName) {
                    this.stateNum = i;
                }


                if (fields[i].name === timeName) {
                    this.timeNum = i;
                }


                if (fields[i].name === durationName) {
                    this.durationNum = i;
                }
            }


            for (var i = 0, len = fields.length; i < len; ++i) {
                if (fields[i].name === stateName) {
                    this.stateNum = i;
                    break;
                }
            }

            this.categories = [];
            var states = {};

            for (var i = 0, len = rows.length; i < len; ++i) {
                this.categories.push(rows[i][this.catNum]);
                states[rows[i][this.stateNum]] = '';
            }

            this.statesColors = {};

            var i = 0;
            for(var key in states) {
                this.statesColors[key] = this.colors[i++ % this.colors.length];
            }

            this.categories = _.uniq(this.categories);

            this.initedCats = true;
        },

        // Optionally implement to format data returned from search. 
        // The returned object will be passed to updateView as 'data'
        formatData: function(data, config) {

            var rows = data.rows;

            this.startDate = moment().subtract(0, 'hours');
            if(rows.length < 1){
                return false;
            }

            !this.initedCats && this.initValsAndCats(data);

            var categories = {};

            for (var i = 0, len = this.categories.length; i < len; ++i) {
                categories[this.categories[i]] = {
                    category: this.categories[i],
                    segments: []
                }
            }

            console.dir(categories);


            for (var i = 0, len = rows.length; i < len; ++i) {
                var curRow = rows[i];
                var curCategory = curRow[this.catNum];
                var start = moment(curRow[this.timeNum]).diff(this.startDate, 'seconds');
                categories[curCategory].segments.push({
                    "start": start,
                    "category": curCategory,
                    "end": start + Math.ceil(curRow[this.durationNum]),
                    "color": this.statesColors[curRow[this.stateNum]],
                    "task": curRow[this.stateNum]
                });
            }

            var retCategories = _.map(categories, function(value) {
                return value;
            })

            return retCategories;
        },
        drilldownToTimeRangeAndCategory: function(earliestTime, latestTime, categoryName, categoryValue, browserEvent) {
            console.log('Before drilldown event', arguments);
            var data = {};
            data[categoryName] = categoryValue;

            console.dir(this);
            console.dir(this.drilldown);
            console.log('Time:');
            console.log(latestTime, earliestTime, latestTime - earliestTime)
            console.log('-------------')
            var earliest = this.startDate.clone().add(earliestTime, 'seconds').format();
            console.log('earliest: ', earliest);
            var latest = this.startDate.clone().add(latestTime, 'seconds').format();
            console.log('latest__: ', latest);

            var obj4Drilldown = {
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: data,
                earliest: earliest,
                latest: latest
            };

            console.log('obj4Drilldown: ', JSON.stringify(obj4Drilldown, null, 4));
            console.dir(this.drilldown)

            this.drilldown(obj4Drilldown, browserEvent, function(err, res) {
                console.log('Callback for drilldown: ', err, res);
            });
        },
        getProperty: function(name) {
            var config = this._config;
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },
        drawChart: function(data, config) {
            console.log('There will be the chart drawing soon');
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(categories, config) {

            var durationName = this.getProperty('duration');
            var categoryName = this.getProperty('category');
            var state = this.getProperty('state');

            $('#' + this.uniqViewNum).empty();
            $('#' + this.uniqViewNum).append('<span>Not implemented yet.</span>');
            var self = this;

            var legend = [];

            for (var i in this.statesColors) {
                legend.push({
                    title: i,
                    color: this.statesColors[i]
                });
            }

            console.log("this.startDate.format('hh:mm:ss')", this.startDate.format('hh:mm:ss'))
            console.log("this.startDate.format('YYYY-MM-DD')", this.startDate.format('YYYY-MM-DD'))
            console.dir(categories)

            var chart = AmCharts.makeChart(this.uniqViewNum, {
                "type": "gantt",
                "theme": "light",
                "marginRight": 70,
                "period": "ss",
                "dataDateFormat": "YYYY-MM-DDTHH:mm:ss.sssZ",
                "balloonDateFormat": "JJ:NN",
                "columnWidth": 0.5,
                "valueAxis": {
                    "type": "date"
                },
                "brightnessStep": 10,
                "graph": {
                    "fillAlphas": 1,
                    "balloonText": "<b>State: [[task]]</b>: [[open]] [[value]]"
                },
                "rotate": true,
                "categoryField": "category",
                "segmentsField": "segments",
                "colorField": "color",
                "startDate": this.startDate.toDate(),
                "startField": "start",
                "endField": "end",
                "durationField": "duration",
                "dataProvider": categories, /*[{
                    "category": "John",
                    "segments": [{
                        "start": 10,
                        "end": 14,
                        "color": "#46615e",
                        "task": "Task #1"
                    }, {
                        "start": 13,
                        "end": 16,
                        "color": "#727d6f",
                        "task": "Task #1"
                    }]
                }], */
                "valueScrollbar": {
                    "autoGridCount": true
                },
                "chartCursor": {
                    "cursorColor": "#55bb76",
                    "valueBalloonsEnabled": false,
                    "cursorAlpha": 0,
                    "valueLineAlpha": 0.5,
                    "valueLineBalloonEnabled": true,
                    "valueLineEnabled": true,
                    "zoomable": false,
                    "valueZoomable": true
                },
                "legend": {
                    "data": legend
                },
                "export": {
                    "enabled": true
                },
                "listeners": [{
                    "event": "clickGraphItem",
                    "method": function(e) {
                        var item = e.graph.customData;
                        self.drilldownToTimeRangeAndCategory(item.start, item.end, categoryName, item.category, e);
                    }
                }]
            });
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {}
    });
});