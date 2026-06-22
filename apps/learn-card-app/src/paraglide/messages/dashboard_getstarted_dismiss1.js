/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Getstarted_Dismiss1Inputs */

const en_dashboard_getstarted_dismiss1 = /** @type {(inputs: Dashboard_Getstarted_Dismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dismiss`)
};

const es_dashboard_getstarted_dismiss1 = /** @type {(inputs: Dashboard_Getstarted_Dismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descartar`)
};

const fr_dashboard_getstarted_dismiss1 = /** @type {(inputs: Dashboard_Getstarted_Dismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ignorer`)
};

const ar_dashboard_getstarted_dismiss1 = /** @type {(inputs: Dashboard_Getstarted_Dismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تجاهل`)
};

/**
* | output |
* | --- |
* | "Dismiss" |
*
* @param {Dashboard_Getstarted_Dismiss1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_getstarted_dismiss1 = /** @type {((inputs?: Dashboard_Getstarted_Dismiss1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Getstarted_Dismiss1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_getstarted_dismiss1(inputs)
	if (locale === "es") return es_dashboard_getstarted_dismiss1(inputs)
	if (locale === "fr") return fr_dashboard_getstarted_dismiss1(inputs)
	return ar_dashboard_getstarted_dismiss1(inputs)
});
export { dashboard_getstarted_dismiss1 as "dashboard.getStarted.dismiss" }