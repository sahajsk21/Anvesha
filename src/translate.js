var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var messages = {
    en: {
        message: {
            itemCount: "There are {count} items that match this description.",
            about: "About",
            classPlaceholder: "Enter Class",
            browse: "Or, browse any of the following classes:",
            filtersCount: "No filters are defined for this class.",
            addFilter: "Add a filter",
            viewQuery: "View SPARQL query",
            noItems: "No items match this description.",
            displayItemsError: "The attempt to display a list of items took too long; please consider adding more filters.",
            gettingValues: "Getting values for filter",
            noAdditionalValues: "There are no additional values for the filter",
            filterError: "Trying to get values took too long for the filter",
            filterTimeout: "(Getting a complete set of values for this filter took too long; instead, here is a possibly incomplete set.)",
            selectValue: "Select a value for | Select an additional value for",
            noValue: "No Value",
            changeClassNote: "(Note: if you change the class, you will lose the current set of filters.)",
            specificClass: "Change to a more specific class:",
            generalClass: "Change to a more general class:",
            viewList: "View list of items",
            results: "({count} results)"
        }
    },
    fr: {
        message: {
            itemCount: "Il y a {count} articles qui correspondent à cette description.",
            about: "Sur",
            classPlaceholder: "Entrer en classe",
            browse: "Ou parcourez l'une des classes suivantes:",
            filtersCount: "Aucun filtre n'est défini pour cette classe.",
            addFilter: "Ajouter un filtre",
            viewQuery: "Afficher la requête SPARQL",
            noItems: "Aucun élément ne correspond à cette description.",
            displayItemsError: "La tentative d'afficher une liste d'éléments a pris trop de temps; veuillez envisager d'ajouter plus de filtres.",
            gettingValues: "Obtenir des valeurs pour le filtre",
            noAdditionalValues: "Il n'y a pas de valeurs supplémentaires pour le filtre",
            filterError: "Essayer d'obtenir des valeurs a pris trop de temps pour le filtre",
            filterTimeout: "(L'obtention d'un ensemble complet de valeurs pour ce filtre a pris trop de temps; à la place, voici un ensemble éventuellement incomplet.)",
            selectValue: "Sélectionnez une valeur pour | Sélectionnez une valeur supplémentaire pour",
            noValue: "Aucune valeur",
            changeClassNote: "(Remarque: si vous changez de classe, vous perdrez l'ensemble de filtres actuel.)",
            specificClass: "Passer à une classe plus spécifique:",
            generalClass: "Passer à une classe plus générale:",
            viewList: "Afficher la liste des articles",
            results: "({count} résultats)"
        }
    }
}

Vue.use(VueI18n)

var i18n = new VueI18n({
    locale: urlParams.get("lang") ? urlParams.get("lang") : (typeof DEFAULT_LANGUAGES != "undefined" ? DEFAULT_LANGUAGES[0] : "en"),
    fallbackLocale: typeof DEFAULT_LANGUAGES != "undefined" ? DEFAULT_LANGUAGES : "en",
    messages: messages
})