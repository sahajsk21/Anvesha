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

var gBucketsPerFilter = 10;

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function NumberRange(lowNumber, highNumber) {
    this.lowNumber = lowNumber;
    this.highNumber = highNumber;
}
NumberRange.fromString = function (filterText) {
    var numberRange = new NumberRange();
    filterText = String(filterText);
    var numbers = filterText.split(' - ');
    if (numbers.length == 2) {
        numberRange.lowNumber = parseFloat(numbers[0]);
        numberRange.highNumber = parseFloat(numbers[1]);
    } else {
        numberRange.lowNumber = parseFloat(filterText);
        numberRange.highNumber = null;
    }
    return numberRange;
}
NumberRange.prototype.toString = function () {
    if (this.highNumber == null) {
        return numberWithCommas(this.lowNumber);
    } else {
        return numberWithCommas(this.lowNumber) + " - " + numberWithCommas(this.highNumber);
    }
}
classfilter = Vue.component('class-filter', {
    props: ['classValue', 'classLabel'],
    data() {
        return {
            clsValue: '',
            suggestedClassValues: [
                { value: "Q5", valueLabel: "" },
                { value: "Q515", valueLabel: "" },
                { value: "Q523", valueLabel: "" },
                { value: "Q4022", valueLabel: "" },
                { value: "Q7366", valueLabel: "" },
                { value: "Q7397", valueLabel: "" },
                { value: "Q7889", valueLabel: "" },
                { value: "Q8502", valueLabel: "" },
                { value: "Q11303", valueLabel: "" },
                { value: "Q11424", valueLabel: "" },
                { value: "Q16521", valueLabel: "" },
                { value: "Q43229", valueLabel: "" },
                { value: "Q178561", valueLabel: "" },
                { value: "Q188784", valueLabel: "" },
                { value: "Q215380", valueLabel: "" },
                { value: "Q746549", valueLabel: "" },
                { value: "Q3305213", valueLabel: "" },
                { value: "Q4830453", valueLabel: "" },
                { value: "Q5398426", valueLabel: "" },
                { value: "Q7725634", valueLabel: "" },
                { value: "Q15632617", valueLabel: "" },

            ]
        }
    },
    template: `
    <div>
        <div class="classSearchSection">
            <h3>Class:</h3>
            <input v-model="clsValue" @keyup.enter="submit(clsValue,'')" class="classSearch" type="text" style="margin-bottom: 15px;">
        </div>
        <a @click="submit(clsValue,classLabel)">Browse this class</a>
        <div v-if="suggestedClassValues[0].valueLabel != ''">
            <p style="margin-top:20px">Or, browse any of the following classes:</p>
            <ul>
                <li v-for="item in suggestedClassValues"><a @click="submit(item.value)">{{ item.valueLabel }}</a></li>
            </ul>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        submit(cv, cl) {
            this.$emit("class-label", cv, cl);
        },
    },
    mounted() {
        var classes = "";
        for (let i = 0; i < this.suggestedClassValues.length; i++) {
            classes += " wd:" + this.suggestedClassValues[i].value
        }
        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  VALUES ?value { " + classes + " }\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  FILTER(LANG(?valueLabel) = \"en\")\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => {
                for (let i = 0; i < response.data['results']['bindings'].length; i++) {
                    index = this.suggestedClassValues.findIndex(filter => filter.value == response.data['results']['bindings'][i].value.value.split("/").slice(-1)[0]);
                    if (index != -1) {
                        this.suggestedClassValues[index].valueLabel = response.data['results']['bindings'][i].valueLabel.value
                    }
                }
                this.suggestedClassValues.sort((a, b) => a.valueLabel.localeCompare(b.valueLabel));
            })
    }
})

results = Vue.component('items-results', {
    props: ['classValue', 'classLabel', 'totalValues', 'currentPage', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            items: [],
        }
    },
    template: `
    <div>
    <p v-if="totalValues>0">There are <b>{{ totalValues<1000000?numberWithCommas(totalValues):"1 million +" }}</b> items that match this description.</p>
        <img v-if="!items.length" src='loading.gif'>
        <p v-else-if="items[0].value=='Empty'">No items match this description.</p>
        <p v-else-if="items[0].value=='Error'">The attempt to display a list of items took too long; please consider adding more filters.</p>
        <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a :href="item.value.value">{{item.valueLabel.value}}</a>
                    </li>
                </ul>
        </div>
    </div>
    `,
    mounted() {
        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
        }
        var filterRanges = "", maxString = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n"
            maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].unit == "") {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
            }
            else {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
            }
            maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
        }
        // Fetch results
        sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  {\n" +
            "    SELECT ?value ?valueLabel " + maxString + " WHERE {\n" +
            "      ?value wdt:P31 wd:" + this.classValue + ".  \n" +
            filterString +
            "      ?value rdfs:label ?valueLabel.\n" +
            filterRanges +
            filterQuantities +
            "      FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "  } \n" +
            (maxString == "" ? "" : "GROUP BY ?value ?valueLabel\n") +
            (this.totalValues < 50000 ? "" : "LIMIT 200 OFFSET " + ((this.currentPage - 1) * 200))+
            "  }\n" +
            "}\n" +
            (this.totalValues > 50000 ? "" : "ORDER BY ?valueLabel\n")+
            (this.totalValues >= 50000 ? "":"LIMIT 200 OFFSET " + ((this.currentPage - 1) * 200));
        fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty" }))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

viewallitems = Vue.component('view-all-items', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            filtersCount: -1,
            filters: [],
            itemsCount: '',
            currentPage: 1,
            query:""
        }
    },
    template: `
    <div>
        <div class="header">
            <p style="margin-bottom:0px"><b>Class</b>: {{ classLabel }} </p>
            <a class="classOptions" @click="changeView('superclass')">More general class </a>
            <b>&middot;</b>
            <a class="classOptions" @click="changeView('subclass')">More specific class</a>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.filterValue)">X</a>)</p>
            <p v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }} (<a @click="removeRange(range)">X</a>)</p>
            <p v-for="quantity in appliedQuantities"><b>{{quantity.filterValueLabel}}</b>: {{ quantity.valueLabel }} {{quantity.unit}}(<a @click="removeQuantity(quantity)">X</a>)</p>
        </div>
        <div class="content" id="viewallitems">
                <p v-if="filtersCount==-1"></p>
                <p v-else-if="filtersCount==0">No filters are defined for this class.</p>
                <div v-else-if="filtersCount<40" style="margin-bottom:20px">
                <b>Filter on</b>: <span v-for="filter in filters"><a @click="showFilter(filter)">{{filter.valueLabel.value}}</a> <b v-if="filters[filtersCount-1].valueLabel.value != filter.valueLabel.value">&middot; </b> </span>
                </div>
                <p v-else><a class="classOptions" @click="changeView('filters-view')">Add a filter</a></p>
            <p><img v-if="totalValues==''" src='loading.gif'></p>

            <items-results v-if="totalValues!=''"
                :total-values="totalValues"
                :class-label="classLabel"
                :class-value="classValue"
                :applied-filters="appliedFilters"
                :applied-ranges="appliedRanges"
                :applied-quantities="appliedQuantities"
                :current-page="currentPage"
                :key="currentPage">
            </items-results>
            <div v-if="totalValues>200" style="text-align: center">
                <a @click="currentPage>1?currentPage--:''">&lt;</a>
                <input v-model="currentPage" type="text" style="margin-bottom: 15px;width: 48px;text-align: center"> {{totalValues<1000000?" / " + Math.ceil(totalValues/200):''}}
                <a @click="currentPage<totalValues/200?currentPage++:''">&gt;</a>
            </div>
            <a :href="query">View SPARQL query</a>
        </div>
    </div>`,
    methods: {
        changeView(page) {
            this.$emit('change-page', page)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'view-all-items');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'view-all-items');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'view-all-items');
        },
        showFilter(filter) {
            this.$emit('update-filter', filter)
        },

    },
    mounted() {
        // Check available filters
        var sparqlQuery = "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:" + this.classValue + " wdt:P1963 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (?property in (wikibase:Time, wikibase:Quantity, wikibase:WikibaseItem))  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}" +
            "ORDER BY ?valueLabel";
        var fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'] ? (this.filtersCount = response.data['results']['bindings'].length, this.filters = [...response.data['results']['bindings']]) : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })

        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
        }
        var filterRanges = "", maxString = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n"
            maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].unit == "") {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
            }
            else {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
            }
            maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
        }
        sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  {\n" +
            "    SELECT ?value ?valueLabel " + maxString + " WHERE {\n" +
            "      ?value wdt:P31 wd:" + this.classValue + ".  \n" +
            filterString +
            "      ?value rdfs:label ?valueLabel.\n" +
            filterRanges +
            filterQuantities +
            "      FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "  } \n" +
            (maxString == "" ? "" : "GROUP BY ?value ?valueLabel\n") +
            (this.totalValues < 50000 ? "" : "LIMIT 200 OFFSET " + ((this.currentPage - 1) * 200)) +
            "  }\n" +
            "}\n" +
            (this.totalValues > 50000 ? "" : "ORDER BY ?valueLabel\n") +
            (this.totalValues >= 50000 ? "" : "LIMIT 200 OFFSET " + ((this.currentPage - 1) * 200));
        this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);

        // Fetch number of items
        sparqlQuery = "SELECT (COUNT(DISTINCT ?value) AS ?count) WHERE {\n" +
            "  ?value wdt:P31 wd:" + this.classValue + ".  \n" +
            filterString +
            "  ?value rdfs:label ?valueLabel.\n" +
            filterRanges +
            filterQuantities +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}";
        fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => this.itemsCount = response.data['results']['bindings'][0].count.value,this.$emit('total-values',this.itemsCount))
            .catch(error => {
                this.itemsCount = 1000000
            })

    }
})

filtersview = Vue.component('filters-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return { filters: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length && !appliedRanges.length && !appliedQuantities">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
            </ul>
        </div>
        <div class="content">
            <img v-if="!filters.length" src='loading.gif'>
            <p v-else-if="filters[0].value=='Empty'">No filters available</p>
            <div v-else>
                <p>There are <b>{{ totalValues<1000000?numberWithCommas(totalValues):"1 million +" }}</b> items that match this description.</p>
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
        var sparqlQuery = "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:" + this.classValue + " wdt:P1963 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (?property in (wikibase:Time, wikibase:Quantity, wikibase:WikibaseItem))  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}" +
            "ORDER BY ?valueLabel";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.filters = [...response.data['results']['bindings']] : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

filtervalues = Vue.component('filter-values', {
    props: ['classValue', 'classLabel', 'currentFilter', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            items: [],
            itemsType: '',
            fullPropertyValues: [],
            displayCount: 1,
            currentPage: 1,
            filterProperty: "",
            query:""
        }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length && !appliedRanges.length && !appliedQuantities.length">No filters</p>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.filterValue)">X</a>)</p>
            <p v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }} (<a @click="removeRange(range)">X</a>)</p>
            <p v-for="quantity in appliedQuantities"><b>{{quantity.filterValueLabel}}</b>: {{ quantity.valueLabel }} {{quantity.unit}}(<a @click="removeQuantity(quantity)">X</a>)</p>
        </div>
        <div class="content">
            <div v-if="itemsType==''"><p>Getting values for filter <b>{{currentFilter.valueLabel}}</b> ...</p><img src='loading.gif'></div>
            <p v-else-if="itemsType=='Empty'">There are no values for the filter <b>{{currentFilter.valueLabel}}</b>.</p>
            <p v-else-if="itemsType=='Additionalempty'">There are no additional values for the filter <b>{{currentFilter.valueLabel}}</b>.</p>
            <p v-else-if="itemsType=='Error'">Trying to get values for the filter X took too long. <a @click="back()">Go back</a>.</p>
            <div v-else-if="itemsType=='Item'">
                <p v-if="totalValues!=''">There are <b>{{ totalValues<1000000?numberWithCommas(totalValues):"1 million +" }}</b> items that match this description.</p>
                <p> Select {{ appliedFilters.findIndex(filter => filter.filterValue == currentFilter.value) !=-1?"an additional value":"a value"}} for <b>{{currentFilter.valueLabel}}</b>: </p>
                <ul>
                    <li v-for="(item,index) in items" v-if="index < currentPage*200 && index >= (currentPage-1)*200">
                        <a @click="applyFilter(item)">{{item.valueLabel.value}}</a> ({{numberWithCommas(item.count.value)}} results)
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='ItemFail'">
                <p><i>(Getting a complete set of values for this filter took too long; instead, here is a possibly incomplete set.)</i></p>
                <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                <ul>
                    <li v-for="item in items">
                        <a @click="applyFilter(item)">{{item.valueLabel.value}}</a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='Time'">
                <p v-if="totalValues!=''">There are <b>{{ totalValues<1000000?numberWithCommas(totalValues):"1 million +" }}</b> items that match this description.</p>
                <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                <ul v-if="displayCount == 1">
                    <li v-for="item in items" v-if="item.numValues>0">
                        <a @click="applyRange(item)">{{item.bucketName}} </a> ({{numberWithCommas(item.numValues)}} results)
                    </li>
                </ul>
                <ul v-if="displayCount == 0">
                    <li v-for="item in items">
                        <a @click="applyRange(item)">{{item.bucketName}} </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='TimeFail'">
                <p><i>(Getting a complete set of values for this filter took too long; instead, here is a possibly incomplete set.)</i></p>
                <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                <ul>
                    <li v-for="item in items">
                        <a @click="applyRange(item)">{{item.bucketName}} </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='Quantity'">
                <p v-if="displayCount == 1 && totalValues!=''">There are <b>{{ totalValues<1000000?numberWithCommas(totalValues):"1 million +" }}</b> items that match this description.</p>
                <p v-if="displayCount == 0"><i>(Getting a complete set of values for this filter took too long; instead, here is a possibly incomplete set.)</i></p>
                <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                <ul v-if="displayCount == 1">
                    <li v-for="item in items" v-if="item.numValues>0">
                        <a @click="applyQuantityRange(item)">{{item.bucketName}} {{item.unit}} </a> ({{numberWithCommas(item.numValues)}} results)
                    </li>
                </ul>
                <ul v-if="displayCount == 0">
                    <li v-for="item in items">
                        <a @click="applyQuantityRange(item)">{{item.bucketName}} </a>
                    </li>
                </ul>
            </div>
            <div v-if="items.length>200 && itemsType=='Item'" style="text-align: center">
                <a @click="currentPage>1?currentPage--:''">&lt;</a>
                <input v-model="currentPage" type="text" style="margin-bottom: 15px;width: 48px;text-align: center"> {{items.length<1000000?" / " + Math.ceil(items.length/200):''}}
                <a @click="currentPage<items.length/200?currentPage++:''">&gt;</a>
            </div>
            <a :href="query">View SPARQL query</a>
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
        applyQuantityRange(range) {
            this.$emit('apply-quantity', range)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'filter-values');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'filter-values');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'filter-values');
        },
        back() {
            window.history.back()
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
        parseDate(date) {
            if (date.split("-")[0] == "") {
                year = "-" + "0".repeat(6 - date.split("-")[1].length) + date.split("-")[1]
                return date.replace(/^-(\w+)(?=-)/g, year)
            }
            return date
        },
        yearToBCFormat(year) {
            if (Number(year) < 0) {
                return (Number(year) * -1) + " BC"
            }
            return year
        },
        generateDatePropertyValues(dateArray, range) {
            var len = dateArray.length,
            start = 0,
            end = len - 1;
            for (let i = start; i <= end; i++) {
                dateArray[i].time.value = this.parseDate(dateArray[i].time.value)
            }
            ll = earliestDate = new Date(dateArray[start].time.value),
            ul = latestDate = new Date(dateArray[end].time.value);
            index = this.appliedRanges.findIndex(filter => filter.filterValue == range.value);
            if (index != -1) {
                ll = new Date(this.parseDate(String(this.appliedRanges[index].valueLL)));
                ul = new Date(this.parseDate(String(this.appliedRanges[index].valueUL)));
            }
            len > 50000 ? val = 0 : val = 1;
            while (earliestDate < ll || earliestDate == "Invalid Date") {
                start++;
                earliestDate = new Date(dateArray[start].time.value);
            }
            while (latestDate > ul || latestDate == "Invalid Date") {
                latestDate = new Date(dateArray[--end].time.value);
            }
            var earliestYear = earliestDate.getUTCFullYear();
            var earliestMonth = earliestDate.getUTCMonth() + 1;
            var earliestDay = earliestDate.getUTCDate();
            var latestYear = latestDate.getUTCFullYear();
            var latestMonth = latestDate.getUTCMonth() + 1;
            var latestDay = latestDate.getUTCDate();
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
                        bucketName: this.yearToBCFormat(curYear) + " - " + this.yearToBCFormat(curYear + 99),
                        bucketLL: curYear,
                        bucketUL: (curYear + 99),
                        numValues: 0
                    });
                    curYear += 100;
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getUTCFullYear());
                    index = Math.floor((year - iniYear) / 100);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 150) {
                // Split into fifty-year increments.
                var curYear = iniYear = Math.floor(earliestYear / 50) * 50;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: this.yearToBCFormat(curYear) + " - " + this.yearToBCFormat(curYear + 49),
                        bucketLL: curYear,
                        bucketUL: (curYear + 49),
                        numValues: 0
                    });
                    curYear += 50;
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getUTCFullYear());
                    index = Math.floor((year - iniYear) / 50);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 50) {
                // Split into decades.
                var curYear = iniYear = Math.floor(earliestYear / 10) * 10;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: this.yearToBCFormat(curYear) + " - " + this.yearToBCFormat(curYear + 9),
                        bucketLL: curYear,
                        bucketUL: (curYear + 9),
                        numValues: 0
                    });
                    curYear += 10;
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getUTCFullYear());
                    index = Math.floor((year - iniYear) / 10);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 15) {
                // Split into five-year increments.
                var curYear = iniYear = Math.floor(earliestYear / 5) * 5;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: this.yearToBCFormat(curYear) + " - " + this.yearToBCFormat(curYear + 4),
                        bucketLL: curYear,
                        bucketUL: (curYear + 4),
                        numValues: 0
                    });
                    curYear += 5;
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getUTCFullYear());
                    index = Math.floor((year - iniYear) / 5);
                    propertyValues[index].numValues += 1
                }
            } else if (yearDifference > 2) {
                // Split into years.
                var curYear = iniYear = earliestYear;
                while (curYear <= latestYear) {
                    propertyValues.push({
                        bucketName: this.yearToBCFormat(curYear),
                        bucketLL: curYear + '-01-01',
                        bucketUL: curYear + '-12-31',
                        numValues: 0
                    });
                    curYear++;
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = Number(date.getUTCFullYear());
                    index = Math.floor(year - iniYear);
                    propertyValues[index].numValues += 1
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
                        bucketName: this.monthNumberToString(curMonth) + " " + this.yearToBCFormat(curYear),
                        bucketLL: curYear + "-" + curMonth + "-01",
                        bucketUL: curYear + "-" + curMonth + "-30",
                        numValues: 0
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
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    year = date.getUTCFullYear();
                    month = date.getUTCMonth();
                    index = Math.floor(((year - iniYear) * 12 + month - iniMonth + 1));
                    propertyValues[index].numValues += 1
                }
            } else if (dayDifference > 1) {
                // Split into days.
                // We can't just do "curDate = earliestDate" because that
                // won't make a copy.
                var curDate = new Date();
                curDate.setTime(earliestDate.getTime());
                iniDay = curDate.getUTCDate()
                while (curDate <= latestDate) {
                    propertyValues.push({
                        bucketName: this.monthNumberToString(curDate.getUTCMonth() + 1) + " " + curDate.getUTCDate() + ", " + curDate.getUTCFullYear(),
                        bucketLL: curDate.getUTCFullYear() + "-" + (curDate.getUTCMonth() + 1) + "-" + curDate.getUTCDate(),
                        bucketUL: curDate.getUTCFullYear() + "-" + (curDate.getUTCMonth() + 1) + "-" + (curDate.getUTCDate() + 1),
                        numValues: 0

                    });
                    curDate.setDate(curDate.getUTCDate() + 1);
                }
                for (var i = start; i <= end && val != 0; i++) {
                    date = new Date(dateArray[i].time.value);
                    day = Number(date.getUTCDate());
                    index = Math.floor(day - iniDay);
                    propertyValues[index].numValues += 1
                }
            } else if (dayDifference == 0) {
                var curDate = new Date();
                curDate.setTime(earliestDate.getTime());
                propertyValues.push({
                    bucketName: this.monthNumberToString(curDate.getUTCMonth() + 1) + " " + curDate.getUTCDate() + ", " + curDate.getUTCFullYear(),
                    bucketLL: curDate.getUTCFullYear() + "-" + (curDate.getUTCMonth() + 1) + "-" + curDate.getUTCDate(),
                    bucketUL: curDate.getUTCFullYear() + "-" + (curDate.getUTCMonth() + 1) + "-" + (curDate.getUTCDate() + 1),
                    numValues: len

                });
            }
            this.displayCount = val;
            return propertyValues;
        },
        getNearestNiceNumber(num, previousNum, nextNum) {
            if (previousNum == null) {
                var smallestDifference = nextNum - num;
            } else if (nextNum == null) {
                var smallestDifference = num - previousNum;
            } else {
                var smallestDifference = Math.min(num - previousNum, nextNum - num);
            }

            var base10LogOfDifference = Math.log(smallestDifference) / Math.LN10;
            var significantFigureOfDifference = Math.floor(base10LogOfDifference);

            var powerOf10InCorrectPlace = Math.pow(10, Math.floor(base10LogOfDifference));
            var significantDigitsOnly = Math.round(num / powerOf10InCorrectPlace);
            var niceNumber = significantDigitsOnly * powerOf10InCorrectPlace;

            // Special handling if it's the first or last number in the series -
            // we have to make sure that the "nice" equivalent is on the right
            // "side" of the number.

            // That's especially true for the last number -
            // it has to be greater, not just equal to, because of the way
            // number filtering works.
            // ...or does it??
            if (previousNum == null && niceNumber > num) {
                niceNumber -= powerOf10InCorrectPlace;
            }
            if (nextNum == null && niceNumber < num) {
                niceNumber += powerOf10InCorrectPlace;
            }

            // Now, we have to turn it into a string, so that the resulting
            // number doesn't end with something like ".000000001" due to
            // floating-point arithmetic.
            var numDecimalPlaces = Math.max(0, 0 - significantFigureOfDifference);
            return niceNumber.toFixed(numDecimalPlaces);
        },
        generateIndividualFilterValuesFromNumbers(uniqueValues, unit) {
            // Unfortunately, object keys aren't necessarily cycled through
            // in the correct order - put them in an array, so that they can
            // be sorted.
            var uniqueValuesArray = [];
            for (uniqueValue in uniqueValues) {
                uniqueValuesArray.push(uniqueValue);
            }

            // Sort numerically, not alphabetically.
            uniqueValuesArray.sort(function (a, b) { return a - b; });

            var propertyValues = [];
            for (i = 0; i < uniqueValuesArray.length; i++) {
                var uniqueValue = uniqueValuesArray[i];
                var curBucket = {};
                curBucket['bucketName'] = numberWithCommas(uniqueValue);
                curBucket['numValues'] = uniqueValues[uniqueValue];
                curBucket['bucketUL'] = uniqueValue;
                curBucket['bucketLL'] = uniqueValue;
                curBucket['unit'] = unit;
                propertyValues.push(curBucket);
            }
            return propertyValues;
        },
        generateFilterValuesFromNumbers(numberArray, unit = '') {
            var numNumbers = numberArray.length;
            // First, find the number of unique values - if it's the value of
            // gBucketsPerFilter, or fewer, just display each one as its own
            // bucket.
            var numUniqueValues = 0;
            var uniqueValues = {};
            for (i = 0; i < numNumbers; i++) {
                var curNumber = Number(numberArray[i].amount.value);
                if (!uniqueValues.hasOwnProperty(curNumber)) {
                    uniqueValues[curNumber] = 1;
                    numUniqueValues++;
                    if (numUniqueValues > gBucketsPerFilter) continue;
                } else {
                    // We do this now to save time on the next step,
                    // if we're creating individual filter values.
                    uniqueValues[curNumber]++;
                }
            }
            if (numUniqueValues <= gBucketsPerFilter) {
                return this.generateIndividualFilterValuesFromNumbers(uniqueValues, unit);
            }
            var propertyValues = [];
            var separatorValue = Number(numberArray[0].amount.value);
            // Make sure there are at least, on average, five numbers per bucket.
            // HACK - add 3 to the number so that we don't end up with just one
            // bucket ( 7 + 3 / 5 = 2).
            var numBuckets = Math.min(gBucketsPerFilter, Math.floor((numNumbers + 3) / 5));
            var bucketSeparators = [];
            bucketSeparators.push(Number(numberArray[0].amount.value));
            for (i = 1; i < numBuckets; i++) {
                separatorIndex = Math.floor(numNumbers * i / numBuckets) - 1;
                previousSeparatorValue = separatorValue;
                separatorValue = Number(numberArray[separatorIndex].amount.value);
                if (separatorValue == previousSeparatorValue) {
                    continue;
                }
                bucketSeparators.push(separatorValue);
            }
            bucketSeparators.push(Math.ceil(Number(numberArray[numberArray.length - 1].amount.value)));
            bucketSeparators.sort(function (a, b) { return a - b });
            // Get the closest "nice" (few significant digits) number for each of
            // the bucket separators, with the number of significant digits
            // required based on their proximity to their neighbors.
            // The first and last separators need special handling.
            bucketSeparators[0] = this.getNearestNiceNumber(bucketSeparators[0], null, bucketSeparators[1]);
            for (i = 1; i < bucketSeparators.length - 1; i++) {
                bucketSeparators[i] = this.getNearestNiceNumber(bucketSeparators[i], bucketSeparators[i - 1], bucketSeparators[i + 1]);
            }
            bucketSeparators[bucketSeparators.length - 1] = this.getNearestNiceNumber(bucketSeparators[bucketSeparators.length - 1], bucketSeparators[bucketSeparators.length - 2], null);
            var oldSeparatorValue = bucketSeparators[0];
            var separatorValue;
            for (i = 1; i < bucketSeparators.length; i++) {
                separatorValue = bucketSeparators[i];
                var curBucket = {};
                curBucket['numValues'] = 0;
                var curFilter = new NumberRange(oldSeparatorValue, separatorValue);
                curBucket['bucketName'] = curFilter.toString();
                curBucket['bucketLL'] = curFilter.lowNumber;
                curBucket['bucketUL'] = curFilter.highNumber;
                curBucket['unit'] = unit;
                propertyValues.push(curBucket);
                oldSeparatorValue = separatorValue;
            }
            var curSeparator = 0;
            for (i = 0; i < numberArray.length; i++) {
                if (curSeparator < propertyValues.length - 1) {
                    var curNumber = Number(numberArray[i].amount.value);
                    while (curNumber >= bucketSeparators[curSeparator + 1]) {
                        curSeparator++;
                    }
                }
                propertyValues[curSeparator]['numValues']++;
            }
            return propertyValues;
        }
    },
    mounted() {
        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "?item wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
        }
        var filterRanges = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            filterRanges += "?item wdt:" + this.appliedRanges[i].filterValue + " ?time" + i + ".\n" +
                "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n"
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].unit == "") {
                filterQuantities += "?item (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n"
            }
            else {
                filterQuantities += "?item (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n"

            }
        }
        var sparqlQuery = "SELECT ?property WHERE {\n" +
            "  wd:" + this.currentFilter.value + " wikibase:propertyType ?property.\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        let vm = this;
        axios.get(fullUrl)
            .then((response) => {
                if (response.data['results']['bindings'][0].property.value.split("#")[1] == "Time") {
                    var sparqlQuery = "SELECT ?time WHERE {\n" +
                        "?item wdt:P31 wd:" + this.classValue + ".\n" +
                        filterString +
                        filterRanges +
                        "?item wdt:" + this.currentFilter.value + " ?time.\n" +
                        filterQuantities +
                        "}\n" +
                        "ORDER by ?time";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                    const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => (response.data['results']['bindings'].length ? (this.itemsType = 'Time', this.items = this.generateDatePropertyValues(response.data['results']['bindings'], this.currentFilter)) : this.itemsType = 'Empty'))
                        .catch(error => {
                            var sparqlQuery = "SELECT ?time WHERE{SELECT ?time WHERE {\n" +
                                "  hint:Query hint:optimizer \"None\".\n" +
                                "?item wdt:P31 wd:" + vm.classValue + ".\n" +
                                filterString +
                                "?item wdt:" + vm.currentFilter.value + " ?time.\n" +
                                filterRanges +
                                filterQuantities +
                                "}\n" +
                                "LIMIT 200\n" +
                                "}\n" +
                                "ORDER BY ?time";
                            this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then(res => (res.data['results']['bindings'].length ? (vm.itemsType = 'TimeFail', vm.items = vm.generateDatePropertyValues(res.data['results']['bindings'], vm.currentFilter)) : vm.itemsType = 'Empty')
                                )
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else if (response.data['results']['bindings'][0].property.value.split("#")[1] == "Quantity") {
                    var sparqlQuery = "SELECT ?item ?amount WHERE {\n" +
                        "    ?item wdt:P31 wd:" + this.classValue + ".\n" +
                        filterString +
                        "    ?item (p:" + this.currentFilter.value + "/psn:" + this.currentFilter.value + ") ?v.\n" +
                        "    ?v wikibase:quantityAmount ?amount.\n" +
                        filterRanges +
                        filterQuantities +
                        "}\n" +
                        "ORDER BY ?amount";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                    const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => (response.data['results']['bindings'].length ? response : ''))
                        .then(
                            function (response) {
                                if (response == "") {
                                    var sparqlQuery2 = "SELECT ?amount WHERE {\n" +
                                        "    ?item wdt:P31 wd:" + vm.classValue + ".\n" +
                                        filterString +
                                        "    ?item (p:" + vm.currentFilter.value + "/psv:" + vm.currentFilter.value + ") ?v.\n" +
                                        "    ?v wikibase:quantityAmount ?amount.\n" +
                                        filterRanges +
                                        filterQuantities +
                                        "}\n" +
                                        "ORDER BY ?amount";
                                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery2);
                                    const fullUr = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery2);
                                    axios.get(fullUr)
                                        .then(res => (res.data['results']['bindings'].length ? (vm.itemsType = 'Quantity', vm.items = vm.generateFilterValuesFromNumbers(res.data['results']['bindings'])) : vm.itemsType = 'Empty'))
                                        .catch(error => {
                                            sparqlQuery = "SELECT ?amount WHERE\n" +
                                                "{\n" +
                                                "  SELECT ?amount WHERE {\n" +
                                                "    hint:Query hint:optimizer \"None\".\n" +
                                                "    ?item wdt:P31 wd:" + vm.classValue + ".\n" +
                                                "    ?item (p:" + vm.currentFilter.value + "/psv:" + vm.currentFilter.value + ") ?v.\n" +
                                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                                "}\n" +
                                                "LIMIT 200\n" +
                                                "}\n" +
                                                "ORDER BY ?amount";
                                            const fullUr = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                                            axios.get(fullUr)
                                                .then(r => (r.data['results']['bindings'].length ? (vm.itemsType = 'Quantity', vm.items = vm.generateFilterValuesFromNumbers(r.data['results']['bindings']), vm.displayCount = 0) : vm.itemsType = 'Empty'))
                                                .catch(error => {
                                                    vm.itemsType = 'Error'
                                                })
                                        })
                                }
                                else {
                                    firstItem = response.data['results']['bindings'][0].item.value.split("/").slice(-1)[0];
                                    var unitQuery = "SELECT ?unitLabel WHERE {\n" +
                                        "    wd:" + firstItem + " (p:" + vm.currentFilter.value + "/psn:" + vm.currentFilter.value + ") ?v.\n" +
                                        "    ?v wikibase:quantityAmount ?amount;\n" +
                                        "       wikibase:quantityUnit ?unit.\n" +
                                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                                        "}";
                                    const url = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(unitQuery);
                                    axios.get(url)
                                        .then(res => response.data['results']['bindings'].length ? (vm.itemsType = 'Quantity', vm.items = vm.generateFilterValuesFromNumbers(response.data['results']['bindings'], res.data['results']['bindings'][0].unitLabel.value)) : vm.itemsType = 'Empty')
                                        .catch(error => {
                                            vm.itemsType = 'Error'
                                        })

                                }
                            }
                        )
                        .catch(error => {
                            sparqlQuery = "SELECT ?amount WHERE\n" +
                                "{\n" +
                                "  SELECT ?item ?amount WHERE {\n" +
                                "  hint:Query hint:optimizer \"None\".\n" +
                                "    ?item wdt:P31 wd:" + vm.classValue + ".\n" +
                                "    ?item (p:" + vm.currentFilter.value + "/psn:" + vm.currentFilter.value + ") ?v.\n" +
                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                "}\n" +
                                "LIMIT 200\n" +
                                "}\n" +
                                "ORDER BY ?amount";
                            this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                            const url = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                            axios.get(url)
                                .then(res => (vm.itemsType = 'Quantity', vm.items = vm.generateFilterValuesFromNumbers(res.data['results']['bindings']), vm.displayCount = 0))
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else {
                    var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
                        "  hint:Query hint:optimizer \"None\".\n" +
                        "  ?item wdt:P31 wd:" + this.classValue + ".\n" +
                        " ?item wdt:" + this.currentFilter.value + " ?value.\n" +
                        filterString +
                        "  ?value rdfs:label ?valueLabel.\n" +
                        filterRanges +
                        filterQuantities +
                        "  FILTER(LANG(?valueLabel) = 'en').\n" +
                        "}\n" +
                        "GROUP BY ?value ?valueLabel\n" +
                        "ORDER BY DESC(?count)";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                        axios.get(fullUrl)
                        .then(response => {
                            if(response.data['results']['bindings'].length){
                                arr = [...response.data['results']['bindings']]
                                index = vm.appliedFilters.findIndex(filter => filter.filterValue == vm.currentFilter.value)
                                if(index !=-1){
                                    for (let i = 0; i < arr.length; i++) {
                                        if (arr[i].value.value.split('/').slice(-1)[0] == vm.appliedFilters[index].value){
                                            arr.splice(i,1)
                                        }
                                    }
                                }
                                if(arr.length>0){
                                    this.itemsType = "Item"
                                    this.items = arr
                                }
                                else{
                                    this.itemsType = "Additionalempty"
                                }
                            } 
                            else{
                                this.itemsType = 'Empty'
                            }
                        })
                        .catch(error => {
                            var sparqlQuery = "SELECT DISTINCT ?value ?valueLabel\n" +
                                "{\n" +
                                "  SELECT ?value ?valueLabel WHERE {\n" +
                                "    hint:Query hint:optimizer \"None\".\n" +
                                "  ?item wdt:P31 wd:" + vm.classValue + ".\n" +
                                " ?item wdt:" + vm.currentFilter.value + " ?value.\n" +
                                filterString +
                                "  ?value rdfs:label ?valueLabel.\n" +
                                filterRanges +
                                filterQuantities +
                                "  FILTER(LANG(?valueLabel) = 'en').\n" +
                                "}\n" +
                                "LIMIT 300\n" +
                                "}\n" +
                                "ORDER BY ?valueLabel";
                            this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then(res => (vm.itemsType = "ItemFail", vm.items = [...res.data['results']['bindings']].slice(0).sort(
                                    function (a, b) {
                                        var x = a.valueLabel.value.toLowerCase();
                                        var y = b.valueLabel.value.toLowerCase();
                                        return x < y ? -1 : x > y ? 1 : 0;
                                    }
                                )))
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })

                        })
                }
            })
    }
})

subclass = Vue.component('subclass-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return { items: [], displayCount: 0 }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length && !appliedRanges.length && !appliedQuantities">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
                <li v-for="quantity in appliedQuantities"><b>{{quantity.filterValueLabel}}</b>: {{ quantity.valueLabel }}</li>
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
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a> <span v-if="displayCount==0">({{item.count.value}} results)</span>
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
        let vm = this
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                sparqlQuery = "SELECT DISTINCT ?value ?valueLabel WHERE {\n" +
                    "  SELECT ?value ?valueLabel WHERE {\n" +
                    "    ?v wdt:P31 ?value.\n" +
                    "    ?value wdt:P279 wd:" + vm.classValue + ";\n" +
                    "      rdfs:label ?valueLabel.\n" +
                    "    FILTER((LANG(?valueLabel)) = \"en\")\n" +
                    "  }\n" +
                    "  LIMIT 200\n" +
                    "}\n" +
                    "ORDER BY ?valueLabel";
                const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => (response.data['results']['bindings'].length ? (vm.items = [...response.data['results']['bindings']], vm.displayCount = 1) : vm.items.push({ value: "Empty", valueLabel: "No data" })))
                    .catch(error => {
                        vm.itemsType = 'Error'
                    })
            })
    }
})

superclass = Vue.component('superclass-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return { items: [], displayCount: 0 }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length && !appliedRanges.length && !appliedQuantities">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: {{ range.valueLabel }}</li>
                <li v-for="quantity in appliedQuantities"><b>{{quantity.filterValueLabel}}</b>: {{ quantity.valueLabel }}</li>
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
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a> <span v-if="displayCount==0">({{item.count.value}} results)</span>
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
        let vm = this;
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                sparqlQuery = "SELECT DISTINCT ?value ?valueLabel WHERE\n" +
                    "{SELECT ?value ?valueLabel WHERE {\n" +
                    "  ?v wdt:P31 ?value.\n" +
                    "  wd:" + vm.classValue + " wdt:P279 ?value.\n" +
                    "  ?value rdfs:label ?valueLabel.  \n" +
                    "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
                    "}\n" +
                    "LIMIT 200\n" +
                    "}\n" +
                    "ORDER BY ?valueLabel";

                const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => (response.data['results']['bindings'].length ? (vm.items = [...response.data['results']['bindings']], vm.displayCount = 1) : vm.items.push({ value: "Empty", valueLabel: "No data" })))
                    .catch(error => {
                        vm.itemsType = 'Error'
                    })
            })
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
        currentFilterPropertyType: '',
        appFilters: [],
        appRanges: [],
        appQuantities: [],
        getFiltersFromURL: 1,
        allItemscomponentKey: 0,
        filterscomponentKey: 0,
        total:''
    },
    mounted: function () {
        if(this.classLabel != ""){
            window.history.pushState({
                page: this.view,
                classValue: this.classValue,
                filters: this.appliedFilters,
                quantities: this.appliedQuantities,
                ranges: this.appliedRanges,
                currentFilterLabel: this.currentFilterLabel,
                currentFilterValue: urlParams.has('cf') ? urlParams.get('cf') : '',
                fromURL: 0,
                allItemscomponentKey: this.allItemscomponentKey,
                filterscomponentKey: this.filterscomponentKey
            }, '',
            window.location.pathname + "?" + urlParams
            );
        }
        window.onpopstate = history.onpushstate = function (e) {
            if (e.state) {
                app.page = e.state.page
                app.clsValue = e.state.classValue
                app.getFiltersFromURL =  e.state.fromURL
                app.appFilters = e.state.filters
                app.appQuantities = e.state.quantities
                app.appRanges = e.state.ranges
                app.currentFilterLabel =  e.state.currentFilterLabel
                app.currentFilterValue =  e.state.currentFilterValue
                app.allItemscomponentKey =  e.state.allItemscomponentKey
                app.filterscomponentKey =  e.state.filterscomponentKey
            }
        };
    },
    methods: {
        updatePage: function (page) {
            if (page == "subclass" || page == "superclass" || page == "filters") {
                urlParams.set('view', page)
            }
            this.page = page
            this.total = ""
            window.history.pushState({
                page: page,
                classValue: this.classValue,
                filters: this.appliedFilters,
                quantities: this.appliedQuantities,
                ranges: this.appliedRanges,
                currentFilterLabel: this.currentFilterLabel,
                currentFilterValue: this.currentFilterValue,
                fromURL: 0,
                allItemscomponentKey: this.allItemscomponentKey,
                filterscomponentKey: this.filterscomponentKey
            }, '',
                window.location.pathname + "?" + urlParams
            );
        },
        updateClassValue: function (classValue, classLabel = "") {
            urlParams = new URLSearchParams("")
            urlParams.set('c', classValue)
            this.clsValue = classValue;
            this.classLabel = classLabel
            this.currentFilterLabel = '';
            this.currentFilterValue = '';
            this.appFilters = [];
            this.appRanges = [];
            this.appQuantities = [];
            // this.getFiltersFromURL = 1;
            this.allItemscomponentKey = 0;
            this.filterscomponentKey = 0;
            this.totalValues = ''
            this.updatePage('view-all-items')

        },
        updateFilter: function (filter) {
            this.currentFilterLabel = filter.valueLabel.value
            this.currentFilterValue = filter.value.value.split('/').slice(-1)[0]
            urlParams.set('cf', this.currentFilterValue)
            urlParams.delete('view')
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
            urlParams.delete("cf")
            this.updatePage('view-all-items')
        },
        applyRange: function (range) {
            const i = this.appRanges.findIndex(_item => _item.filterValue == this.currentFilter.value);
            if (i > -1) {
                this.appRanges[i] = {
                    filterValue: this.currentFilter.value,
                    filterValueLabel: this.currentFilter.valueLabel,
                    valueLabel: range.bucketName,
                    valueLL: range.bucketLL,
                    valueUL: range.bucketUL
                }
            }
            else {
                this.appRanges.push({
                    filterValue: this.currentFilter.value,
                    filterValueLabel: this.currentFilter.valueLabel,
                    valueLabel: range.bucketName,
                    valueLL: range.bucketLL,
                    valueUL: range.bucketUL
                });
            }
            urlParams.delete("cf")
            urlParams.set("range[" + this.currentFilter.value + "]", range.bucketLL + "|" + range.bucketUL)
            this.updatePage('view-all-items')
        },
        applyQuantityRange: function (range) {
            const i = this.appQuantities.findIndex(_item => _item.filterValue == this.currentFilter.value);
            if (i > -1) {
                this.appQuantities[i] = {
                    filterValue: this.currentFilter.value,
                    filterValueLabel: this.currentFilter.valueLabel,
                    valueLabel: range.bucketName,
                    valueLL: range.bucketLL,
                    valueUL: range.bucketUL,
                    unit: range.unit
                }
            }
            else {
                this.appQuantities.push({
                    filterValue: this.currentFilter.value,
                    filterValueLabel: this.currentFilter.valueLabel,
                    valueLabel: range.bucketName,
                    valueLL: range.bucketLL,
                    valueUL: range.bucketUL,
                    unit: range.unit
                });
            }
            urlParams.delete("cf")
            urlParams.set("quantity[" + this.currentFilter.value + "]", range.bucketLL + "|" + range.bucketUL + "|" + range.unit)
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
            urlParams.delete("filter[" + value + "]")
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
        removeQuantity: function (quantity, page) {
            index = this.appQuantities.findIndex(filter => filter.filterValue == quantity.filterValue);
            this.appQuantities.splice(index, 1)
            urlParams.delete("quantity[" + quantity.filterValue + "]")
            this.updatePage(page)
            this.getFiltersFromURL = 0
            this.forceAllItemsRerender()
            this.forceFiltersRerender()
        },

    },
    computed: {
        view: function () {
            if (this.page == "") {
                if (!urlParams.has("c") && !urlParams.has("view")) {
                    return 'class-filter'
                }
                else if (urlParams.has("c") && !urlParams.has("cf") && !urlParams.has("view")) {
                    return 'view-all-items'
                }
                else if (urlParams.has("c") && urlParams.has("cf") && !urlParams.has("view")) {
                    return 'filter-values'
                }
                else if (urlParams.has("c") && urlParams.get("view") == "subclass") {
                    return 'subclass'
                }
                else if (urlParams.has("c") && urlParams.get("view") == "superclass") {
                    return 'superclass'
                }
                else if (urlParams.has("c") && urlParams.get("view") == "filters") {
                    return 'filters'
                }
            }
            return this.page
        },
        classValue: function () {
            if (this.clsValue == '') {
                value = urlParams.has('c') ? urlParams.get('c') : ''
            }
            else {
                value = this.clsValue
            }
            if (value != '') {
                var sparqlQuery = "SELECT ?value WHERE {\n" +
                    "  wd:" + value + " rdfs:label ?value.\n" +
                    "  FILTER(LANG(?value) = \"en\")\n" +
                    "}";
                const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => {
                        this.classLabel = response.data['results']['bindings'][0].value.value
                    })
            }
            return value
        },
        currentFilter: function () {
            if (this.currentFilterValue == '') {
                val = urlParams.has('cf') ? urlParams.get('cf') : ''
            }
            else {
                val = this.currentFilterValue
            }
            var sparqlQuery = "SELECT ?value WHERE {\n" +
                "  wd:" + val + " rdfs:label ?value\n" +
                "  FILTER(LANG(?value) = \"en\")\n" +
                "}";
            const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
                .then(response => (this.currentFilterLabel = response.data['results']['bindings'][0].value.value))
            return { value: val, valueLabel: this.currentFilterLabel }
        },
        appliedFilters: function () {
            if (this.appFilters.length == 0 && this.getFiltersFromURL == 1) {
                url = decodeURI(urlParams);
                var res = url.match(/filter\[P\d+\]/g);
                var filters = values = "";
                if (res != null) {
                    for (var i = 0; i < res.length; i++) {
                        this.appFilters.push({
                            filterValue: res[i].split("[")[1].slice(0, -1),
                            filterValueLabel: res[i].split("[")[1].slice(0, -1),
                            value: urlParams.get(res[i]),
                            valueLabel: urlParams.get(res[i])
                        })
                        filters += " wdt:" + res[i].split("[")[1].slice(0, -1)
                        values += " wd:" + urlParams.get(res[i])
                    }
                    var sparqlQuery = "SELECT ?prop ?propLabel WHERE {\n" +
                        "  hint:Query hint:optimizer \"None\".\n" +
                        "  VALUES ?p {  " + filters + " }\n" +
                        "  ?prop wikibase:directClaim ?p.\n" +
                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                        "}";
                    var fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            for (let i = 0; i < response.data['results']['bindings'].length; i++) {
                                index = this.appFilters.findIndex(filter => filter.filterValue == response.data['results']['bindings'][i].prop.value.split("/").slice(-1)[0]);
                                if (index != -1) {
                                    this.appFilters[index].filterValueLabel = response.data['results']['bindings'][i].propLabel.value
                                }
                            }
                        })
                        
                    sparqlQuery = "SELECT ?value ?label WHERE {\n" +
                        "  VALUES ?value { " + values + " }\n" +
                        "  ?value rdfs:label ?label.\n" +
                        "  FILTER((LANG(?label)) = \"en\")\n" +
                        "}";
                    var fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            for (let i = 0; i < response.data['results']['bindings'].length; i++) {
                                index = this.appFilters.findIndex(filter => filter.value == response.data['results']['bindings'][i].value.value.split("/").slice(-1)[0]);
                                if (index != -1) {
                                    this.appFilters[index].valueLabel = response.data['results']['bindings'][i].label.value
                                }
                            }
                        })
                }
            }
            return this.appFilters
        },
        appliedRanges: function () {
            if (this.appRanges.length == 0 && this.getFiltersFromURL == 1) {
                url = decodeURI(urlParams);
                var res = url.match(/range\[P\d+\]/g);
                var filters = "";
                if (res != null) {
                    for (var i = 0; i < res.length; i++) {
                        this.appRanges.push({
                            filterValue: res[i].split("[")[1].slice(0, -1),
                            filterValueLabel: res[i].split("[")[1].slice(0, -1),
                            valueLL: urlParams.get(res[i]).split("|")[0].trim(),
                            valueUL: urlParams.get(res[i]).split("|")[1].trim(),
                            valueLabel: urlParams.get(res[i]).split("|")[0].trim() + " - " + urlParams.get(res[i]).split("|")[1].trim()
                        })
                        filters += " wdt:" + res[i].split("[")[1].slice(0, -1)
                    }
                    var sparqlQuery = "SELECT ?prop ?propLabel WHERE {\n" +
                        "  hint:Query hint:optimizer \"None\".\n" +
                        "  VALUES ?p {  " + filters + " }\n" +
                        "  ?prop wikibase:directClaim ?p.\n" +
                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                        "}";
                    var fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            for (let i = 0; i < response.data['results']['bindings'].length; i++) {
                                index = this.appRanges.findIndex(filter => filter.filterValue == response.data['results']['bindings'][i].prop.value.split("/").slice(-1)[0]);
                                if (index != -1) {
                                    this.appRanges[index].filterValueLabel = response.data['results']['bindings'][i].propLabel.value
                                }
                            }
                        })
                }
            }
            return this.appRanges
        },
        appliedQuantities: function () {
            if (this.appQuantities.length == 0 && this.getFiltersFromURL == 1) {
                url = decodeURI(urlParams);
                var res = url.match(/quantity\[P\d+\]/g);
                var filters = "";
                if (res != null) {
                    for (var i = 0; i < res.length; i++) {
                        this.appQuantities.push({
                            filterValue: res[i].split("[")[1].slice(0, -1),
                            filterValueLabel: res[i].split("[")[1].slice(0, -1),
                            valueLL: urlParams.get(res[i]).split("|")[0].trim(),
                            valueUL: urlParams.get(res[i]).split("|")[1].trim(),
                            valueLabel: numberWithCommas(urlParams.get(res[i]).split("|")[0].trim()) + " - " + numberWithCommas(urlParams.get(res[i]).split("|")[1].trim()),
                            unit: urlParams.get(res[i]).split("|")[2].trim()
                        })
                        filters += " wdt:" + res[i].split("[")[1].slice(0, -1)
                    }
                    var sparqlQuery = "SELECT ?prop ?propLabel WHERE {\n" +
                        "  hint:Query hint:optimizer \"None\".\n" +
                        "  VALUES ?p {  " + filters + " }\n" +
                        "  ?prop wikibase:directClaim ?p.\n" +
                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                        "}";
                    var fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            for (let i = 0; i < response.data['results']['bindings'].length; i++) {
                                index = this.appQuantities.findIndex(filter => filter.filterValue == response.data['results']['bindings'][i].prop.value.split("/").slice(-1)[0]);
                                if (index != -1) {
                                    this.appQuantities[index].filterValueLabel = response.data['results']['bindings'][i].propLabel.value
                                }
                            }
                        })
                }
            }
            return this.appQuantities
        },
        totalValues: function(){
            var filterString = "";
            for (let i = 0; i < this.appliedFilters.length; i++) {
                filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
            }
            var filterRanges = "";
            for (let i = 0; i < this.appliedRanges.length; i++) {
                filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n"
            }
            var filterQuantities = "";
            for (let i = 0; i < this.appliedQuantities.length; i++) {
                if (this.appliedQuantities[i].unit == "") {
                    filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
                }
                else {
                    Values
                    filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"

                }
            }
            sparqlQuery = "SELECT (COUNT(DISTINCT ?value) AS ?count) WHERE {\n" +
                "  ?value wdt:P31 wd:" + this.classValue + ".  \n" +
                filterString +
                "  ?value rdfs:label ?valueLabel.\n" +
                filterRanges +
                filterQuantities +
                "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
                "}";
            fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
                .then(response => this.total = response.data['results']['bindings'][0].count.value)
                .catch(error => {
                    this.total = 1000000
                })
            return this.total
        }
    },
    watch:{
        classLabel: function(){
            window.history.pushState({
                page: this.view,
                classValue: this.classValue,
                filters: this.appliedFilters,
                quantities: this.appliedQuantities,
                ranges: this.appliedRanges,
                currentFilterLabel: this.currentFilterLabel,
                currentFilterValue: urlParams.has('cf') ? urlParams.get('cf') : '',
                fromURL: 0,
                allItemscomponentKey: this.allItemscomponentKey,
                filterscomponentKey: this.filterscomponentKey
            }, '',
                window.location.pathname + "?" + urlParams
            );
        }
    }
})
