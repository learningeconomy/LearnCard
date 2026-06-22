/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Appstoexplore2Inputs */

const en_dashboard_apps_appstoexplore2 = /** @type {(inputs: Dashboard_Apps_Appstoexplore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps to explore`)
};

const es_dashboard_apps_appstoexplore2 = /** @type {(inputs: Dashboard_Apps_Appstoexplore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps para explorar`)
};

const fr_dashboard_apps_appstoexplore2 = /** @type {(inputs: Dashboard_Apps_Appstoexplore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps à explorer`)
};

const ar_dashboard_apps_appstoexplore2 = /** @type {(inputs: Dashboard_Apps_Appstoexplore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات لاستكشافها`)
};

/**
* | output |
* | --- |
* | "Apps to explore" |
*
* @param {Dashboard_Apps_Appstoexplore2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_appstoexplore2 = /** @type {((inputs?: Dashboard_Apps_Appstoexplore2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Appstoexplore2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_appstoexplore2(inputs)
	if (locale === "es") return es_dashboard_apps_appstoexplore2(inputs)
	if (locale === "fr") return fr_dashboard_apps_appstoexplore2(inputs)
	return ar_dashboard_apps_appstoexplore2(inputs)
});
export { dashboard_apps_appstoexplore2 as "dashboard.apps.appsToExplore" }