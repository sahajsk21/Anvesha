// Configuration variables
siteName = typeof SITE_NAME != "undefined" ? SITE_NAME:"Anvesha";
defaultLanguages = typeof PREFERRED_LANGUAGES != "undefined" ? PREFERRED_LANGUAGES : [];
resultsPerPage = typeof RESULTS_PER_PAGE != "undefined" ? RESULTS_PER_PAGE : 200;
favicon = typeof FAVICON != "undefined" ? FAVICON : "";
logo = typeof LOGO != "undefined" ? LOGO : "";
classes = typeof SUGGESTED_CLASSES != "undefined" ? SUGGESTED_CLASSES.map(function(v){return {value:v}}) : [];
sparqlEndpoint = typeof SPARQL_ENDPOINT != "undefined" ? SPARQL_ENDPOINT : "https://query.wikidata.org/sparql?query=";
instanceOf = typeof INSTANCE_OF_PID != "undefined" ? INSTANCE_OF_PID : "P31";
propertiesForThisType = typeof PROPERTIES_FOR_THIS_TYPE_PID != "undefined" ? PROPERTIES_FOR_THIS_TYPE_PID : "P1963";

// Website name
document.title = siteName

// Set favicon dynamically
var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
link.rel = 'shortcut icon';
link.href = favicon;
document.getElementsByTagName('head')[0].appendChild(link);

// URL Parameters
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

// Language
var languages = ["en","ceb","sv","de","fr","nl","ru","it","es","pl","war","vi","ja","zh",
                "arz","ar","uk","pt","fa","ca","sr","id","no","ko","fi","hu","cs","sh","ro","nan",
                "tr","eu","ms","ce","eo","he","hy","bg","da","azb","sk","kk","min","hr","et","lt","be","el","az",
                "sl","gl","ur","nn","nb","hi","ka","th","tt","uz","la","cy","ta","vo","mk","ast","lv","yue","tg",
                "bn","af","mg","oc","bs","sq","ky","nds","new","be-tarask","ml","te","br","tl","vec","pms","mr",
                "su","ht","sw","lb","jv","sco","pnb","ba","ga","szl","is","my","fy","cv","lmo","wuu"];
    langArray = defaultLanguages.concat(languages.filter(x => !defaultLanguages.includes(x)));
    lang = urlParams.get('lang') ? urlParams.get('lang') + "," + langArray.join(",") : langArray.join(",");

// History logging
(function (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({ state: state });
        }
        return pushState.apply(history, arguments);
    }
})(window.history);

// Bucket creation and number formatting
var gBucketsPerFilter = 10;

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function NumberRange(lowNumber, highNumber) {
    this.lowNumber = lowNumber;
    this.highNumber = highNumber;
}
NumberRange.fromString = function (filterText) {
    var numberRange = new NumberRange();
    filterText = String(filterText);
    var numbers = filterText.split(' - ');
    if (numbers.length == 2) {
        numberRange.lowNumber = parseFloat(numbers[0]);
        numberRange.highNumber = parseFloat(numbers[1]);
    } else {
        numberRange.lowNumber = parseFloat(filterText);
        numberRange.highNumber = null;
    }
    return numberRange;
}
NumberRange.prototype.toString = function () {
    if (this.highNumber == null) {
        return numberWithCommas(this.lowNumber);
    } else {
        return numberWithCommas(this.lowNumber) + " - " + numberWithCommas(this.highNumber);
    }
}
