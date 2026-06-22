/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Understandnewcaption3Inputs */

const en_dashboard_quickactions_understandnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tell us about your skills`)
};

const es_dashboard_quickactions_understandnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuéntanos sobre tus habilidades`)
};

const fr_dashboard_quickactions_understandnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parlez-nous de vos compétences`)
};

const ar_dashboard_quickactions_understandnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Understandnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخبرنا عن مهاراتك`)
};

/**
* | output |
* | --- |
* | "Tell us about your skills" |
*
* @param {Dashboard_Quickactions_Understandnewcaption3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_understandnewcaption3 = /** @type {((inputs?: Dashboard_Quickactions_Understandnewcaption3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Understandnewcaption3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_understandnewcaption3(inputs)
	if (locale === "es") return es_dashboard_quickactions_understandnewcaption3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_understandnewcaption3(inputs)
	return ar_dashboard_quickactions_understandnewcaption3(inputs)
});
export { dashboard_quickactions_understandnewcaption3 as "dashboard.quickActions.understandNewCaption" }