/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Viewall1Inputs */

const en_dashboard_apps_viewall1 = /** @type {(inputs: Dashboard_Apps_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View all →`)
};

const es_dashboard_apps_viewall1 = /** @type {(inputs: Dashboard_Apps_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todas →`)
};

const fr_dashboard_apps_viewall1 = /** @type {(inputs: Dashboard_Apps_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout voir →`)
};

const ar_dashboard_apps_viewall1 = /** @type {(inputs: Dashboard_Apps_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكل →`)
};

/**
* | output |
* | --- |
* | "View all →" |
*
* @param {Dashboard_Apps_Viewall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_viewall1 = /** @type {((inputs?: Dashboard_Apps_Viewall1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Viewall1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_viewall1(inputs)
	if (locale === "es") return es_dashboard_apps_viewall1(inputs)
	if (locale === "fr") return fr_dashboard_apps_viewall1(inputs)
	return ar_dashboard_apps_viewall1(inputs)
});
export { dashboard_apps_viewall1 as "dashboard.apps.viewAll" }