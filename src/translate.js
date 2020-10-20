var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var messages = {
    en: {
        message: {
            itemCount: "There are {count} items that match this description.",
            about:"About",
            classPlaceholder:"Enter Class",
            browse:"Or, browse any of the following classes:"
        }
    },
    fr: {
        message: {
            itemCount: "Il y a {count} articles qui correspondent à cette description.",
            about: "Sur",
            classPlaceholder:"Entrer en classe",
            browse:"Ou parcourez l'une des classes suivantes:"
        }
    }
}

Vue.use(VueI18n)

var i18n = new VueI18n({
    locale: urlParams.get("lang") ? urlParams.get("lang") : config["defaultLanguage"],
    messages: messages
})