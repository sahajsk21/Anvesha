var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
(function (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({ state: state });
        }
        return pushState.apply(history, arguments);
    }
})(window.history);
Vue.config.devtools = true;
classfilter = Vue.component('class-filter', {
    props: ['classValue', 'appliedFilters', 'classLabel'],
    template: `
    <div>
        <div class="classSearchSection">
            <h3>Class: {{classLabel}}</h3>
            <input v-model="localClassValue" @keyup.enter="submit" class="classSearch" type="text" style="margin-bottom: 15px;">
        </div>
        <a @click="submit">Browse this class</a>
    </div>`,
    data() {
        return {
            localClassValue: this.classValue,
            localClassLabel: this.classLabel
        }
    },
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        submit() {
            this.$emit("class-label", this.localClassValue, this.localClassLabel);
        },

    }
})

viewallitems = Vue.component('view-all-items', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges'],
    data() {
        return {
            items: [],
            filtersCount: -1,
            itemsCount: ''
        }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.filterValue)">X</a>)</p>
            <p v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }} (<a @click="removeRange(range)">X</a>)</p>
        </div>
        <div class="content" id="viewallitems">
            <div class="classOptionsSection">
                <p v-if="filtersCount==-1"></p>
                <p v-else-if="filtersCount==0">No filters are defined for this class.</p>
                <p v-else><a class="classOptions" @click="changePage('filters-view', itemsCount)">Add a filter</a></p>
                <a class="classOptions" @click="changePage('superclass-view', itemsCount)">More general class</a>
                <a class="classOptions" @click="changePage('subclass-view', itemsCount)">More specific class</a>
                <a class="classOptions" @click="changePage('class-filter', itemsCount)" style="margin-bottom:20px">Change to a new class</a>
            </div>
            <img v-if="!items.length" src='loading.gif'>
            <p v-else-if="items[0].value=='Empty'">No items match this description.</p>
            <div v-else>
                <p>There are <b>{{ items.length }}</b> items that match this description.</p>
                    <ul>
                        <li v-for="item in items">
                            <a :href="item.value.value">{{item.valueLabel.value}}</a>
                        </li>
                    </ul>
            </div>
        </div>
    </div>`,
    methods: {
        changePage(page, totalValues) {
            this.$emit('change-page', page)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'view-all-items');
        },
        removeRange(range){ 
            this.$emit("remove-range", range, 'view-all-items');
        }
    },
    mounted() {

        // Check the number of available filters
        var filterQuery = "SELECT (COUNT(?value) AS ?c) WHERE {\n" +
            "  wd:" + this.classValue + " wdt:P1963 ?value;\n" +
            "}\n" +
            "LIMIT 20";
        const filterUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(filterQuery);
        axios.get(filterUrl)
            .then(response => this.filtersCount = response.data['results']['bindings'][0].c.value)
            .catch(error => {
                this.items.push({ value: "Error" })
            })
        
        // Create strings for filters of different data types
        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
        }
        var filterRanges = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue+") ?timenode"+i+".\n" +
                "  ?timenode" + i + " wikibase:timeValue ?time" + i +".\n" +
                "  FILTER('"+this.appliedRanges[i].valueLL+"'^^xsd:dateTime <= ?time" + i + " && ?time" + i +" < '"+this.appliedRanges[i].valueUL+"'^^xsd:dateTime).\n"
        }

        // Count the number of results
        // var countQuery = "\n" +
        // "SELECT (COUNT(?value) AS ?c) WHERE {\n" +
        // "  ?value wdt:P31 wd:"+this.classValue+".\n" +
        // filterString +
        // filterRanges+
        // "}";
        // const countUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(countQuery);
        // axios.get(countUrl)
        //     .then(response => this.itemsCount = response.data['results']['bindings'][0].c.value)
        //     .catch(error => {
        //         this.items.push({ value: "Error" })
        //     })
        
        // Fetch results
        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  ?value wdt:P31 wd:"+this.classValue+".  \n" +
            filterString+
            "  ?value rdfs:label ?valueLabel.\n" +
            filterRanges+
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

filtersview = Vue.component('filters-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges'],
    data() {
        return { filters: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
            </ul>
        </div>
        <div class="content">
            <img v-if="!filters.length" src='loading.gif'>
            <p v-else-if="filters[0].value=='Empty'">No filters available</p>
            <div v-else>
                <p>There are <b>{{ totalValues }}</b> items that match this description.</p>
                <p><b>Add a filter:</b></p> 
                <ul>
                    <li v-for="filter in filters">
                        <a @click="showFilter(filter)">{{filter.valueLabel.value}}</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>`,
    methods: {
        changePage(page,) {
            this.$emit('change-page', page)
        },
        showFilter(filter) {
            this.$emit('update-filter', filter)
        }
    },
    mounted() {
        var sparqlQuery = "\n" +
            "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:"+this.classValue+" wdt:P1963 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (\n" +
            "     !EXISTS {\n" +
            "       ?value wikibase:propertyType wikibase:ExternalId\n" +
            "     }\n" +
            "   )  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.filters = [...response.data['results']['bindings']] : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

filtervalues = Vue.component('filter-values', {
    props: ['classValue', 'classLabel', 'currentFilter', 'appliedFilters', 'totalValues', 'appliedRanges'],
    data() {
        return { 
            items: [],
            itemsType:'',
            fullPropertyValues: [],
            displayCount:1
         }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.filterValue)">X</a>)</p>
            <p v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }} (<a @click="removeRange(range)">X</a>)</p>
        </div>
        <div class="content">
            <img v-if="itemsType==''" src='loading.gif'>
                <p v-else-if="itemsType=='Empty'">There are no values for the filter <b>{{currentFilter.valueLabel}}</b>.</p>
                <p v-else-if="itemsType=='Error'">The attempt to display a list of items took too long; please consider adding more filters.</p>
                <div v-else-if="itemsType=='Other'">
                    <p>There are <b>{{ totalValues }}</b> items that match this description.</p>
                    <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                    <ul>
                        <li v-for="item in items">
                            <a @click="applyFilter(item)">{{item.valueLabel.value}}</a> ({{item.count.value}} results)
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='Time'">
                    <p>There are <b>{{ totalValues }}</b> items that match this description.</p>
                    <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                    <ul v-if="displayCount == 1">
                        <li v-for="item in items">
                            <a @click="applyRange(item)">{{item.bucketName}} </a> ({{item.numValues}} results)
                        </li>
                    </ul>
                    <ul v-if="displayCount == 0">
                        <li v-for="item in items">
                            <a @click="applyRange(item)">{{item.bucketName}} </a>
                        </li>
                    </ul>
                </div>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        applyFilter(filter) {
            this.$emit('apply-filter', filter)
        },
        applyRange(range) {
            this.$emit('apply-range', range)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'filter-values');
        },
        removeRange(range){
            this.$emit("remove-range", range, 'filter-values');
        }, 
        monthNumberToString(monthNum) {
            if (monthNum == 1) {
                return 'January';
            } else if (monthNum == 2) {
                return 'February';
            } else if (monthNum == 3) {
                return 'March';
            } else if (monthNum == 4) {
                return 'April';
            } else if (monthNum == 5) {
                return 'May';
            } else if (monthNum == 6) {
                return 'June';
            } else if (monthNum == 7) {
                return 'July';
            } else if (monthNum == 8) {
                return 'August';
            } else if (monthNum == 9) {
                return 'September';
            } else if (monthNum == 10) {
                return 'October';
            } else if (monthNum == 11) {
                return 'November';
            } else if (monthNum == 12) {
                return 'December';
            }
            return 'Invalid month - ' + monthNum;
        },
        monthStringToNumber(monthName) {
            if (monthName == 'January') {
                return 1;
            } else if (monthName == 'February') {
                return 2;
            } else if (monthName == 'March') {
                return 3;
            } else if (monthName == 'April') {
                return 4;
            } else if (monthName == 'May') {
                return 5;
            } else if (monthName == 'June') {
                return 6;
            } else if (monthName == 'July') {
                return 7;
            } else if (monthName == 'August') {
                return 8;
            } else if (monthName == 'September') {
                return 9;
            } else if (monthName == 'October') {
                return 10;
            } else if (monthName == 'November') {
                return 11;
            } else if (monthName == 'December') {
                return 12;
            }
            return 'Invalid month - ' + monthName;
        },
        generateDatePropertyValues(dateArray) {
            // earliestDate = new Date(eD);
            // latestDate = new Date(lD);
            var len = dateArray.length;
            var val = 0;
            len > 50000? val=0: val=1;
            var earliestDate = new Date(dateArray[0].time.value);
            var latestDate = new Date(dateArray[len - 1].time.value);
            var earliestYear = earliestDate.getFullYear();
            var earliestMonth = earliestDate.getMonth() + 1;
            var earliestDay = earliestDate.getDate();
            var latestYear = latestDate.getFullYear();
            var latestMonth = latestDate.getMonth() + 1;
            var latestDay = latestDate.getDate();

            var yearDifference = latestYear - earliestYear;
            var monthDifference = (12 * yearDifference) + (latestMonth - earliestMonth);
            var dayDifference = (30 * monthDifference) + (latestDay - earliestDay);

            var propertyValues = [];
            if (yearDifference > 300) {
                // Split into centuries.
                // This, and the other year-based ones, should probably be
                // done as dates instead of just integers, to handle BC years
                // correctly.
                var curYear = iniYear = Math.floor(earliestYear / 100) * 100;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName : curYear + " - " + (curYear + 99),
                        bucketLL:curYear+'-01-01',
                        bucketUL: (curYear+100) + '-01-01',
                        numValues:0
                    });
                    curYear += 100;
                }
                for (var i = 0; i < len && val !=0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getFullYear());
                    index = Math.floor((year - iniYear) / 100);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 150) {
                // Split into fifty-year increments.
                var curYear = iniYear = Math.floor(earliestYear / 50) * 50;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: curYear + " - " + (curYear + 49),
                        bucketLL: curYear + '-01-01',
                        bucketUL: (curYear + 50) + '-01-01',
                        numValues: 0
                    });
                    curYear += 50;
                }
                for (var i = 0; i < len && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getFullYear());
                    index = Math.floor((year - iniYear) / 50);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 50) {
                // Split into decades.
                var curYear = iniYear = Math.floor(earliestYear / 10) * 10;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName : curYear + " - " + (curYear + 9),
                        bucketLL:curYear+'-01-01',
                        bucketUL: (curYear+10) + '-01-01',
                        numValues:0
                    });
                    curYear += 10;
                }
                for (var i = 0; i < len && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getFullYear());
                    index = Math.floor((year - iniYear) / 10);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 15) {
                // Split into five-year increments.
                var curYear = iniYear =Math.floor(earliestYear / 5) * 5;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: curYear + " - " + (curYear + 4),
                        bucketLL: curYear + '-01-01',
                        bucketUL: (curYear + 5) + '-01-01',
                        numValues: 0
                    });
                    curYear += 5;
                }
                for (var i = 0; i < len && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getFullYear());
                    index = Math.floor((year - iniYear) / 5);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 2) {
                // Split into years.
                var curYear = iniYear = earliestYear;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: curYear + " - " + (curYear),
                        bucketLL: curYear + '-01-01',
                        bucketUL: curYear + '-12-31',
                        numValues: 0
                    });
                    curYear++;
                }
            } else if (monthDifference > 1) {
                
                
                // Split into months.
                var curYear = iniYear = earliestYear;
                var curMonth = iniMonth = earliestMonth;
                // Add in year filter values as well, to handle year-only
                // values.
                // propertyValues.push(curYear);
                while (curYear < latestYear || (curYear == latestYear && curMonth <= latestMonth)) {
                    propertyValues.push({
                        bucketName: this.monthNumberToString(curMonth) + " " + curYear,
                        bucketLL:curYear+"-"+curMonth+"-01",
                        bucketUL: curYear + "-" + curMonth + "-30",
                        numValues:0
                    });
                    if (curMonth == 12) {
                        curMonth = 1;
                        curYear++;
                        // Year-only filter value.
                        // propertyValues.push(curYear);
                    } else {
                        curMonth++;
                    }
                }
                for (var i = 0; i < len && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = date.getFullYear();
                    month = date.getMonth();
                    index = Math.floor(((year - iniYear)*12 + month - iniMonth+1));
                    propertyValues[index].numValues += 1
                }
            } else if (dayDifference > 1) {

                // Split into days.
                // We can't just do "curDate = earliestDate" because that
                // won't make a copy.
                var curDate = new Date();
                curDate.setTime(earliestDate.getTime());
                while (curDate <= latestDate) {
                    propertyValues.push({
                        bucketName: this.monthNumberToString(curDate.getMonth() + 1) + " " + curDate.getDate() + ", " + curDate.getFullYear(),
                        bucketLL: curDate.getFullYear() + "-" + (curDate.getMonth() + 1) + "-" + curDate.getDate(),
                        bucketUL: curDate.getFullYear() + "-" + (curDate.getMonth() + 1) + "-" + (curDate.getDate() + 1),
                        numValues:0
                        
                    });
                    curDate.setDate(curDate.getDate() + 1);
                }
            } else if (dayDifference == 0) {
                var curDate = new Date();
                curDate.setTime(earliestDate.getTime());
                propertyValues.push({
                    bucketName: this.monthNumberToString(curDate.getMonth() + 1) + " " + curDate.getDate() + ", " + curDate.getFullYear(),
                    bucketLL: curDate.getFullYear() + "-" + (curDate.getMonth() + 1) + "-" + curDate.getDate(),
                    bucketUL: curDate.getFullYear() + "-" + (curDate.getMonth() + 1) + "-" + (curDate.getDate() + 1),
                    numValues: len

                });
            }
            this.displayCount = val;
            return propertyValues;
        }

    },
    mounted() {
        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "?v wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
        }
        var filterRanges = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            filterRanges += "?v (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode"+i+".\n" +
                "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n"
        }
        if(this.currentFilter.property == "Time"){
            var sparqlQuery = "SELECT ?time WHERE {\n" +
                "  ?v wdt:P31 wd:"+this.classValue+".\n" +
                filterString +
                "   ?v  (p:"+this.currentFilter.value+"/psv:"+this.currentFilter.value+") ?timenode.\n" +
                "  ?v rdfs:label ?vLabel.\n" +
                filterRanges +
                "  ?timenode wikibase:timeValue ?time.\n" +
                "  FILTER((LANG(?vLabel)) = \"en\").\n"+
                "}\n" +
                "ORDER BY ?time";
            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
                .then(response => (response.data['results']['bindings'].length ? (this.itemsType = 'Time', this.items = this.generateDatePropertyValues(response.data['results']['bindings'])) : this.itemsType = 'Empty'))
                .catch(error => {
                    this.itemsType='Error'
                })
        }
        else{
            var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
                "  ?v wdt:P31 wd:" + this.classValue + ".\n" +
                filterString +
                " ?v wdt:" + this.currentFilter.value + " ?value.\n" +
                "  ?value rdfs:label ?valueLabel.\n" +
                filterRanges +
                "  FILTER(LANG(?valueLabel) = 'en').\n" +
                "}\n" +
                "GROUP BY ?value ?valueLabel\n" +
                "ORDER BY DESC(?count)";
            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
                .then(response => (response.data['results']['bindings'].length ? (this.itemsType = 'Other', this.items = [...response.data['results']['bindings']]) : this.itemsType='Empty'))
                .catch(error => {
                    this.itemsType='Error'
                })
        }
    }
})

subclass = Vue.component('subclass-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'appliedRanges'],
    data() {
        return { items: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
            </ul>
        </div>
        <p><i>(Note: if you change the class, you will lose the current set of filters.)</i></p>
        <p><b>Change from "{{ classLabel }}" to a more specific class:</b><p>
        <div class="content">
            <img v-if="!items.length" src='loading.gif'>
            <p v-else-if="items[0].value=='Empty'">No items match this description.</p>
            <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a> ({{item.count.value}} results)
                    </li>
                </ul>
            </div>
        </div>  
    </div>
    `,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        updateClass(item) {
            this.$emit('update-class', item.value.value.split('/').slice(-1)[0], item.valueLabel.value)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:P31 ?value.\n" +
            "  ?value wdt:P279 wd:" + this.classValue + ".\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

superclass = Vue.component('superclass-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'appliedRanges'],
    data() {
        return { items: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
            </ul>
        </div>
        <p><i>(Note: if you change the class, you will lose the current set of filters.)</i></p>
        <p><b>Change from "{{ classLabel }}" to a more general class:</b><p>
        <div class="content">
            <img v-if="!items.length" src='loading.gif'>
            <p v-else-if="items[0].value=='Empty'">No items match this description.</p>
            <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a> ({{item.count.value}} results)
                    </li>
                </ul>
            </div>
        </div>  
    </div>
    `,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        updateClass(item) {
            this.$emit('update-class', item.value.value.split('/').slice(-1)[0], item.valueLabel.value)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:P31 ?value.\n" +
            "  wd:" + this.classValue + " wdt:P279 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
    }
})

var app = new Vue({
    el: '#app',
    components: {
        classfilter, viewallitems, filtersview, filtervalues
    },
    data: {
        clsValue: '',
        classLabel: '',
        page: '',
        currentFilterLabel: '',
        currentFilterValue: '',
        currentFilterPropertyType:'',
        appFilters: [],
        appRanges:[],
        getFiltersFromURL:1,
        allItemscomponentKey: 0,
        filterscomponentKey: 0,
        totalValues: ''
    },
    created: function(){
        window.onpopstate = history.onpushstate = function (e) {
            if(e.state) {
                app.page = e.state.page
                app.clsValue = e.state.classValue
            } else {
                app.page='class-filter'
            }
        };
    },
    methods: {
        updatePage: function (page) {
            this.page = page
            urlParams.set('view', page)
            window.history.pushState({
                    page: page,
                    classValue : this.classValue
                }, '',
                window.location.pathname+"?" + urlParams
                );
        },
        updateClassValue: function (classValue, classLabel) {
            urlParams = new URLSearchParams("")
            urlParams.set('c', classValue)
            this.updatePage('view-all-items')
            this.clsValue = classValue;
            this.classLabel = classLabel
            this.currentFilterLabel = '';
            this.currentFilterValue = '';
            this.appFilters = [];
            this.appRanges = [];
            this.getFiltersFromURL=1;
            this.allItemscomponentKey = 0;
            this.filterscomponentKey = 0;
            this.totalValues=''
        },
        updateFilter: function (filter) {
            this.currentFilterPropertyType = filter.property.value.split('#')[1]
            this.currentFilterLabel=filter.valueLabel.value
            this.currentFilterValue = filter.value.value.split('/').slice(-1)[0]
            urlParams.set('cf', this.currentFilterValue)
            urlParams.set('cfpt', this.currentFilterPropertyType)
            this.updatePage('filter-values')
        },
        applyFilter: function (filter) {
            this.appFilters.push({
                filterValue: this.currentFilter.value,
                filterValueLabel: this.currentFilter.valueLabel,
                value: filter.value.value.split('/').slice(-1)[0],
                valueLabel: filter.valueLabel.value
            });
            urlParams.set("filter[" + this.currentFilter.value + "]", filter.value.value.split('/').slice(-1)[0])
            this.updatePage('view-all-items')
        },
        applyRange: function (range){
            this.appRanges.push({
                filterValue: this.currentFilter.value,
                filterValueLabel: this.currentFilter.valueLabel,
                valueLabel:range.bucketName,
                valueLL: range.bucketLL,
                valueUL:range.bucketUL
            });

            urlParams.set("range[" + this.currentFilter.value + "]", range.bucketLL+"|"+range.bucketUL)
            this.updatePage('view-all-items')
        },
        forceAllItemsRerender() {
            this.allItemscomponentKey += 1;
        },
        forceFiltersRerender() {
            this.filterscomponentKey += 1;
        },
        removeFilter: function (value, page) {
            index = this.appFilters.findIndex(filter => filter.filterValue == value);
            this.appFilters.splice(index, 1)
            urlParams.delete("filter["+value+"]")
            this.updatePage(page)
            this.getFiltersFromURL = 0
            this.forceAllItemsRerender()
            this.forceFiltersRerender()
        },
        removeRange: function (range, page) {
            index = this.appRanges.findIndex(filter => filter.filterValue == range.filterValue);
            this.appRanges.splice(index, 1)
            urlParams.delete("range[" + range.filterValue + "]")
            this.updatePage(page)
            this.getFiltersFromURL = 0
            this.forceAllItemsRerender()
            this.forceFiltersRerender()
        },
        
    },
    computed: {
        view: function () {
            if (this.page == '') {
                return urlParams.has('view') ? urlParams.get('view') : 'class-filter'
            }
            else {
                return this.page
            }
        },
        classValue: function () {
            if (this.clsValue == '') {
                value = urlParams.has('c') ? urlParams.get('c') : 'Q5398426'
            }
            else {
                value = this.clsValue
            }
            var sparqlQuery = "SELECT ?value WHERE {\n" +
            "  wd:" + value + " rdfs:label ?value.\n" +
            "  FILTER(LANG(?value) = \"en\")\n" +
            "}";
            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
            .then(response => {
                this.classLabel = response.data['results']['bindings'][0].value.value
            })
            return value
        }, 
        currentFilter: function () {
            if( this.currentFilterValue == '' ){
                val = urlParams.has('cf') ? urlParams.get('cf') : ''
                pt = urlParams.has('cfpt') ? urlParams.get('cfpt') : ''
            }
            else {
                val = this.currentFilterValue
                pt = this.currentFilterPropertyType
            }
            if( val != ''){
                var sparqlQuery = "SELECT ?value WHERE {\n" +
                "  wd:" + val + " rdfs:label ?value.\n" +
                "  FILTER(LANG(?value) = \"en\")\n" +
                "}";
                const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => this.currentFilterLabel = response.data['results']['bindings'][0].value.value)
            }
            return { value: val, valueLabel: this.currentFilterLabel, property:pt }
        },
        appliedFilters: function () {
            if( this.appFilters.length == 0 && this.getFiltersFromURL==1 ){
                url = decodeURI(urlParams);
                var res = url.match(/filter\[P\d+\]/g);
                if (res != null) {
                    for (var i = 0; i < res.length; i++) {
                        this.appFilters.push({ 
                            filterValue: res[i].split("[")[1].slice(0, -1),
                            filterValueLabel: res[i].split("[")[1].slice(0, -1),
                            value: urlParams.get(res[i]),
                            valueLabel: urlParams.get(res[i])
                        })
                    }
                }
            }
                return this.appFilters
        },
        appliedRanges: function () {
            if (this.appRanges.length == 0 && this.getFiltersFromURL == 1) {
                url = decodeURI(urlParams);
                var res = url.match(/range\[P\d+\]/g);
                if (res != null) {
                    for (var i = 0; i < res.length; i++) {
                        this.appRanges.push({
                            filterValue: res[i].split("[")[1].slice(0, -1),
                            filterValueLabel: res[i].split("[")[1].slice(0, -1),
                            valueLL: urlParams.get(res[i]).split("|")[0].trim(),
                            valueUL: urlParams.get(res[i]).split("|")[1].trim(),
                            valueLabel: urlParams.get(res[i]).split("|")[0].trim() + " - " + urlParams.get(res[i]).split("|")[1].trim()
                        })
                    }
                }
            }
            return this.appRanges
        }
    }
})
