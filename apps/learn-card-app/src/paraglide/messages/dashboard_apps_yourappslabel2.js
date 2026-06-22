/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Yourappslabel2Inputs */

const en_dashboard_apps_yourappslabel2 = /** @type {(inputs: Dashboard_Apps_Yourappslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your apps`)
};

const es_dashboard_apps_yourappslabel2 = /** @type {(inputs: Dashboard_Apps_Yourappslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus apps`)
};

const fr_dashboard_apps_yourappslabel2 = /** @type {(inputs: Dashboard_Apps_Yourappslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos apps`)
};

const ar_dashboard_apps_yourappslabel2 = /** @type {(inputs: Dashboard_Apps_Yourappslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقاتك`)
};

/**
* | output |
* | --- |
* | "Your apps" |
*
* @param {Dashboard_Apps_Yourappslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_yourappslabel2 = /** @type {((inputs?: Dashboard_Apps_Yourappslabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Yourappslabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_yourappslabel2(inputs)
	if (locale === "es") return es_dashboard_apps_yourappslabel2(inputs)
	if (locale === "fr") return fr_dashboard_apps_yourappslabel2(inputs)
	return ar_dashboard_apps_yourappslabel2(inputs)
});
export { dashboard_apps_yourappslabel2 as "dashboard.apps.yourAppsLabel" }