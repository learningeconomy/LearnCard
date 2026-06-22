/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Getstarted_Herotitle2Inputs */

const en_dashboard_getstarted_herotitle2 = /** @type {(inputs: Dashboard_Getstarted_Herotitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Make ${i?.brand} yours`)
};

const es_dashboard_getstarted_herotitle2 = /** @type {(inputs: Dashboard_Getstarted_Herotitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Haz ${i?.brand} tuyo`)
};

const fr_dashboard_getstarted_herotitle2 = /** @type {(inputs: Dashboard_Getstarted_Herotitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Faites de ${i?.brand} le vôtre`)
};

const ar_dashboard_getstarted_herotitle2 = /** @type {(inputs: Dashboard_Getstarted_Herotitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`اجعل ${i?.brand} خاصًا بك`)
};

/**
* | output |
* | --- |
* | "Make {brand} yours" |
*
* @param {Dashboard_Getstarted_Herotitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_getstarted_herotitle2 = /** @type {((inputs: Dashboard_Getstarted_Herotitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Getstarted_Herotitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_getstarted_herotitle2(inputs)
	if (locale === "es") return es_dashboard_getstarted_herotitle2(inputs)
	if (locale === "fr") return fr_dashboard_getstarted_herotitle2(inputs)
	return ar_dashboard_getstarted_herotitle2(inputs)
});
export { dashboard_getstarted_herotitle2 as "dashboard.getStarted.heroTitle" }