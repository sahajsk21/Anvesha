subclass = Vue.component('subclass-view', {
    props: ['websiteText', 'classValue', 'classLabel', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return { items: [], displayCount: 0 }
    },
    template: `
    <div v-if="websiteText!=''">
        <div class="header">
            <p class="heading">
                {{ classLabel }} 
                <a 
                    title="superclass" 
                    :href="pathForView('superclass')" 
                    onclick="return false;" 
                    class="classOptions" 
                    @click.exact="changePage('superclass')" 
                    @click.ctrl="window.open(pathForView('superclass'))">
                    &uarr;
                </a>
            </p>
            <ul>
                <li v-for="filter in appliedFilters"><b>{{filter.filterValueLabel}}</b>: 
                    <span v-if="filter.value == 'novalue'" :style="{ fontStyle: 'italic' }">{{ filter.valueLabel }}</span>
                    <span v-else>{{ filter.valueLabel }}</span>
                </li>
                <li v-for="range in appliedRanges"><b>{{range.filterValueLabel}}</b>: 
                    <span v-if="range.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">{{ range.valueLabel }}</span>
                    <span v-else>{{ range.valueLabel }}</span>
                </li>
                <li v-for="quantity in appliedQuantities"><b>{{quantity.filterValueLabel}}</b>: 
                    <span v-if="quantity.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">{{ quantity.valueLabel }}</span>
                    <span v-else>{{ quantity.valueLabel }}</span>
                </li>
            </ul>
        </div>
        <p><i>{{ websiteText.changeClassNote }}</i></p>
        <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
        <p><b>{{ websiteText.specificClass }}</b><p>
        <div class="content">
            <img v-if="!items.length" src='images/loading.gif'>
            <p v-else-if="items[0].value=='Empty'">{{ websiteText.noItems }}</p>
            <div v-else>
                <ul>
                    <li v-for="item in items">
                        <a 
                            :href="pathFor(item)" 
                            onclick="return false;" 
                            @click.exact="updateClass(item)" 
                            @click.ctrl="window.open(pathFor(item), '_blank')">
                            {{item.valueLabel.value}}
                        </a>
                        <span class="result-count" v-if="displayCount==0">
                            {{ websiteText.results.split('|')[(item.count.value>1?0:1)].replace('$1',item.count.value) }}
                        </span>
                    </li>
                </ul>
            </div>
        </div>  
    </div>
    `,
    methods: {
        pathFor(item) {
            var newURL = window.location.pathname + '?';
            var curLang = urlParams.get('lang');
            if (curLang != null) {
                newURL += 'lang=' + curLang + '&';
            }
            return newURL + 'c=' + item.value.value.split('/').slice(-1)[0];
        },
        pathForView(view) {
            return window.location.href + '&view=' + view;
        },
        changePage(page) {
            this.$emit('change-page', page)
        },
        updateClass(item) {
            this.$emit('update-class', item.value.value.split('/').slice(-1)[0], item.valueLabel.value)
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel ?count WHERE{\n" +
            "{\n" +
            "  SELECT ?value (COUNT(?value) AS ?count) WHERE {\n" +
            "  ?v wdt:" + instanceOf + " ?value.\n" +
            "  ?value wdt:P279 wd:" + this.classValue + ".\n" +
            "}\n" +
            "GROUP BY ?value\n" +
            "}\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "  }\n" +
            "ORDER BY DESC(?count)";
        let vm = this
        const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                sparqlQuery = "SELECT DISTINCT ?value ?valueLabel WHERE {\n" +
                    "  SELECT ?value ?valueLabel WHERE {\n" +
                    "    ?v wdt:" + instanceOf + " ?value.\n" +
                    "    ?value wdt:P279 wd:" + vm.classValue + ";\n" +
                    "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }    \n" +
                    "  }\n" +
                    "  LIMIT " + resultsPerPage + "\n" +
                    "}\n" +
                    "ORDER BY ?valueLabel";
                const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                axios.get(fullUrl)
                    .then(response => (response.data['results']['bindings'].length ? (vm.items = [...response.data['results']['bindings']], vm.displayCount = 1) : vm.items.push({ value: "Empty", valueLabel: "No data" })))
                    .catch(error => {
                        vm.itemsType = 'Error'
                    })
            })
    }
})
