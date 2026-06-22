/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Datatrust_Label1Inputs */

const en_dashboard_datatrust_label1 = /** @type {(inputs: Dashboard_Datatrust_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your data`)
};

const es_dashboard_datatrust_label1 = /** @type {(inputs: Dashboard_Datatrust_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus datos`)
};

const fr_dashboard_datatrust_label1 = /** @type {(inputs: Dashboard_Datatrust_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos données`)
};

const ar_dashboard_datatrust_label1 = /** @type {(inputs: Dashboard_Datatrust_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بياناتك`)
};

/**
* | output |
* | --- |
* | "Your data" |
*
* @param {Dashboard_Datatrust_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_label1 = /** @type {((inputs?: Dashboard_Datatrust_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_label1(inputs)
	if (locale === "es") return es_dashboard_datatrust_label1(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_label1(inputs)
	return ar_dashboard_datatrust_label1(inputs)
});
export { dashboard_datatrust_label1 as "dashboard.dataTrust.label" }