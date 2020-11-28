
results = Vue.component('items-results', {
    props: ['websiteText','classValue', 'classLabel', 'totalValues', 'currentPage', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            items: [],
        }
    },
    template: `
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
    `,
    methods: {
        getDateObject(date) {
            s = date.split("-")
            if (s.length == 3) {
                return { year: s[0], month: s[1], day: s[2] }
            }
            else {
                return { year: "-" + "0".repeat(6 - s[1].length) + s[1], month: s[2], day: s[3] }
            }
        },
        getTimePrecision(ear, lat) {
            earliestDate = this.getDateObject(ear)
            latestDate = this.getDateObject(lat)
            var earliestYear = earliestDate.year;
            var earliestMonth = earliestDate.month;
            var earliestDay = earliestDate.day;
            var latestYear = latestDate.year;
            var latestMonth = latestDate.month;
            var latestDay = latestDate.day;
            var yearDifference = latestYear - earliestYear;
            var monthDifference = (12 * yearDifference) + (latestMonth - earliestMonth);
            var dayDifference = (30 * monthDifference) + (latestDay - earliestDay);
            if (dayDifference <= 1) return 11
            else if (monthDifference <= 1) return 10
            else if (yearDifference <= 1) return 9
            else if (yearDifference <= 10) return 8
            else if (yearDifference <= 100) return 7
            else if (yearDifference <= 1000) return 6
            else if (yearDifference <= 1e4) return 5
            else if (yearDifference <= 1e5) return 4
            else if (yearDifference <= 1e6) return 3
            else if (yearDifference <= 1e8) return 1
            return 0
        },
        linkToWikidata(item){
            return "https://www.wikidata.org/wiki/" + item.split('/').slice(-1)[0] + "?uselang=" +  (urlParams.get('lang') ? urlParams.get('lang') : (defaultLanguages[0] ? defaultLanguages[0] : 'en'))
        }
    },
    mounted() {
        var filterString = "";
        var noValueString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            if (this.appliedFilters[i].value == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedFilters[i].filterValue + " ?no. }).\n"
            }
            else {
                filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
            }
        }
        var filterRanges = "", maxString = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            if (this.appliedRanges[i].valueLL == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedRanges[i].filterValue + " ?no. }).\n"
            }
            else {
                timePrecision = this.getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL)
                filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n";
                maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";
            }
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].valueLL == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n"
            }
            else if (this.appliedQuantities[i].unit == "") {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
                maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
            }
            else {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
                maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
            }
        }
        // Fetch results
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
            "LIMIT " + resultsPerPage + " OFFSET " + ((this.currentPage - 1) * resultsPerPage) +
            "  }\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "}\n" +
            (this.totalValues > resultsPerPage ? "" : "ORDER BY ?valueLabel\n");
        fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => response.data['results']['bindings'].length ? this.items = [...response.data['results']['bindings']] : this.items.push({ value: "Empty" }))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})

viewallitems = Vue.component('view-all-items', {
    props: ['websiteText', 'classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            filtersCount: -1,
            filters: [],
            itemsCount: '',
            currentPage: 1,
            query: ""
        }
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
            <div><img v-if="totalValues==''" src='images/loading.gif'></div>
            <div v-if="totalValues>0" v-html="displayPluralCount(totalValues)"></div>
            <div v-if="totalValues>resultsPerPage" style="text-align: center">
                <a v-if="currentPage>1" @click="currentPage>1?currentPage--:''">&lt;</a>
                <input 
                    v-model.lazy="currentPage" 
                    type="text" 
                    style="margin-bottom: 15px;width: 48px;text-align: center"> 
                {{totalValues<1000000?" / " + Math.ceil(totalValues/resultsPerPage):''}}
                <a v-if="currentPage<totalValues/resultsPerPage" @click="currentPage<totalValues/resultsPerPage?currentPage++:''">&gt;</a>
            </div>
            <items-results 
                v-if="totalValues!=''"
                :total-values="totalValues"
                :website-text="websiteText"
                :class-label="classLabel"
                :class-value="classValue"
                :applied-filters="appliedFilters"
                :applied-ranges="appliedRanges"
                :applied-quantities="appliedQuantities"
                :current-page="currentPage"
                :key="currentPage">
            </items-results>
            <div v-if="totalValues>resultsPerPage" style="text-align: center">
                <a v-if="currentPage>1" @click="currentPage>1?currentPage--:''">&lt;</a>
                <input 
                    v-model.lazy="currentPage" 
                    type="text" 
                    style="margin-bottom: 15px;width: 48px;text-align: center"> 
                    {{totalValues<1000000?" / " + Math.ceil(totalValues/resultsPerPage):''}}
                <a v-if="currentPage<totalValues/resultsPerPage" @click="currentPage<totalValues/resultsPerPage?currentPage++:''">&gt;</a>
            </div>
            <div><a :href="query">{{ websiteText.viewQuery }}</a></div>
        </div>
    </div>`,
    methods: {
        pathForView(view) {
            return window.location.href + '&view=' + view;
        },
        pathForFilter(filter) {
            return window.location.href + '&cf=' + filter.value.value.split('/').slice(-1)[0];
        },
        displayMessage(message, value) {
            return message.replace("$1", "<b>" + value + "</b>")
        },
        displayPluralCount(totalValues) {
            matches = this.websiteText.itemCount.match('{{PLURAL:\\$1\\|(.*)}}')
            str = matches[1].split('|')[(totalValues > 1 ? 1 : 0)]
            str = str.replace("$1", (totalValues < 1000000 ? numberWithCommas(totalValues) : '1 million +'))
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
        getDateObject(date) {
            s = date.split("-")
            if (s.length == 3) {
                return { year: s[0], month: s[1], day: s[2] }
            }
            else {
                return { year: "-" + "0".repeat(6 - s[1].length) + s[1], month: s[2], day: s[3] }
            }
        },
        getTimePrecision(ear, lat) {
            earliestDate = this.getDateObject(ear)
            latestDate = this.getDateObject(lat)
            var earliestYear = earliestDate.year;
            var earliestMonth = earliestDate.month;
            var earliestDay = earliestDate.day;
            var latestYear = latestDate.year;
            var latestMonth = latestDate.month;
            var latestDay = latestDate.day;
            var yearDifference = latestYear - earliestYear;
            var monthDifference = (12 * yearDifference) + (latestMonth - earliestMonth);
            var dayDifference = (30 * monthDifference) + (latestDay - earliestDay);
            if (dayDifference <= 1) return 11
            else if (monthDifference <= 1) return 10
            else if (yearDifference <= 1) return 9
            else if (yearDifference <= 10) return 8
            else if (yearDifference <= 100) return 7
            else if (yearDifference <= 1000) return 6
            else if (yearDifference <= 1e4) return 5
            else if (yearDifference <= 1e5) return 4
            else if (yearDifference <= 1e6) return 3
            else if (yearDifference <= 1e8) return 1
            return 0
        },
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

        var filterString = "";
        var noValueString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            if (this.appliedFilters[i].value == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedFilters[i].filterValue + " ?no. }).\n"
            }
            else {
                filterString += "?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
            }
        }
        var filterRanges = "", maxString = "";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            if (this.appliedRanges[i].valueLL == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedRanges[i].filterValue + " ?no. }).\n"
            }
            else {
                timePrecision = this.getTimePrecision(this.appliedRanges[i].valueLL,this.appliedRanges[i].valueUL)
                filterRanges += "?value (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " < '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n";
                maxString += "(MAX(?time" + i + ") AS ?tim" + i + ") ";
            }
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].valueLL == "novalue") {
                noValueString += " FILTER(NOT EXISTS { ?value wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n"
            }
            else if (this.appliedQuantities[i].unit == "") {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
                maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
            }
            else {
                filterQuantities += "?value (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                    "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                    "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >=" + this.appliedQuantities[i].valueLL + ")\n"
                maxString += "(MAX(?amountValue" + i + ") AS ?qua" + i + ") ";
            }
        }
        sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
            "  {\n" +
            "    SELECT ?value ?valueLabel " + maxString + " WHERE {\n" +
            "      ?value wdt:" + instanceOf + " wd:" + this.classValue + ".  \n" +
            filterString +
            filterRanges +
            filterQuantities +
            noValueString +
            "  } \n" +
            (maxString == "" ? "" : "GROUP BY ?value ?valueLabel\n") +
            "LIMIT " + resultsPerPage + " OFFSET " + ((this.currentPage - 1) * resultsPerPage) +
            "  }\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "}\n" +
            (this.totalValues > resultsPerPage ? "" : "ORDER BY ?valueLabel\n");
        this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
    }
})
