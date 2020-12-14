secondayFilterValues = Vue.component('secondary-filters', {
    props: ['websiteText', 'classValue', 'classLabel', 'secondaryFilter', 'currentFilter', 'totalValues', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            items: [],
            itemsType: '',
            fullPropertyValues: [],
            displayCount: 1,
            currentPage: 1,
            filterProperty: "",
            query: "",
            noValueURL: "",
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
            @change-page="changePage"
        >
        </header-view>
        <div class="content">
            <div v-if="itemsType==''">
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.gettingValues, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <img src='images/loading.gif'>
            </div>
            <div v-else-if="itemsType=='Additionalempty'">
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.noAdditionalValues, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
            </div>
            <div v-else-if="itemsType=='Error'">
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.filterError, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
            </div>
            <div v-else-if="itemsType=='Item'">
                <p v-if="totalValues!=''" v-html="displayPluralCount(websiteText.itemCount,totalValues)"></p>
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-if="appliedFilters.findIndex(filter => filter.filterValue == secondaryFilter.value) != -1" v-html="displayMessage(websiteText.selectAdditionalValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <p v-else v-html="displayMessage(websiteText.selectValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <div v-if="items.length>resultsPerPage && itemsType=='Item'" style="text-align: center">
                    <a v-if="currentPage>1" @click="currentPage>1?currentPage--:''">&lt;</a>
                    <input 
                        v-model.lazy="currentPage" 
                        type="text" 
                        style="margin-bottom: 15px;width: 48px;text-align: center"> 
                    {{items.length<1000000?" / " + Math.ceil(items.length/resultsPerPage):''}}
                    <a v-if="currentPage<items.length/resultsPerPage" @click="currentPage<items.length/resultsPerPage?currentPage++:''">&gt;</a>
                </div>
                <ul>
                    <li v-for="(item,index) in items" v-if="index < currentPage*resultsPerPage && index >= (currentPage-1)*resultsPerPage">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyFilter(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.valueLabel.value}}
                        </a> 
                        <span class="result-count">
                            {{ displayPluralCount(websiteText.results,item.count.value) }}
                        <span>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='ItemFail'">
                <p><i v-html="displayMessage(websiteText.filterTimeout, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></i></p>
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.selectValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <ul>
                    <li v-for="item in items">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyFilter(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.valueLabel.value}}
                        </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='Time'">
                <p v-if="totalValues!=''" v-html="displayPluralCount(websiteText.itemCount,totalValues)"></p>
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.selectValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <ul v-if="displayCount == 1">
                    <li v-for="item in items" v-if="item.numValues>0">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyRange(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.bucketName}} 
                        </a> 
                        <span class="result-count">
                            {{ displayPluralCount(websiteText.results,item.numValues) }}
                        <span>
                    </li>
                </ul>
                <ul v-if="displayCount == 0 || displayCount == 2">
                    <li v-for="item in items">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyRange(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.bucketName}} 
                        </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='TimeFail'">
                <p><i v-html="displayMessage(websiteText.filterTimeout, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></i></p>
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.selectValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <ul>
                    <li v-for="item in items">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyRange(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.bucketName}} 
                        </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="itemsType=='Quantity'">
                <p v-if="(displayCount == 1 || displayCount == 0) && totalValues!=''" v-html="displayPluralCount(websiteText.itemCount,totalValues)"></p>
                <p v-if="displayCount == 2"><i v-html="displayMessage(websiteText.filterTimeout, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></i></p>
                <a @click="changePage('view-all-items')">{{ websiteText.viewList }}</a>
                <p v-html="displayMessage(websiteText.selectValue, currentFilter.valueLabel + ' &rarr; ' + secondaryFilter.valueLabel)"></p>
                <ul v-if="displayCount == 1">
                    <li v-for="item in items" v-if="item.numValues>0">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyQuantityRange(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.bucketName}} {{item.unit}} 
                        </a> 
                        <span class="result-count">
                            {{ displayPluralCount(websiteText.results,item.numValues) }}
                        <span>
                    </li>
                </ul>
                <ul v-if="displayCount == 0 || displayCount == 2">
                    <li v-for="item in items">
                        <a 
                            :href="item.href" 
                            onclick="return false;" 
                            @click.exact="applyQuantityRange(item)" 
                            @click.ctrl="window.open(item.href, '_blank')">
                            {{item.bucketName}} 
                        </a>
                    </li>
                </ul>
            </div>
            <div v-if="items.length>resultsPerPage && itemsType=='Item'" style="text-align: center">
                <a v-if="currentPage>1" @click="currentPage>1?currentPage--:''">&lt;</a>
                <input 
                    v-model.lazy="currentPage" 
                    type="text" 
                    style="margin-bottom: 15px;width: 48px;text-align: center"> 
                {{items.length<1000000?" / " + Math.ceil(items.length/resultsPerPage):''}}
                <a v-if="currentPage<items.length/resultsPerPage" @click="currentPage<items.length/resultsPerPage?currentPage++:''">&gt;</a>
            </div>
            <a :href="query">{{ websiteText.viewQuery }}</a>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        displayMessage(message, value) {
            return message.replace("$1", "<b>" + value + "</b>")
        },
        displayPluralCount(message, totalValues) {
            matches = message.match('{{PLURAL:\\$1\\|(.*)}}')
            str = matches[1].split('|')[(totalValues > 1 ? 1 : 0)]
            str = str.replace("$1", (totalValues < 1000000 ? numberWithCommas(totalValues) : '1 million +'))
            return message.replace(/{{PLURAL:\$1\|(.*)}}/g, str)
        },
        applyFilter(filter) {
            this.$emit('apply-secondary-filter', filter)
        },
        applyRange(range) {
            this.$emit('apply-secondary-range', range)
        },
        applyQuantityRange(range) {
            this.$emit('apply-secondary-quantity', range)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'secondary-filter-values');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'filter-values');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'secondary-filter-values');
        }, 
    },
    mounted() {
        var filterString = "";
        var noValueString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            if (this.appliedFilters[i].parentFilterValue) {
                filterString += "{#filter " + i +"\n?item wdt:" + this.appliedFilters[i].parentFilterValue + " ?temp.\n" +
                    "?temp wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
            }
            else if (this.appliedFilters[i].value == "novalue") {
                noValueString += "{#filter " + i +"\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedFilters[i].filterValue + " ?no. }).\n}"
            }
            else {
                filterString += "{#filter " + i +"\n?value wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
            }
        }
        var filterRanges = "";
        timeString = "?item wdt:" + this.secondaryFilter.value + " ?time.\n";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            if (this.appliedRanges[i].valueLL == "novalue") {
                noValueString += "{#date range " + i +"\n FILTER(NOT EXISTS { ?item wdt:" + this.appliedRanges[i].filterValue + " ?no. }).\n}"
            }
            else if (this.appliedRanges[i].parentFilterValue) {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL, 1)
                filterRanges += "{#date range " + i + "\n?item wdt:P166 ?temp.\n" +
                    "?temp (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
            }
            else if (this.appliedRanges[i].filterValue != this.secondaryFilter.value) {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL,1)
                filterRanges += "{#date range " + i +"\n?item (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
            }
            else {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL,1)
                timeString = "{#date range " + i +"\n?item (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode.\n" +
                    "  ?timenode wikibase:timeValue ?time.\n" +
                    "  ?timenode wikibase:timePrecision ?timeprecision.\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time && ?time <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision>=" + timePrecision + ")\n}";
            }
        }
        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].parentFilterValue) {
                if (this.appliedQuantities[i].valueLL == "novalue") {
                    noValueString += "{#quantity range " + i +"\n FILTER(NOT EXISTS { ?temp wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                }
                else if (this.appliedQuantities[i].unit == "") {
                    filterQuantities += "{#quantity range " + i +"\n?item wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp.\n" +
                        "?temp (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
                else {
                    filterQuantities += "{#quantity range " + i +"\n?item wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp.\n" +
                        "?temp (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
            }
            else {
                if (this.appliedQuantities[i].valueLL == "novalue") {
                    noValueString += "{#quantity range " + i +"\n FILTER(NOT EXISTS { ?item wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                }
                else if (this.appliedQuantities[i].unit == "") {
                    filterQuantities += "{#quantity range " + i +"\n?item (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
                else {
                    filterQuantities += "{#quantity range " + i +"\n?item (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
            }
        }
        sparqlQuery = "SELECT ?property WHERE {\n" +
            "  wd:" + this.secondaryFilter.value + " wikibase:propertyType ?property.\n" +
            "}";
        const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        let vm = this;
        axios.get(fullUrl)
            .then((response) => {
                if (response.data['results']['bindings'][0].property.value.split("#")[1] == "Time") {
                    this.displayCount = 0
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.delete("cf")
                    parameters.delete("sf")
                    parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, "novalue")
                    this.noValueURL = window.location.pathname + "?" + parameters
                    var sparqlQuery = "SELECT ?time WHERE {\n" +
                        "?item wdt:" + instanceOf + " wd:" + this.classValue + ".\n" +
                        filterString +
                        filterRanges +
                        timeString +
                        filterQuantities +
                        noValueString +
                        "}\n" +
                        "ORDER by ?time";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                    const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            if (response.data['results']['bindings'].length) {
                                arr = generateDateBuckets(response.data['results']['bindings'])
                                for (var i = 0; i < arr.length; i++) {
                                    var q = window.location.search;
                                    parameters = new URLSearchParams(q)
                                    parameters.delete("cf")
                                    parameters.delete("sf")
                                    if (arr[i].size == 1) parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].bucketLL.year + "~" + arr[i].bucketUL.year)
                                    else if (arr[i].size == 2) parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].bucketLL.year)
                                    else if (arr[i].size == 3) parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month)
                                    else if (arr[i].size == 4) parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                    else if (arr[i].size == 5) parameters.set("r." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                }
                                if (arr.length) {
                                    vm.items = arr;
                                    this.itemsType = 'Time'
                                }
                                else {
                                    this.itemsType = 'Additionalempty'
                                }
                            }
                            else {
                                index = vm.appliedRanges.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                if (index = -1) this.itemsType = "Additionalempty"
                                else this.itemsType = 'Time'
                            }
                        })
                        .catch(error => {
                            var sparqlQuery = "SELECT ?time WHERE{SELECT ?time WHERE {\n" +
                                "  hint:Query hint:optimizer \"None\".\n" +
                                "?item wdt:" + instanceOf + " wd:" + vm.classValue + ".\n" +
                                filterString +
                                "?item wdt:" + vm.secondaryFilter.value + " ?time.\n" +
                                filterRanges +
                                filterQuantities +
                                "}\n" +
                                "LIMIT " + resultsPerPage + "\n" +
                                "}\n" +
                                "ORDER BY ?time";
                            const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then(res => {
                                    if (res.data['results']['bindings'].length) {
                                        arr = generateDateBuckets(res.data['results']['bindings'], vm.secondaryFilter)
                                        for (var i = 0; i < arr.length; i++) {
                                            var q = window.location.search;
                                            parameters = new URLSearchParams(q)
                                            parameters.delete("cf")
                                            parameters.delete("sf")
                                            if (arr[i].size == 1) parameters.set("r." + vm.secondaryFilter.value, arr[i].bucketLL.year + "~" + arr[i].bucketUL.year)
                                            else if (arr[i].size == 2) parameters.set("r." + vm.secondaryFilter.value, arr[i].bucketLL.year)
                                            else if (arr[i].size == 3) parameters.set("r." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month)
                                            else if (arr[i].size == 4) parameters.set("r." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                            else if (arr[i].size == 5) parameters.set("r." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                        }
                                        vm.items = arr
                                        vm.displayCount = 2
                                        vm.itemsType = 'Time'
                                    }
                                    else {
                                        vm.itemsType = 'TimeFail'
                                    }

                                }
                                )
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else if (response.data['results']['bindings'][0].property.value.split("#")[1] == "Quantity") {
                    this.displayCount = 0;
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.delete("cf")
                    parameters.delete("sf")
                    parameters.set("q." + this.currentFilter.value + "." + this.secondaryFilter.value, "novalue")
                    this.noValueURL = window.location.pathname + "?" + parameters
                    var sparqlQuery = "SELECT ?item ?amount WHERE {\n" +
                        "    ?item wdt:" + instanceOf + " wd:" + this.classValue + ".\n" +
                        filterString +
                        "{#Current filter\n?item wdt:"+this.currentFilter.value+" ?temp.\n" +
                        "    ?temp (p:" + this.secondaryFilter.value + "/psn:" + this.secondaryFilter.value + ") ?v.\n" +
                        "    ?v wikibase:quantityAmount ?amount.\n}" +
                        filterRanges +
                        filterQuantities +
                        noValueString +
                        "}\n" +
                        "ORDER BY ?amount";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                    const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => (response.data['results']['bindings'].length ? response : ''))
                        .then(
                            function (response) {
                                if (response == "") {
                                    var sparqlQuery = "SELECT ?amount WHERE {\n" +
                                        "?item wdt:" + instanceOf + " wd:" + vm.classValue + ".\n" +
                                        filterString +
                                        "{#Current filter\n?item wdt:"+vm.currentFilter.value+" ?temp.\n" +
                                        "?temp (p:" + vm.secondaryFilter.value + "/psv:" + vm.secondaryFilter.value + ") ?v.\n" +
                                        "?v wikibase:quantityAmount ?amount.\n}" +
                                        filterRanges +
                                        filterQuantities +
                                        noValueString +
                                        "\n}\n" +
                                        "ORDER BY ?amount";
                                    vm.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                                    const fullUr = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                                    axios.get(fullUr)
                                        .then(res => {
                                            if (res.data['results']['bindings'].length) {
                                                arr = generateFilterValuesFromNumbers(res.data['results']['bindings'])
                                                for (var i = 0; i < arr.length; i++) {
                                                    var q = window.location.search;
                                                    parameters = new URLSearchParams(q)
                                                    parameters.delete("cf")
                                                    parameters.delete("sf")
                                                    parameters.set("q." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                                }
                                                vm.items = arr
                                                vm.itemsType = 'Quantity'
                                            }
                                            else {
                                                index = vm.appliedQuantities.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                                if (index != -1) {
                                                    vm.itemsType = "Additionalempty"
                                                }
                                                else {
                                                    vm.itemsType = 'Quantity'
                                                }
                                            }
                                        })
                                        .catch(error => {
                                            sparqlQuery = "SELECT ?amount WHERE\n" +
                                                "{\n" +
                                                "  SELECT ?amount WHERE {\n" +
                                                "    hint:Query hint:optimizer \"None\".\n" +
                                                "    ?item wdt:" + instanceOf + " wd:" + vm.classValue + ".\n" +
                                                "    ?item wdt:"+vm.currentFilter.value+" ?temp.\n" +
                                                "    ?temp (p:" + vm.secondaryFilter.value + "/psv:" + vm.secondaryFilter.value + ") ?v.\n" +
                                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                                "}\n" +
                                                "LIMIT " + resultsPerPage + "\n" +
                                                "}\n" +
                                                "ORDER BY ?amount";
                                            const fullUr = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                                            axios.get(fullUr)
                                                .then(r => {
                                                    if (r.data['results']['bindings'].length) {
                                                        arr = generateFilterValuesFromNumbers(r.data['results']['bindings'])
                                                        for (var i = 0; i < arr.length; i++) {
                                                            var q = window.location.search;
                                                            parameters = new URLSearchParams(q)
                                                            parameters.delete("cf")
                                                            parameters.delete("sf")
                                                            parameters.set("q." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                                        }
                                                        vm.items = arr
                                                    }
                                                    vm.itemsType = 'Quantity'

                                                })
                                                .catch(error => {
                                                    vm.itemsType = 'Error'
                                                })
                                        })
                                }
                                else {
                                    firstItem = response.data['results']['bindings'][0].item.value.split("/").slice(-1)[0];
                                    var unitQuery = "SELECT ?unitLabel WHERE {\n" +
                                        "    wd:" + firstItem + " wdt:"+vm.currentFilter.value+" ?temp.\n" +
                                        "    ?temp (p:" + vm.secondaryFilter.value + "/psn:" + vm.secondaryFilter.value + ") ?v.\n" +
                                        "    ?v wikibase:quantityAmount ?amount;\n" +
                                        "       wikibase:quantityUnit ?unit.\n" +
                                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". }\n" +
                                        "}";
                                    const url = sparqlEndpoint + encodeURIComponent(unitQuery);
                                    axios.get(url)
                                        .then(res => {
                                            if (response.data['results']['bindings'].length) {
                                                arr = generateFilterValuesFromNumbers(response.data['results']['bindings'], res.data['results']['bindings'][0].unitLabel.value)
                                                for (var i = 0; i < arr.length; i++) {
                                                    var q = window.location.search;
                                                    parameters = new URLSearchParams(q)
                                                    parameters.delete("cf")
                                                    parameters.delete("sf")
                                                    parameters.set("quantity," + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                                }
                                                vm.items = arr
                                                vm.itemsType = 'Quantity'
                                            }
                                            else {
                                                index = vm.appliedFilters.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                                if (index = -1) this.itemsType = "Additionalempty"
                                                else this.itemsType = 'Quantity'
                                            }
                                        })
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
                                "    ?item wdt:" + instanceOf + " wd:" + vm.classValue + ".\n" +
                                "    ?item (p:" + vm.secondaryFilter.value + "/psn:" + vm.secondaryFilter.value + ") ?v.\n" +
                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                "}\n" +
                                "LIMIT " + resultsPerPage + "\n" +
                                "}\n" +
                                "ORDER BY ?amount";
                            vm.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                            const url = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(url)
                                .then(res => {
                                    if (vm.itemsType = 'Quantity') {
                                        arr = generateFilterValuesFromNumbers(res.data['results']['bindings'])
                                        for (var i = 0; i < arr.length; i++) {
                                            var q = window.location.search;
                                            parameters = new URLSearchParams(q)
                                            parameters.delete("cf")
                                            parameters.delete("sf")
                                            parameters.set("q." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                        }
                                        vm.items = arr
                                        vm.displayCount = 2
                                    }
                                })
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else {
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.set("f." + this.currentFilter.value + "." + this.secondaryFilter.value, "novalue")
                    this.noValueURL = window.location.pathname + "?" + parameters
                    var sparqlQuery = "SELECT ?value ?valueLabel ?count WHERE {\n" +
                        "{\n" +
                        "SELECT ?value (COUNT(?value) AS ?count) WHERE {\n" +
                        "?item wdt:" + instanceOf + " wd:" + this.classValue +".\n" +
                        "{\n?item wdt:" + this.currentFilter.value + " ?temp.\n" +
                        "?temp wdt:" + this.secondaryFilter.value + " ?value.\n}" +
                        filterString +
                        filterRanges +
                        filterQuantities +
                        noValueString +
                        "\n}\n" +
                        "GROUP BY ?value\n" +
                        "}\n" +
                        "SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
                        "}\n" +
                        "ORDER BY DESC (?count)";
                    this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
                    const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            if (response.data['results']['bindings'].length) {
                                arr = [...response.data['results']['bindings']]
                                index = []
                                for (let i = 0; i < vm.appliedFilters.length; i++) {
                                    if (vm.appliedFilters[i].filterValue == vm.secondaryFilter.value) {
                                        index.push(vm.appliedFilters[i].value)
                                    }
                                }
                                arr = arr.filter(x => !index.includes(x.value.value.split('/').slice(-1)[0]))
                                if (arr.length > 0) {
                                    this.itemsType = "Item"
                                    this.items = arr
                                }
                                else {
                                    this.itemsType = "Additionalempty"
                                }
                                for (var i = 0; i < arr.length; i++) {
                                    var q = window.location.search;
                                    parameters = new URLSearchParams(q)
                                    parameters.delete("cf")
                                    parameters.delete("sf")
                                    var existingValues = ""
                                    for (let i = 0; i < vm.appliedFilters.length; i++) {
                                        if (vm.appliedFilters[i].filterValue == this.secondaryFilter.value) {
                                            existingValues = existingValues + vm.appliedFilters[i].value + "-";
                                        }
                                    }
                                    parameters.set("f." + this.currentFilter.value + "." + this.secondaryFilter.value, existingValues + arr[i].value.value.split('/').slice(-1)[0])
                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                }
                            }
                            else {
                                index = vm.appliedFilters.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                if (index = -1) this.itemsType = "Additionalempty"
                                else this.itemsType = 'Item'
                            }
                        })
                        .catch(error => {
                            sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
                                "  {\n" +
                                "    SELECT DISTINCT ?value WHERE {\n" +
                                "      SELECT ?value WHERE {\n" +
                                "        hint:Query hint:optimizer \"None\".\n" +
                                "        ?item wdt:" + instanceOf + " wd:Q5398426.\n" +
                                "        ?item wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                "        ?temp wdt:" + vm.secondaryFilter.value + " ?value.\n" +
                                filterString +
                                filterRanges +
                                filterQuantities +
                                "      }\n" +
                                "      LIMIT 300\n" +
                                "    }\n" +
                                "  }\n" +
                                "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
                                "}\n" +
                                "ORDER BY (?valueLabel)";
                            const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then((res) => {
                                    vm.itemsType = "ItemFail"
                                    arr = [...res.data['results']['bindings']].slice(0).sort(
                                        function (a, b) {
                                            var x = a.valueLabel.value.toLowerCase();
                                            var y = b.valueLabel.value.toLowerCase();
                                            return x < y ? -1 : x > y ? 1 : 0;
                                        }
                                    )
                                    for (var i = 0; i < arr.length; i++) {
                                        var q = window.location.search;
                                        parameters = new URLSearchParams(q)
                                        parameters.delete("cf")
                                        parameters.delete("sf")
                                        parameters.set("f." + this.currentFilter.value + "." + this.secondaryFilter.value, arr[i].value.value.split('/').slice(-1)[0])
                                        arr[i]['href'] = window.location.pathname + "?" + parameters
                                    }
                                    vm.items = arr
                                })
                                .catch(error => {
                                    vm.itemsType = 'Error'
                                })

                        })
                }
            })
    }
})
