/*
 * Visualization source
 */

define([
            'jquery',
            'underscore',
            'moment',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'chart.js',
            'chartjs-plugin-zoom'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            moment,
            SplunkVisualizationBase,
            vizUtils,
            Chart
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
            this.$el.append(`<canvas id="${this.uniqueId}" class="chart-wrapper"></canvas>`)
            // Initialization logic goes here


            this.colors = {
                background: [
                    '#4271f4',
                    '#ff1919',
                    '#07912c'
                ],
                border: [
                    '#668eff',
                    '#ff4242',
                    '#2e9b4b'
                ]
            }
        },

        // Optionally implement to format data returned from search.
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {

            console.dir(data)

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
                label: data.fields[curVal].name,
                backgroundColor: this.colors.background[idx % this.colors.border.length],
                borderColor: this.colors.border[idx % this.colors.border.length],
                data: [],
                fill: false
            }))

            data.rows
                .sort((firstVal, secondVal) => {
                    return moment(firstVal[timeField]) < moment(secondVal[timeField]) ? -1 : 1
                })
                .forEach(curRow => {
                    for (let i = 0, len = otherFields.length; i < len; ++i) {
                        const curSeriesNum = otherFields[i]
                        series[i].data.push({
                            x: new Date(curRow[timeField]),
                            y: i === 0 ? parseFloat(curRow[curSeriesNum]) : 40 + Math.ceil(Math.random() * 10)
                        })
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
        drilldownLabel: function(label, clickedElement, event) {
            const obj4Drilldown = {
                earliest: moment(clickedElement.x.getTime() - 60000).toISOString(),
                latest: moment(clickedElement.x.getTime() + 60000).toISOString()
            }

            console.log('Before drilldown event: ', JSON.stringify(obj4Drilldown, null, 4))
            this.drilldown(obj4Drilldown, event)
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {
            this.$el.find(`#${this.uniqueId}`).empty()
            console.dir(data)

            if (!data.series) {
                return
            }

            console.log('------------------------')
            console.log('Before drawing chart.js')
            console.log('------------------------')

            const containerHeight = this.$el.closest('.viz-controller').height()
            this.$el.find(`#${this.uniqueId}`).css({
                height: `${containerHeight - 30}px`
            })

            const formatVal = this.getProperty('dateFormat') === 'dateTime' ? 'DD:MM:YYYY HH:mm:ss' : 'HH:mm:ss'

            const ctx = this.$el.find(`#${this.uniqueId}`)
            const myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: data.series
                },
                options: {
                    onClick: event => {
                        const eventElements = myChart.getElementAtEvent(event)
                        if (!eventElements || !eventElements.length) {
                            console.log('Smth went wrong:', eventElements)
                            return
                        }
                        const { _datasetIndex, _index } = eventElements[0]
                        const curSeries = data.series[_datasetIndex]
                        const { label } = curSeries
                        const clickedElement = curSeries.data[_index]
                        console.log('Clicked element: ', label, clickedElement)
                        this.drilldownLabel(label, clickedElement, event);
                    },
                    tooltips: {
                        callbacks: {
                            title: (tooltipItem, data) => moment(tooltipItem[0].xLabel).format('DD:MM:YYYY HH:mm:ss')
                        }
                    },
                    zoom: {
						enabled: true,
                        drag: true,
						mode: 'x',
                        rangeMin: {
                            // Format of min zoom range depends on scale type
                            x: null,
                            y: null
                        },
                        rangeMax: {
                            // Format of max zoom range depends on scale type
                            x: null,
                            y: null
                        }
					},
                    scales: {
                        xAxes: [{
                            type: 'time',
                            unit: 'second',
                            time: {
                                displayFormats: {
                                    hour: formatVal
                                }
                            },
                            position: 'bottom'
                        }]
                    }
                }
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

