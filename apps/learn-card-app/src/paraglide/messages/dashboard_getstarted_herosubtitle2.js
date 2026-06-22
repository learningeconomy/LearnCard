/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Getstarted_Herosubtitle2Inputs */

const en_dashboard_getstarted_herosubtitle2 = /** @type {(inputs: Dashboard_Getstarted_Herosubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Three quick steps to set up your passport.`)
};

const es_dashboard_getstarted_herosubtitle2 = /** @type {(inputs: Dashboard_Getstarted_Herosubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tres pasos rápidos para configurar tu pasaporte.`)
};

const fr_dashboard_getstarted_herosubtitle2 = /** @type {(inputs: Dashboard_Getstarted_Herosubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trois étapes rapides pour configurer votre passeport.`)
};

const ar_dashboard_getstarted_herosubtitle2 = /** @type {(inputs: Dashboard_Getstarted_Herosubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ثلاث خطوات سريعة لإعداد جواز سفرك.`)
};

/**
* | output |
* | --- |
* | "Three quick steps to set up your passport." |
*
* @param {Dashboard_Getstarted_Herosubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_getstarted_herosubtitle2 = /** @type {((inputs?: Dashboard_Getstarted_Herosubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Getstarted_Herosubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_getstarted_herosubtitle2(inputs)
	if (locale === "es") return es_dashboard_getstarted_herosubtitle2(inputs)
	if (locale === "fr") return fr_dashboard_getstarted_herosubtitle2(inputs)
	return ar_dashboard_getstarted_herosubtitle2(inputs)
});
export { dashboard_getstarted_herosubtitle2 as "dashboard.getStarted.heroSubtitle" }