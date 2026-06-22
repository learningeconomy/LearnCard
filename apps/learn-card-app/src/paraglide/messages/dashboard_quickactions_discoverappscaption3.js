/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Discoverappscaption3Inputs */

const en_dashboard_quickactions_discoverappscaption3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Find apps to get started`)
};

const es_dashboard_quickactions_discoverappscaption3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Encuentra apps para empezar`)
};

const fr_dashboard_quickactions_discoverappscaption3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trouvez des apps pour démarrer`)
};

const ar_dashboard_quickactions_discoverappscaption3 = /** @type {(inputs: Dashboard_Quickactions_Discoverappscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعثر على تطبيقات للبدء`)
};

/**
* | output |
* | --- |
* | "Find apps to get started" |
*
* @param {Dashboard_Quickactions_Discoverappscaption3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_discoverappscaption3 = /** @type {((inputs?: Dashboard_Quickactions_Discoverappscaption3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Discoverappscaption3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_discoverappscaption3(inputs)
	if (locale === "es") return es_dashboard_quickactions_discoverappscaption3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_discoverappscaption3(inputs)
	return ar_dashboard_quickactions_discoverappscaption3(inputs)
});
export { dashboard_quickactions_discoverappscaption3 as "dashboard.quickActions.discoverAppsCaption" }