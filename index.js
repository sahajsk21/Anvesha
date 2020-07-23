Vue.config.devtools = true;
classfilter = Vue.component('class-filter', {
    props:['classValue','appliedFilters','classLabel'],
    template: `
    <div>
        <div class="classSearchSection">
            <h3>Class: {{classLabel}}</h3>
            <input v-model="localClassValue" @keyup.enter="submit" class="classSearch" type="text" style="margin-bottom: 15px;">
        </div>
        <a @click="submit">Browse this class</a>
    </div>`,
    data(){
        return {
            localClassValue: this.classValue,
            localClassLabel:this.classLabel
        }
    },
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        submit(){
            this.$emit("class-label", this.localClassValue, this.localClassLabel);
            // this.classValue = "";
            this.changePage('view-all-items')
        },
        
    }
})

viewallitems = Vue.component('view-all-items', {
    props: ['classLabel', 'appliedFilters','totalValues'],
    data(){
        return {
            items:[],
            filtersCount:-1,
            itemsCount:''
        }
    },
    template: `
    <div>
    <a @click="changePage('class-filter')">back</a>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{ filter.valueLabel }} (<a @click="removeFilter(filter.value)">X</a>)</p>
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
            <p v-else-if="items[0].value=='Empty'">No data</p>
            <div v-else>
                <p>There are <b>{{ itemsCount }}</b> items that match this description.</p>
                    <ul>
                        <li v-for="item in items">
                            <a>{{item.valueLabel.value}}</a>
                        </li>
                    </ul>
            </div>
        </div>
    </div>`,
    methods: {
        changePage(page, totalValues) {
            this.$emit('change-page', page, totalValues)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value);
        }
    },
    created(){
        var filterQuery = "SELECT (COUNT(?value) AS ?c) WHERE {\n" +
            "  wd:"+ app.classValue +" wdt:P1963 ?value;\n" +
            "}\n" +
            "LIMIT 20";
        const filterUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(filterQuery);
        axios.get(filterUrl)
            .then(response => this.filtersCount = response.data['results']['bindings'][0].c.value)
            .catch(error => {
                this.items.push({ value: "Error" })
            })
        
        var filterString="";
        for (let i = 0; i < app.appliedFilters.length; i++) {
            filterString += "wdt:" + app.appliedFilters[i].filterValue + " wd:" + app.appliedFilters[i].value +";\n";
        }

        var countQuery = "SELECT (COUNT(?value) AS ?c) WHERE {\n" +
            "  ?value wdt:P31 wd:"+app.classValue+";\n" +
            filterString+
            "}";
        const countUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(countQuery);
        axios.get(countUrl)
            .then(response => this.itemsCount = response.data['results']['bindings'][0].c.value)
            .catch(error => {
                this.items.push({ value: "Error" })
            })

        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  ?value wdt:P31 wd:"+app.classValue+";\n" +
                filterString +
            "         rdfs:label ?valueLabel;\n" +
            "  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}\n" +
            "LIMIT 20";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({value:"Empty",valueLabel:"No data"})))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
        }
})

filtersview = Vue.component('filters-view', {
    props: ['classLabel','appliedFilters','totalValues'],
    data() {
        return { filters: [] }
    },
    template: `
    <div>
        <a @click="changePage('view-all-items')">back</a>
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
            <p v-else-if="filters[0].value=='Empty'">No data</p>
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
        changePage(page) {
            this.$emit('change-page', page)
        },
        showFilter(filter){
            this.$emit('update-filter', filter)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  wd:"+app.classValue+" wdt:P1963 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
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

filtervalues = Vue.component('filter-values',{
    props: ['classLabel', 'currentFilter', 'appliedFilters','totalValues'],
    data() {
        return { items: [] }
    },
    template:`
    <div>
        <a @click="changePage('filters-view')">back</a>
        <div class="header">
            <p><b>Class</b>: {{ classLabel }} </p>
            <p><b>Current Filters</b>:</p>
            <p v-if="!appliedFilters.length">No filters</p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</li>
            </ul>
        </div>
        <div class="content">
            <img v-if="!items.length" src='loading.gif'>
                <p v-else-if="items[0].value=='Empty'">No data</p>
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
        applyFilter(filter){
            this.$emit('apply-filter', filter)
        }
    },
    mounted() {
        var filterString = "";
        for (let i = 0; i < app.appliedFilters.length; i++) {
            filterString += "wdt:" + app.appliedFilters[i].filterValue + " wd:" + app.appliedFilters[i].value + ";\n";
        }
        var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:P31 wd:"+app.classValue+";\n" +
                filterString+
            "     wdt:"+app.currentFilter.value+" ?value.\n" +
            "  ?value rdfs:label ?valueLabel\n" +
            "  FILTER(LANG(?valueLabel) = 'en').\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel\n" +
            "ORDER BY DESC(?count)";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty"})))
            .catch(error => {
                this.items.push({ value: "Error"})
            })
    }
})

subclass = Vue.component('subclass-view',{
    props: ['classLabel', 'appliedFilters'],
    data() {
        return { items: [] }
    },
    template:`
    <div>
        <a @click="changePage('view-all-items')">back</a>
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
            <p v-else-if="items[0].value=='Empty'">No data</p>
            <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a>
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
        updateClass(item){
             this.$emit('update-class', item)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  ?value wdt:P279 wd:"+app.classValue+";\n" +
            "         rdfs:label ?valueLabel;\n" +
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

superclass = Vue.component('superclass-view', {
    props: ['classLabel', 'appliedFilters'],
    data() {
        return { items: [] }
    },
    template: `
    <div>
        <a @click="changePage('view-all-items')">back</a>
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
            <p v-else-if="items[0].value=='Empty'">No data</p>
            <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a @click="updateClass(item)">{{item.valueLabel.value}}</a>
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
            this.$emit('update-class', item)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  wd:"+app.classValue+" wdt:P279 ?value.\n" +
            "  ?value rdfs:label ?valueLabel.\n" +
            "  \n" +
            "  FILTER((LANG(?valueLabel)) = \"en\")\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
    }
})

var app = new Vue({
    el: '#app',
    components:{
        classfilter, viewallitems, filtersview, filtervalues
    },
    data: {
        classValue: 'Q5398426',
        classLabel:'TV Series',
        page: 'class-filter',
        currentFilter:'',
        appliedFilters:[],
        componentKey:0,
        totalValues:''
    },
    methods: {
        updatePage: function (page, total) {
            this.page = page
            this.totalValues = total
        },
        updateClassValue: function (classValue, classLabel) {
            this.classValue = classValue;
            this.classLabel = classLabel 
            this.currentFilter='';
            this.appliedFilters=[];
            this.componentKey=0;
        },
        updateFilter: function (filter) {
            this.currentFilter = { value: filter.value.value.split('/').slice(-1)[0], valueLabel: filter.valueLabel.value}
            this.page = 'filter-values'
        },
        applyFilter: function(filter){
            this.appliedFilters.push({
                filterValue:this.currentFilter.value,
                filterValueLabel: this.currentFilter.valueLabel,
                value: filter.value.value.split('/').slice(-1)[0],
                valueLabel: filter.valueLabel.value
            });
            this.page='view-all-items'
        },
        forceRerender() {
            this.componentKey += 1;
        },
        removeFilter: function(value){
            index = this.appliedFilters.findIndex(filter => filter.value==value);
            this.appliedFilters.splice(index,1)
            this.forceRerender()
        },
        updateClass: function(item){
            this.classValue = item.value.value.split('/').slice(-1)[0]
            this.classLabel = item.valueLabel.value
            this.appliedFilters=[]
            this.page = "class-filter"
        }
    }
})
