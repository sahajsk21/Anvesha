Vue.config.devtools = true;
classfilter = Vue.component('class-filter', {
    props:['classValue','appliedFilters','classLabel'],
    template: `
    <div>
        <div>
            <div class="classSearchSection">
                <h3>Class: {{classLabel}}</h3>
                <input v-model="localClassValue" @keyup.enter="submit" class="classSearch" type="text" style="margin-bottom: 15px;">
                <button @click="submit" class="classSearchButton" style="margin-bottom: 15px;">Search</button>
            </div>
            <h3 v-if="appliedFilters.length">Filters</h3>
            <p v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}} (<a @click="removeFilter(filter.value)">remove</a>) </p>            
        </div>
        <div id="classOptionsSection">
            <a class="classOptions" @click="changePage('view-all-items')">View items</a>
            <a class="classOptions" @click="changePage('filters-view')">Add a filter</a>
            <a class="classOptions" @click="changePage('superclass-view')">More general class</a>
            <a class="classOptions" @click="changePage('subclass-view')">More specific class</a>
        </div>
    </div>`,
    data(){
        return {
            localClassValue: this.classValue,
            localClassLabel:''
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
        removeFilter(value){
            this.$emit("remove-filter", value);
        }
    }
})

viewallitems = Vue.component('view-all-items', {
    props: ['classLabel', 'appliedFilters'],
    data(){
        return {items:[]}
    },
    template: `
    <div>
    <a @click="changePage('class-filter')">back</a>
        <div class="header">
            <span><b>Class</b>: {{ classLabel }} </span>
            <span v-for="filter in appliedFilters"> | <b>{{filter.filterValueLabel}}</b>: {{filter.valueLabel}}</span>
            <div>
                <a @click="changePage('filters-view')" style="font-size: 0.8em;">Filter Further</a>
            </div>
        </div>
        <div class="content" id="viewallitems">
            <img v-if="!items.length" src='loading.gif'>
            <p v-else-if="items[0].value=='Empty'">No data</p>
            <div v-else>
                <p>There are <b>{{ items.length }}</b> items that match this description.</p>
                    <ul>
                        <li v-for="item in items">
                            <a>{{item.valueLabel.value}}</a>
                        </li>
                    </ul>
            </div>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        }
    },
    mounted(){
        var filterString="";
        for (let i = 0; i < app.appliedFilters.length; i++) {
            filterString += "wdt:" + app.appliedFilters[i].filterValue + " wd:" + app.appliedFilters[i].value +";\n";
        }
        const sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?value wdt:P31 wd:"+app.classValue+";\n" +
                filterString +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel\n" +
            "\nLIMIT 20";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({value:"Empty",valueLabel:"No data"})))
    }
})

filtersview = Vue.component('filters-view', {
    props: ['classLabel','appliedFilters'],
    data() {
        return { filters: [] }
    },
    template: `
    <div>
        <a @click="changePage('class-filter')">back</a>
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
                <p>There are <b>{{ filters.length }}</b> items that match this description.</p>
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
        var sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
            "             wd:" + app.classValue +" wdt:P1963 ?value;\n" +
            "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
            "            }\n";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.filters = [...response.data['results']['bindings']] : this.filters.push({ value: "Empty", valueLabel: "No data" })))
    }
})

filtervalues = Vue.component('filter-values',{
    props: ['classLabel', 'currentFilter', 'appliedFilters'],
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
                <div v-else>
                    <p>There are <b>{{ items.length }}</b> items that match this description.</p>
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
        var sparqlQuery = "SELECT ?value ?valueLabel (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:P31 wd:"+ app.classValue+";\n" +
            "     wdt:"+ app.currentFilter.value +" ?value\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
            "}\n" +
            "GROUP BY ?value ?valueLabel\n" +
            "\n";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
    }
})

subclass = Vue.component('subclass-view',{
    props: ['classLabel', 'appliedFilters'],
    data() {
        return { items: [] }
    },
    template:`
    <div>
        <a @click="changePage('class-filter')">back</a>
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
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
            "}";
        const fullUrl = 'https://query.wikidata.org/sparql' + '?query=' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
    }
})

superclass = Vue.component('superclass-view', {
    props: ['classLabel', 'appliedFilters'],
    data() {
        return { items: [] }
    },
    template: `
    <div>
        <a @click="changePage('class-filter')">back</a>
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
            "  wd:"+app.classValue+" wdt:P279 ?value;\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
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
        classValue: 'Q11424',
        classLabel:'film',
        page: 'class-filter',
        currentFilter:'',
        appliedFilters:[]
    },
    methods: {
        updatePage: function (page) {
            this.page = page
        },
        updateClassValue: function (classValue, classLabel) {
            this.classValue = classValue
            classLabel == '' ? (this.classLabel = classValue): (this.classLabel = classLabel);
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
            this.page='class-filter'
        },
        removeFilter: function(value){
            index = this.appliedFilters.findIndex(filter => filter.value==value);
            this.appliedFilters.splice(index,1)
        },
        updateClass: function(item){
            this.classValue = item.value.value.split('/').slice(-1)[0]
            this.classLabel = item.valueLabel.value
            this.appliedFilters=[]
            this.page = "class-filter"
        }
    }
})
