Vue.config.devtools = true;
Vue.component('class-filter',{
    props:['classLabel', 'filters'],
    template:`
    <div>
        <div>
            <div class="classSearchSection">
                <h3>Class</h3>
                <input v-model="classLabel" class="classSearch" type="text" style="margin-bottom: 15px;">
                <button class="classSearchButton" style="margin-bottom: 15px;">Search</button>
            </div>
            <h3>Filters</h3>            
            <p v-for="filter in filters"><b>{{filter.name}}:</b> {{filter.value}} (<a>remove</a>)</p>
        </div>
        <div id="classOptionsSection">
            <a class="classOptions" @click="changePage('view-all-items')">View All Items</a>
            <a class="classOptions" @click="changePage('filters-view')">Add Filters</a>
            <a class="classOptions">More general class</a>
            <a class="classOptions">More specific class</a>
        </div>
    </div>`,
    methods:{
        changePage(page){
            this.$emit('change-page', page)
        }
    }
})

Vue.component('view-all-items', {
    props: ['classLabel', 'filters'],
    template: `
    <div>
    <a @click="changePage('class-filter')">back</a>
        <div class="header">
            <span><b>Class</b>: {{ classLabel }} </span> |
            <span v-for="filter in filters"><b>{{ filter.name }}</b>:{{ filter.value }} | </span>
            <div>
                <a @click="changePage('filters-view')" style="font-size: 0.8em;">Filter Further</a>
            </div>
        </div>
        <div class="content" id="viewallitems">
            <p>There are <b>7,391</b> items that match this description.</p>
            <ul>
                <li>
                    <a href="">7 Minutes</a>
                </li>
                <li>
                    <a href="">18 Presents</a>
                </li>
                <li>
                    <a href="">20 Cigarettes</a>
                </li>
                <li>
                    <a href="">A Ciambra</a>
                </li>
                <li>
                    <a href="">Abraham</a>
                </li>
                <li>
                    <a href="">Accattone</a>
                </li>
                <li>
                    <a href="">The Accusation</a>
                </li>
                <li>
                    <a href="">Acla's Descent into Floristella</a>
                </li>
                <li>
                    <a href="">Le acrobate</a>
                </li>
            </ul>
            <a href="">View More</a>
        </div>
    </div>`,
    methods:{
        changePage(page) {
            this.$emit('change-page', page)
        }
    }
})

Vue.component('filters-view',{
    props: ['classLabel', 'filters'],
    template:`
    <div>
    <a @click="changePage('class-filter')">back</a>
    <div class="header" style="font-size: 1em;">
            <h3>Class: {{ classLabel }}</h3>
            <h3>Current Filters</h3>
            <p v-for="filter in filters"><b>{{ filter.name }}:</b> {{ filter.value }}</p>
        </div>
        <div class="content">
            <p>There are <b>7,391</b> items that match this description.</p>
            <p><b>Add a filter: </b></p>
            <ul>
                <li><a href="filterValues.html">director</a></li>
                <li><a href="filterValues.html">cast member</a></li>
                <li><a href="filterValues.html">publication date</a></li>
                <li><a href="filterValues.html">producer</a></li>
                <li><a href="filterValues.html">executive producer</a></li>
                <li><a href="filterValues.html">screenwriter</a></li>
                <li><a href="filterValues.html">based on</a></li>
                <li><a href="filterValues.html">filming location</a></li>
                <li><a href="filterValues.html">narrative location</a></li>
            </ul>
            <a href="">View More</a>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        }
    }
})
var app = new Vue({
    el:'#app',
    data: {
        classLabel: 'Q11424',
        filters: [
            {
                name:"Genre",
                filtercode:"P136",
                value:"drama",
                valueCode:"Q25372"
            },
            {
                name: "director",
                filtercode: "P57",
                value: "James Cameron",
                valueCode: "Q42574"
            }
        ],
        page:'class-filter'
    },
    methods:{
        updatePage: function(page){
            this.page = page
        }
    }
})
// var vm = new Vue({
//     el: '#app',
//     data: {
//         classLabel: 'Q11424',
//         filters: [],
//         selectedFilters: []
//     },
//     methods: {
//         makeSPARQLQuery: function (endpointUrl, sparqlQuery, doneCallback) {
//             return $.ajax({
//                 url: endpointUrl,
//                 headers: { Accept: 'application/sparql-results+json' },
//                 data: { query: sparqlQuery },
//                 datatype: "application/json",
//                 beforeSend: function () {
//                     $("#loader").show();
//                 },
//                 complete: function (data) {
//                     $("#loader").hide();
//                 }
//             }).then(doneCallback);
//         },
//         viewItems: function () {
//             var filterString="";
//             for (let i = 0; i < this.selectedFilters.length; i++) {
//                 filterString += "wdt:" + this.selectedFilters[i].title + " wd:" + this.selectedFilters[i].value +".\n";
//             }
//             var endpointUrl = 'https://query.wikidata.org/sparql',
//                 sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
//                     "            ?value wdt:P31 wd:"+ this.classLabel +";\n" + filterString +
//                     "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
//                     "            }\n" +
//                     "            LIMIT 20";

//             this.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
//                 var ul = $('<ul/>').attr('id', 'itemsList');
//                 for (let i = 0; i < data['results']['bindings'].length; i++) {
//                     ul.append("<li><a>" + data['results']['bindings'][i]['valueLabel'].value + "</a></li>");
//                 }
//                 $('#viewallitems').html(ul);
//             }

//             );
//         },
//         addFilters: function(){
//             $('#itemsList').remove();
//             var endpointUrl = 'https://query.wikidata.org/sparql',
//             sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
//             "            wd:" + this.classLabel + " wdt:P1963 ?value;\n" +
//             "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
//             "            }";
//             this.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
//                 for (let i = 0; i < data['results']['bindings'].length; i++) {
//                     filter = {code: data['results']['bindings'][i]['value'].value.split('/').slice(-1)[0], value: data['results']['bindings'][i]['valueLabel'].value}
//                     vm.filters.push(filter);
//                 }
//             });
            
//         },
//     }
// })

// Vue.component('display-item', {
//     props: ['code','value'],
//     template: '<li><a v-on:click="filterValues"> {{ value }} </a></li>',
//     methods:{
//         filterValues: function(){
//             $('#filtersList').hide();
//             var endpointUrl = 'https://query.wikidata.org/sparql',
//                 sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
//                     "             ?v wdt:P31 wd:Q11424;\n" +
//                     "                    wdt:"+ this.code +" ?value\n" +
//                     "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
//                     "            }\n" +
//                     "LIMIT 20";

//             vm.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
//                 for (let i = 0; i < data['results']['bindings'].length; i++) {
//                     filter = { code: data['results']['bindings'][i]['value'].value.split('/').slice(-1)[0], value: data['results']['bindings'][i]['valueLabel'].value }
//                     vm.selectedFilters.push(filter);
//                 }
//             }
//             );
//         }
//     }
// })

// // Vue.component('filter-chip', {
// //     props: ['title', 'value', 'pkey'],
// //     template: '<div class="chip"><b>{{ title }}</b> : {{ value }}<span class= "closebtn" v-on:click="removeFilter">&times;</span></div>',
// //     methods: {
// //         removeFilter: function () {
// //             for (let i = 0; i < vm.filters.length; i++) {
// //                 if (vm.filters[i].id == this.pkey) {
// //                     vm.filters.splice(i, 1);
// //                 };

// //             }
// //         }
// //     }
// // })
