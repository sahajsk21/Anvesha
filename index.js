var vm = new Vue({
    el: '#app',
    data: {
        classLabel: 'Q11424',
        filters: [],
        selectedFilters: []
    },
    methods: {
        makeSPARQLQuery: function (endpointUrl, sparqlQuery, doneCallback) {
            return $.ajax({
                url: endpointUrl,
                headers: { Accept: 'application/sparql-results+json' },
                data: { query: sparqlQuery },
                datatype: "application/json",
                beforeSend: function () {
                    $("#loader").show();
                },
                complete: function (data) {
                    $("#loader").hide();
                }
            }).then(doneCallback);
        },
        viewItems: function () {
            var filterString="";
            for (let i = 0; i < this.selectedFilters.length; i++) {
                filterString += "wdt:" + this.selectedFilters[i].title + " wd:" + this.selectedFilters[i].value +".\n";
            }
            var endpointUrl = 'https://query.wikidata.org/sparql',
                sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
                    "            ?value wdt:P31 wd:"+ this.classLabel +";\n" + filterString +
                    "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                    "            }\n" +
                    "            LIMIT 20";

            this.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
                var ul = $('<ul/>').attr('id', 'itemsList');
                for (let i = 0; i < data['results']['bindings'].length; i++) {
                    ul.append("<li><a>" + data['results']['bindings'][i]['valueLabel'].value + "</a></li>");
                }
                $('#displaySection').append(ul);
            }

            );
        },
        addFilters: function(){
            $('#itemsList').remove();
            var endpointUrl = 'https://query.wikidata.org/sparql',
            sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
            "            wd:" + this.classLabel + " wdt:P1963 ?value;\n" +
            "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
            "            }";
            this.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
                for (let i = 0; i < data['results']['bindings'].length; i++) {
                    filter = {code: data['results']['bindings'][i]['value'].value.split('/').slice(-1)[0], value: data['results']['bindings'][i]['valueLabel'].value}
                    vm.filters.push(filter);
                }
            });
            
        },
    }
})

Vue.component('display-item', {
    props: ['code','value'],
    template: '<li><a v-on:click="filterValues"> {{ value }} </a></li>',
    methods:{
        filterValues: function(){
            $('#filtersList').hide();
            var endpointUrl = 'https://query.wikidata.org/sparql',
                sparqlQuery = " SELECT ?value ?valueLabel WHERE {\n" +
                    "             ?v wdt:P31 wd:Q11424;\n" +
                    "                    wdt:"+ this.code +" ?value\n" +
                    "            SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                    "            }\n" +
                    "LIMIT 20";

            vm.makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
                for (let i = 0; i < data['results']['bindings'].length; i++) {
                    filter = { code: data['results']['bindings'][i]['value'].value.split('/').slice(-1)[0], value: data['results']['bindings'][i]['valueLabel'].value }
                    vm.selectedFilters.push(filter);
                }
            }
            );
        }
    }
})
// Vue.component('filter-chip', {
//     props: ['title', 'value', 'pkey'],
//     template: '<div class="chip"><b>{{ title }}</b> : {{ value }}<span class= "closebtn" v-on:click="removeFilter">&times;</span></div>',
//     methods: {
//         removeFilter: function () {
//             for (let i = 0; i < vm.filters.length; i++) {
//                 if (vm.filters[i].id == this.pkey) {
//                     vm.filters.splice(i, 1);
//                 };

//             }
//         }
//     }
// })