/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Analytics_Failedmsg1Inputs */

const en_troops_analytics_failedmsg1 = /** @type {(inputs: Troops_Analytics_Failedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load analytics`)
};

const es_troops_analytics_failedmsg1 = /** @type {(inputs: Troops_Analytics_Failedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar analytics`)
};

const fr_troops_analytics_failedmsg1 = /** @type {(inputs: Troops_Analytics_Failedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des analyses`)
};

const ar_troops_analytics_failedmsg1 = /** @type {(inputs: Troops_Analytics_Failedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل التحليلات`)
};

/**
* | output |
* | --- |
* | "Failed to load analytics" |
*
* @param {Troops_Analytics_Failedmsg1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_analytics_failedmsg1 = /** @type {((inputs?: Troops_Analytics_Failedmsg1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Analytics_Failedmsg1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_analytics_failedmsg1(inputs)
	if (locale === "es") return es_troops_analytics_failedmsg1(inputs)
	if (locale === "fr") return fr_troops_analytics_failedmsg1(inputs)
	return ar_troops_analytics_failedmsg1(inputs)
});
export { troops_analytics_failedmsg1 as "troops.analytics.failedMsg" }