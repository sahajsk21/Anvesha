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
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues'],
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
                <p>There are <b>{{ itemsCount }}</b> items that match this description.</p>
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
        }
    },
    mounted() {
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

        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ";\n";
        }

        var countQuery = "SELECT (COUNT(?value) AS ?c) WHERE {\n" +
            "  ?value wdt:P31 wd:" + this.classValue + ";\n" +
            filterString +
            "}";
        const countUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(countQuery);
        axios.get(countUrl)
            .then(response => this.itemsCount = response.data['results']['bindings'][0].c.value)
            .catch(error => {
                this.items.push({ value: "Error" })
            })

        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  ?value wdt:P31 wd:" + this.classValue + ";\n" +
            filterString +
            "         rdfs:label ?valueLabel;\n" +
            "  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}\n" +
            "LIMIT 20";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

filtersview = Vue.component('filters-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues'],
    data() {
        return { filters: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">   No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
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
            "SELECT ?value ?valueLabel WHERE {\n" +
            "  wd:"+this.classValue+" wdt:P1963 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
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
    props: ['classValue', 'classLabel', 'currentFilter', 'appliedFilters', 'totalValues'],
    data() {
        return { items: [] }
    },
    template: `
    <div>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.filterValue)">X</a>)</p>
        </div>
        <div class="content">
            <img v-if="!items.length" src='loading.gif'>
                <p v-else-if="items[0].value=='Empty'">There are no values for the filter <b>{{currentFilter.valueLabel}}</b>.</p>
                <p v-else-if="items[0].value=='Error'">The attempt to display a list of items took too long; please consider adding more filters.</p>
                <div v-else>
                    <p>There are <b>{{ totalValues }}</b> items that match this description.</p>
                    <p> Select a value for <b>{{currentFilter.valueLabel}}</b>:</p>
                    <ul>
                        <li v-for="item in items">
                            <a @click="applyFilter(item)">{{item.valueLabel.value}}</a> ({{item.count.value}} results)
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
        removeFilter(value) {
            this.$emit("remove-filter", value, 'filter-values');
        }
    },
    mounted() {
        var filterString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            filterString += "wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ";\n";
        }
        var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:P31 wd:" + this.classValue + ";\n" +
            filterString +
            "     wdt:" + this.currentFilter.value + " ?value.\n" +
            "  ?value rdfs:label ?valueLabel\n" +
            "  FILTER(LANG(?valueLabel) = 'en').\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel\n" +
            "ORDER BY DESC(?count)";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

subclass = Vue.component('subclass-view', {
    props: ['classValue', 'classLabel', 'appliedFilters'],
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
    props: ['classValue', 'classLabel', 'appliedFilters'],
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
        appFilters: [],
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
            this.getFiltersFromURL=1;
            this.allItemscomponentKey = 0;
            this.filterscomponentKey = 0;
            this.totalValues=''
        },
        updateFilter: function (filter) {
            this.currentFilterLabel=filter.valueLabel.value
            this.currentFilterValue = filter.value.value.split('/').slice(-1)[0]
            urlParams.set('cf', filter.value.value.split('/').slice(-1)[0])
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
        forceAllItemsRerender() {
            this.allItemscomponentKey += 1;
        },
        forceFiltersRerender() {
            this.filterscomponentKey += 1;
        },
        removeFilter: function (value, page) {
            index = this.appliedFilters.findIndex(filter => filter.value == value);
            this.appFilters.splice(index, 1)
            urlParams.delete("filter["+value+"]")
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
            }
            else {
                val = this.currentFilterValue
            }
            if( val != ''){
                var sparqlQuery = "SELECT ?value WHERE {\n" +
                "  wd:" + val + " rdfs:label ?value.\n" +
                "  FILTER(LANG(?value) = \"en\")\n" +
                "}";
                const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => response.data['results']['bindings'][0].value.value)
            }
            return { value: val, valueLabel: this.currentFilterLabel }
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
        }
    }
})




