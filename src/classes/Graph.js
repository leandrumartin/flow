import Chart from 'chart.js/auto'

export default class Graph {
    constructor(selector, config) {
        this.chart = new Chart(
            document.querySelector(selector),
            config
        );
    }
}
