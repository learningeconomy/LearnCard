/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Getstarted_Title1Inputs */

const en_dashboard_getstarted_title1 = /** @type {(inputs: Dashboard_Getstarted_Title1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Make ${i?.brand} yours in 3 steps`)
};

const es_dashboard_getstarted_title1 = /** @type {(inputs: Dashboard_Getstarted_Title1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Haz ${i?.brand} tuyo en 3 pasos`)
};

const fr_dashboard_getstarted_title1 = /** @type {(inputs: Dashboard_Getstarted_Title1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Faites de ${i?.brand} le vôtre en 3 étapes`)
};

const ar_dashboard_getstarted_title1 = /** @type {(inputs: Dashboard_Getstarted_Title1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`اجعل ${i?.brand} خاصًا بك في 3 خطوات`)
};

/**
* | output |
* | --- |
* | "Make {brand} yours in 3 steps" |
*
* @param {Dashboard_Getstarted_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_getstarted_title1 = /** @type {((inputs: Dashboard_Getstarted_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Getstarted_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_getstarted_title1(inputs)
	if (locale === "es") return es_dashboard_getstarted_title1(inputs)
	if (locale === "fr") return fr_dashboard_getstarted_title1(inputs)
	return ar_dashboard_getstarted_title1(inputs)
});
export { dashboard_getstarted_title1 as "dashboard.getStarted.title" }