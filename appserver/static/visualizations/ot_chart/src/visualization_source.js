/*
 * Visualization source
 */

define([
            'jquery',
            'underscore',
            'moment',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'highcharts'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            moment,
            SplunkVisualizationBase,
            vizUtils,
            HighCharts
        ) {

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
        getProperty: function(name) {
            var config = this._config;
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);

            this.uniqueId = `ot-chart-${Math.ceil(Math.random() * 100000000)}`
            this.$el.append(`<div id="${this.uniqueId}"></div>`)
            // Initialization logic goes here
        },

        // Optionally implement to format data returned from search.
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {
            if(data.rows.length < 1){
                return false;
            }
            var datum = vizUtils.escapeHtml(parseFloat(data.rows[0][0]));

            // Check for invalid data
            if(_.isNaN(datum)){
                throw new SplunkVisualizationBase.VisualizationError(
                    'Only supports numbers'
                );
            }

            //return datum;
            let timeField = 0
            let otherFields = []
            data.fields.forEach((curField, num) => {
                if (curField.name === '_time') {
                    timeField = 0
                } else {
                    otherFields.push(num)
                }
            })

            let series = []
            otherFields.forEach((curVal, idx) => series.push({
                yAxis: 0,
                name: data.fields[curVal].name,
                type: 'line',
                //color: this.colors[idx % this.colors.length],
                data: [],
                marker: {
                    enabled: true
                },
                tooltip: {
                }
            }))

            data.rows
                .sort((firstVal, secondVal) => {
                    return moment(firstVal[timeField]) < moment(secondVal[timeField]) ? -1 : 1
                })
                .forEach(curRow => {
                    for (let i = 0, len = otherFields.length; i < len; ++i) {
                        const curSeriesNum = otherFields[i]
                        series[i].data.push([new Date(curRow[timeField]).getTime(),
                            i === 0 ? parseFloat(curRow[curSeriesNum]) : 40 + Math.ceil(Math.random() * 10)])
                    }
                })

            console.log('----------Series-------------')
            console.dir(series)
            console.log('-----------------------------')


            // Format data
            const sampleData = {
                series
            }

            return sampleData
        },
        drilldownLabel: function(event) {
            const clickedTimestamp = new Date(event.point.x).getDate()
            const obj4Drilldown = {
                earliest: moment(clickedTimestamp - 60000).toISOString(),
                latest: moment(clickedTimestamp + 60000).toISOString()
            }

            console.log('Before drilldown event: ', JSON.stringify(obj4Drilldown, null, 4))
            this.drilldown(obj4Drilldown, event)
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {
            this.$el.find(`#${this.uniqueId}`).empty()

            if (!data.series) {
                return
            }

            console.log('------------------------')
            console.log('Before drawing HighChart')
            console.log('------------------------')

            const containerHeight = this.$el.closest('.viz-controller').height()
            this.$el.find(`#${this.uniqueId}`).css({
                height: `${containerHeight - 30}px`
            })

            const formatTooltip = this.getProperty('dateFormatTooltip') === 'dateTime'
                ? 'DD:MM:YYYY HH:mm:ss' : 'HH:mm:ss'
            const formatAxis = this.getProperty('dateFormatAxis') === 'dateTime'
                ? 'DD:MM:YYYY HH:mm:ss' : 'HH:mm:ss'
            const yAxisName = this.getProperty('yAxisName')

            const highChart = HighCharts.chart(this.uniqueId, {
                chart: {
                    zoomType: 'x',
                    backgroundColor: "transparent",
                },
                plotOptions: {
                    series: {
                        events: {
                            click: e => { this.drilldownLabel(e) }
                        }
                    }
                },
                colors: [
                    '#237eb2',
                    '#fbb902',
                    '#d64848',
                    '#07912c',
                    '#903030',
                    '#46c35b',
                    '#4a1d6f',
                    '#f60328',
                    '#2d9c89'
                ],
                credits: {
                    enabled: false,
                },
                title: {
                    text: ''
                },
                subtitle: {
                    text: ''
                },
                xAxis: [{
                    type: 'datetime',
                    labels: {
                        formatter: function() {
                            return moment(this.value).format(formatAxis)
                        },
                        rotation: 45,
                        align: 'left'
                    },
                    crosshair: false
                }],
                yAxis: [{
                    min: 0,
                    labels: {
                        style: {
                            color: "#237eb2"
                        }
                    },
                    title: {
                        text: `${yAxisName}`,
                        style: {
                            color: "#237eb2"
                        }
                    },
                    opposite: false
                }],
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    formatter: function () {
                        return `<strong>Time:</strong>: ${moment(this.x).format(formatTooltip)}<br>
                            <strong>${this.series.name}</strong>: ${this.y}`
                    },
                    borderRadius: 5,
                    borderWidth: 0,
                    shadow: false,
                    style: {
                        color: "#fff"
                    },
                    //
                    followTouchMove: false
                },
                series: data.series
            })
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

