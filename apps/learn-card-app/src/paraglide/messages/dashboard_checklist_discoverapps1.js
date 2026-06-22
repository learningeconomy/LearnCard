/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Checklist_Discoverapps1Inputs */

const en_dashboard_checklist_discoverapps1 = /** @type {(inputs: Dashboard_Checklist_Discoverapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discover apps`)
};

const es_dashboard_checklist_discoverapps1 = /** @type {(inputs: Dashboard_Checklist_Discoverapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descubre apps`)
};

const fr_dashboard_checklist_discoverapps1 = /** @type {(inputs: Dashboard_Checklist_Discoverapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Découvrez des apps`)
};

const ar_dashboard_checklist_discoverapps1 = /** @type {(inputs: Dashboard_Checklist_Discoverapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتشف التطبيقات`)
};

/**
* | output |
* | --- |
* | "Discover apps" |
*
* @param {Dashboard_Checklist_Discoverapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_checklist_discoverapps1 = /** @type {((inputs?: Dashboard_Checklist_Discoverapps1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Checklist_Discoverapps1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_checklist_discoverapps1(inputs)
	if (locale === "es") return es_dashboard_checklist_discoverapps1(inputs)
	if (locale === "fr") return fr_dashboard_checklist_discoverapps1(inputs)
	return ar_dashboard_checklist_discoverapps1(inputs)
});
export { dashboard_checklist_discoverapps1 as "dashboard.checklist.discoverApps" }