filtersview = Vue.component('filters-view', {
    props: ['classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            filters: [],
            query: ""
        }
    },
    template: `
    <div>
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
                <a 
                    title="subclass" 
                    :href="pathForView('subclass')" 
                    onclick="return false;" 
                    class="classOptions" 
                    @click.exact="changePage('subclass')" 
                    @click.ctrl="window.open(pathForView('subclass'))">
                    &darr;
                </a>
            </p>
            <div>
                <p v-for="filter in appliedFilters">
                    <b>{{filter.filterValueLabel}}</b>: 
                    <span v-if="filter.value == 'novalue'" :style="{ fontStyle: 'italic' }">
                        {{ filter.valueLabel }}</span><span v-else>{{ filter.valueLabel }}
                    </span> 
                    ( <a @click="removeFilter(filter)">&#x2715;</a> )
                </p>
                <p v-for="range in appliedRanges">
                    <b>{{range.filterValueLabel}}</b>: 
                    <span v-if="range.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">
                        {{ range.valueLabel }}
                    </span>
                    <span v-else>
                        {{ range.valueLabel }}
                    </span> 
                    ( <a @click="removeRange(range)">&#x2715;</a> )
                </p>
                <p v-for="quantity in appliedQuantities">
                    <b>{{quantity.filterValueLabel}}</b>: 
                    <span v-if="quantity.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">
                        {{ quantity.valueLabel }}</span><span v-else>{{ quantity.valueLabel }}
                    </span> 
                    {{quantity.unit}}( <a @click="removeQuantity(quantity)">&#x2715;</a> )
                </p>
            </div>
        </div>
        <div class="content">
            <img v-if="!filters.length" src='images/loading.gif'>
            <p v-else-if="filters[0].value=='Empty'">No filters available</p>
            <div v-else>
                <p v-if="totalValues>0">{{ $t("message.itemCount",{count:totalValues<1000000?numberWithCommas(totalValues):"1 million +" }) }}</p>
                <p><b>Add a filter:</b></p> 
                <ul>
                    <li v-for="filter in filters">
                        <a @click="showFilter(filter)">{{filter.valueLabel.value}}</a>
                    </li>
                </ul>
            </div>
            <div><a :href="query">{{ $t('message.viewQuery') }}</a></div>
        </div>
    </div>`,
    methods: {
        changePage(page,) {
            this.$emit('change-page', page)
        },
        showFilter(filter) {
            this.$emit('update-filter', filter)
        },
        pathForView(view) {
            return window.location.href + '&view=' + view;
        },
        pathForFilter(filter) {
            return window.location.href + '&cf=' + filter.value.value.split('/').slice(-1)[0];
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'filters');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'filters');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'filters');
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:" + this.classValue + " wdt:" + propertiesForThisType + " ?value.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (?property in (wikibase:Time, wikibase:Quantity, wikibase:WikibaseItem))  \n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "}\n" +
            "ORDER BY ?valueLabel";
        const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.filters = [...response.data['results']['bindings']] : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})
