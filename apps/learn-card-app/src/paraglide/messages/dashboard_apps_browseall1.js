/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Browseall1Inputs */

const en_dashboard_apps_browseall1 = /** @type {(inputs: Dashboard_Apps_Browseall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse all →`)
};

const es_dashboard_apps_browseall1 = /** @type {(inputs: Dashboard_Apps_Browseall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todas →`)
};

const fr_dashboard_apps_browseall1 = /** @type {(inputs: Dashboard_Apps_Browseall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout parcourir →`)
};

const ar_dashboard_apps_browseall1 = /** @type {(inputs: Dashboard_Apps_Browseall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح الكل →`)
};

/**
* | output |
* | --- |
* | "Browse all →" |
*
* @param {Dashboard_Apps_Browseall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_browseall1 = /** @type {((inputs?: Dashboard_Apps_Browseall1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Browseall1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_browseall1(inputs)
	if (locale === "es") return es_dashboard_apps_browseall1(inputs)
	if (locale === "fr") return fr_dashboard_apps_browseall1(inputs)
	return ar_dashboard_apps_browseall1(inputs)
});
export { dashboard_apps_browseall1 as "dashboard.apps.browseAll" }