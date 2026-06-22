/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Datatrust_Detailfew2Inputs */

const en_dashboard_datatrust_detailfew2 = /** @type {(inputs: Dashboard_Datatrust_Detailfew2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can stop anytime.`)
};

const es_dashboard_datatrust_detailfew2 = /** @type {(inputs: Dashboard_Datatrust_Detailfew2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes detenerlo cuando quieras.`)
};

const fr_dashboard_datatrust_detailfew2 = /** @type {(inputs: Dashboard_Datatrust_Detailfew2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez arrêter à tout moment.`)
};

const ar_dashboard_datatrust_detailfew2 = /** @type {(inputs: Dashboard_Datatrust_Detailfew2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك التوقف في أي وقت.`)
};

/**
* | output |
* | --- |
* | "You can stop anytime." |
*
* @param {Dashboard_Datatrust_Detailfew2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_detailfew2 = /** @type {((inputs?: Dashboard_Datatrust_Detailfew2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Detailfew2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_detailfew2(inputs)
	if (locale === "es") return es_dashboard_datatrust_detailfew2(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_detailfew2(inputs)
	return ar_dashboard_datatrust_detailfew2(inputs)
});
export { dashboard_datatrust_detailfew2 as "dashboard.dataTrust.detailFew" }