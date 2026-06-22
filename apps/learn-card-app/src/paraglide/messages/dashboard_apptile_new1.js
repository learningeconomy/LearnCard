/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apptile_New1Inputs */

const en_dashboard_apptile_new1 = /** @type {(inputs: Dashboard_Apptile_New1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New`)
};

const es_dashboard_apptile_new1 = /** @type {(inputs: Dashboard_Apptile_New1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo`)
};

const fr_dashboard_apptile_new1 = /** @type {(inputs: Dashboard_Apptile_New1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau`)
};

const ar_dashboard_apptile_new1 = /** @type {(inputs: Dashboard_Apptile_New1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جديد`)
};

/**
* | output |
* | --- |
* | "New" |
*
* @param {Dashboard_Apptile_New1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apptile_new1 = /** @type {((inputs?: Dashboard_Apptile_New1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apptile_New1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apptile_new1(inputs)
	if (locale === "es") return es_dashboard_apptile_new1(inputs)
	if (locale === "fr") return fr_dashboard_apptile_new1(inputs)
	return ar_dashboard_apptile_new1(inputs)
});
export { dashboard_apptile_new1 as "dashboard.appTile.new" }