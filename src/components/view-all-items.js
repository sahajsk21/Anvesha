viewallitems = Vue.component('view-all-items', {
    props: ['websiteText', 'classValue', 'classLabel', 'totalValues', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            filtersCount: -1,
            filters: [],
            items:[],
            itemsCount: '',
            currentPage: 1,
            query: ""
        }
    },
    template: `
    <div v-if="websiteText!=''">
        <header-view
            :class-label="classLabel"
            :applied-filters="appliedFilters"
            :applied-ranges="appliedRanges"
            :applied-quantities="appliedQuantities"
            @remove-filter="removeFilter"
            @remove-range="removeRange"
            @remove-quantity="removeQuantity"
        >
        </header-view>
        <div class="content" id="viewallitems">
            <div v-if="filtersCount==-1"></div>
            <p v-else-if="filtersCount==0">{{ websiteText.filtersCount }}</p>
            <div v-else-if="filtersCount<40" class="filter-box">
                <img src="images/filter-icon.svg" height="14px" />
                <span v-for="filter in filters">
                    <a 
                        :href="pathForFilter(filter)" 
                        onclick="return false;" 
                        @click.exact="showFilter(filter)" 
                        @click.ctrl="window.open(pathForFilter(filter),'_blank')">
                        {{filter.valueLabel.value}}
                    </a>
                    <b v-if="filters[filtersCount-1].valueLabel.value != filter.valueLabel.value">&middot; </b>
                </span>
            </div>
            <div v-else>
                <a class="classOptions" @click="changePage('filters')">{{ websiteText.addFilter }}</a>
            </div>
            <div v-if="totalValues>0" v-html="displayPluralCount(totalValues)"></div>
            <div v-if="totalValues>resultsPerPage" style="text-align: center">
                <a v-if="currentPage>1" @click="displayData('back')">&lt;</a>
                <input 
                    v-model.lazy="currentPage" 
                    @keyup.enter="displayData"
                    type="text" 
                    style="margin-bottom: 15px;width: 48px;text-align: center"> 
                {{totalValues<1000000?" / " + Math.ceil(totalValues/resultsPerPage):''}}
                <a v-if="currentPage<totalValues/resultsPerPage" @click="displayData('next')">&gt;</a>
            </div>
            <div v-if="websiteText!=''">
                <img v-if="!items.length" src='images/loading.gif'>
                <p v-else-if="items[0].value=='Empty'">{{ websiteText.noItems }}</p>
                <p v-else-if="items[0].value=='Error'">{{ websiteText.displayItemsError }}</p>
                <div v-else>
                        <ul>
                            <li v-for="item in items">
                                <a :href="linkToWikidata(item.value.value)">{{item.valueLabel.value}}</a>
                            </li>
                        </ul>
                </div>
            </div>
            <div v-if="totalValues>resultsPerPage" style="text-align: center">
                <a v-if="currentPage>1" @click="displayData('back')">&lt;</a>
                <input 
                    v-model.lazy="currentPage" 
                    @keyup.enter="displayData"
                    type="text" 
                    style="margin-bottom: 15px;width: 48px;text-align: center"> 
                {{totalValues<1000000?" / " + Math.ceil(totalValues/resultsPerPage):''}}
                <a v-if="currentPage<totalValues/resultsPerPage" @click="displayData('next')">&gt;</a>
            </div>
            <div><a :href="query">{{ websiteText.viewQuery }}</a></div>
        </div>
    </div>`,
    methods: {
        displayData(action = ''){
            this.items = []
            if (action == 'back') {
                if (this.currentPage > 1) {
                    this.currentPage--;
                }
            }
            else if (action == 'next') {
                if (this.currentPage < this.totalValues / resultsPerPage) {
                    this.currentPage++;
                }
            }
            var filterString = "";
            var noValueString = "";
            for (let i = 0; i < this.appliedFilters.length; i++) {
                if (this.appliedFilters[i].parentFilterValue) {
                    filterString += "{#filter " + i + "\n?value wdt:" + this.appliedFilters[i].parentFilterValue + " ?temp.\n" +
                        "?temp wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
                }
                else if (this.appliedFilters[i].value == "novalue") {
                    noValueString += "{#filter " + i + "\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedFilters[i].filterValue + " ?no. }).\n}"
                }
                else {
                    filterString += "{#filter " + i + "\n?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
                }
            }
            var filterRanges = "", maxString = "", constraintString = "";

            for (let i = 0; i < this.appliedRanges.length; i++) {
                if (this.appliedRanges[i].valueLL == "novalue") {
                    noValueString += "{#date range " + i + "\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedRanges[i].filterValue + " ?no. }).\n}"
                }
                else if(this.appliedRanges[i].parentFilterValue){
                    timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL)
                    filterRanges += "{#date range " + i + "\n?value wdt:" + this.appliedRanges[i].parentFilterValue +" ?temp.\n"+
                        "?temp (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                        "?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                        "?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                        "FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
                    constraintString += "FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?tim" + i + " && ?tim" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n";
                    maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";

                }
                else {
                    timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL)
                    filterRanges += "{#date range " + i + "\n?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                        "?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                        "?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                        "FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
                    constraintString += "FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?tim" + i + " && ?tim" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n";
                    maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";
                }
            }
            var filterQuantities = "";
            for (let i = 0; i < this.appliedQuantities.length; i++) {
                if (this.appliedQuantities[i].parentFilterValue) {
                    if (this.appliedQuantities[i].valueLL == "novalue") {
                        noValueString += "{#quantity range " + i + "\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                    }
                    else if (this.appliedQuantities[i].unit == "") {
                        filterQuantities += "{#quantity range " + i + "\n?value wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp.\n" +
                            "?temp (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                            "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n}";
                        constraintString += "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?qua" + i + " && ?qua" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n";
                        maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
                    }
                    else {
                        filterQuantities += "{#quantity range " + i + "\n?value wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp.\n" +
                            "?temp (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                            "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n}";
                        constraintString += "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?qua" + i + " && ?qua" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n";
                        maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
                    }
                }
                else {
                    if (this.appliedQuantities[i].valueLL == "novalue") {
                        noValueString += "{#quantity range " + i + "\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                    }
                    else if (this.appliedQuantities[i].unit == "") {
                        filterQuantities += "{#quantity range " + i + "\n?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                            "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n}";
                        constraintString += "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?qua" + i + " && ?qua" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n";
                        maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
                    }
                    else {
                        filterQuantities += "{#quantity range " + i + "\n?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                            "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n}";
                        constraintString += "FILTER(" + this.appliedQuantities[i].valueUL + ">=?qua" + i + " && ?qua" + i + ">=" + this.appliedQuantities[i].valueLL + ")\n";
                        maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
                    }
                }
            }
            sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
                "  {\n" +
                "    SELECT ?value  " + maxString + " WHERE {\n" +
                "      ?value wdt:" + instanceOf + " wd:" + this.classValue + ".  \n" +
                filterString +
                filterRanges +
                filterQuantities +
                noValueString +
                "  } \n" +
                (maxString == "" ? "" : "GROUP BY ?value \n") +
                (constraintString == "" ? "LIMIT " + resultsPerPage + " OFFSET " + ((this.currentPage - 1) * resultsPerPage) : "") +
                "  }\n" +
                constraintString +
                "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
                "}\n" +
                (this.totalValues > resultsPerPage ? "" : "ORDER BY ?valueLabel\n") +
                (constraintString != "" ? "LIMIT " + resultsPerPage + " OFFSET " + ((this.currentPage - 1) * resultsPerPage) : "");
            this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
            fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
            axios.get(fullUrl)
                .then(response => response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty" }))
                .catch(error => {
                    this.items.push({ value: "Error" })
                })
        },
        pathForFilter(filter) {
            return window.location.href + '&cf=' + filter.value.value.split('/').slice(-1)[0];
        },
        displayPluralCount(totalValues) {
            matches = this.websiteText.itemCount.match('{{PLURAL:\\$1\\|(.*)}}')
            str = matches[1].split('|')[(totalValues > 1 ? 1 : 0)]
            str = str.replace("$1", "<b>" + (totalValues < 1000000 ? numberWithCommas(totalValues) : '1 million +') + "</b>")
            return this.websiteText.itemCount.replace(/{{PLURAL:\$1\|(.*)}}/g, str)
        },
        changePage(page) {
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
        linkToWikidata(item) {
            return "https://www.wikidata.org/wiki/" + item.split('/').slice(-1)[0] + "?uselang=" + (urlParams.get('lang') ? urlParams.get('lang') : (defaultLanguages[0] ? defaultLanguages[0] : 'en'))
        }
    },
    mounted() {
        // Check available filters
        sparqlQuery = "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:" + this.classValue + " wdt:" + propertiesForThisType + " ?value.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (?property in (wikibase:Time, wikibase:Quantity, wikibase:WikibaseItem))  \n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "}\n" +
            "ORDER BY ?valueLabel";
        var fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'] ? (this.filtersCount = response.data['results']['bindings'].length, this.filters = [...response.data['results']['bindings']]) : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
        this.displayData();
    }
})
