/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Getstarted_Label1Inputs */

const en_dashboard_getstarted_label1 = /** @type {(inputs: Dashboard_Getstarted_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get started`)
};

const es_dashboard_getstarted_label1 = /** @type {(inputs: Dashboard_Getstarted_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comienza`)
};

const fr_dashboard_getstarted_label1 = /** @type {(inputs: Dashboard_Getstarted_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour commencer`)
};

const ar_dashboard_getstarted_label1 = /** @type {(inputs: Dashboard_Getstarted_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ الآن`)
};

/**
* | output |
* | --- |
* | "Get started" |
*
* @param {Dashboard_Getstarted_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_getstarted_label1 = /** @type {((inputs?: Dashboard_Getstarted_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Getstarted_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_getstarted_label1(inputs)
	if (locale === "es") return es_dashboard_getstarted_label1(inputs)
	if (locale === "fr") return fr_dashboard_getstarted_label1(inputs)
	return ar_dashboard_getstarted_label1(inputs)
});
export { dashboard_getstarted_label1 as "dashboard.getStarted.label" }