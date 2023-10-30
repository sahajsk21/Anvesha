headerView = Vue.component('header-view',{
    props: ['classLabel', 'appliedFilters', 'appliedRanges', 'appliedQuantities'],
    template:`
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
            <p v-for="filter in appliedFilters">
                <b>
                    <span v-if="filter.parentFilterValue" v-html="filter.parentFilterValueLabel + arrow + filter.filterValueLabel"> </span>
                    <span v-else>
                        {{filter.filterValueLabel}}
                    </span>
                </b>
                :
                <span v-if="filter.value == 'novalue'" :style="{ fontStyle: 'italic' }">
                    {{ filter.valueLabel }}</span><span v-else><a :href="filter.valueLink">{{ filter.valueLabel }}</a>
                </span> 
                ( <a @click="removeFilter(filter)">&#x2715;</a> )
            </p>
            <p v-for="range in appliedRanges">
                <b>
                    <span v-if="range.parentFilterValue" v-html="range.parentFilterValueLabel + arrow + range.filterValueLabel"></span>
                    <span v-else>
                        {{range.filterValueLabel}}
                    </span>
                </b>
                : 
                <span v-if="range.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">
                    {{ range.valueLabel }}
                </span>
                <span v-else>
                    {{ range.valueLabel }}
                </span> 
                ( <a @click="removeRange(range)">&#x2715;</a> )
            </p>
            <p v-for="quantity in appliedQuantities">
                <b>
                    <span v-if="quantity.parentFilterValue" v-html="quantity.parentFilterValueLabel + arrow + quantity.filterValueLabel"></span>
                    <span v-else>
                        {{quantity.filterValueLabel}}
                    </span>
                </b>
                : 
                <span v-if="quantity.valueLL == 'novalue'" :style="{ fontStyle: 'italic' }">
                    {{ quantity.valueLabel }}</span><span v-else>{{ quantity.valueLabel }}
                </span> 
                {{quantity.unit}}&nbsp;( <a @click="removeQuantity(quantity)">&#x2715;</a> )
            </p>
        </div>
    `,
    methods: {
        pathForView(view) {
            return window.location.href + '&view=' + view;
        },
        changePage(page) {
            this.$emit('change-page', page)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value);
        },
        removeRange(range) {
            this.$emit("remove-range", range);
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity);
        }
    }
})