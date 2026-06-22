/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Discoverappslabel3Inputs */

const en_dashboard_quickactions_discoverappslabel3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discover Apps`)
};

const es_dashboard_quickactions_discoverappslabel3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descubrir apps`)
};

const fr_dashboard_quickactions_discoverappslabel3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Découvrir des apps`)
};

const ar_dashboard_quickactions_discoverappslabel3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتشف التطبيقات`)
};

/**
* | output |
* | --- |
* | "Discover Apps" |
*
* @param {Dashboard_Quickactions_Discoverappslabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_discoverappslabel3 = /** @type {((inputs?: Dashboard_Quickactions_Discoverappslabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Discoverappslabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_discoverappslabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_discoverappslabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_discoverappslabel3(inputs)
	return ar_dashboard_quickactions_discoverappslabel3(inputs)
});
export { dashboard_quickactions_discoverappslabel3 as "dashboard.quickActions.discoverAppsLabel" }