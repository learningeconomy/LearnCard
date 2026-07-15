/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Analytics_CloseInputs */

const en_troops_analytics_close = /** @type {(inputs: Troops_Analytics_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close Analytics`)
};

const es_troops_analytics_close = /** @type {(inputs: Troops_Analytics_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar Analytics`)
};

const fr_troops_analytics_close = /** @type {(inputs: Troops_Analytics_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer les analyses`)
};

const ar_troops_analytics_close = /** @type {(inputs: Troops_Analytics_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق التحليلات`)
};

/**
* | output |
* | --- |
* | "Close Analytics" |
*
* @param {Troops_Analytics_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_analytics_close = /** @type {((inputs?: Troops_Analytics_CloseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Analytics_CloseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_analytics_close(inputs)
	if (locale === "es") return es_troops_analytics_close(inputs)
	if (locale === "fr") return fr_troops_analytics_close(inputs)
	return ar_troops_analytics_close(inputs)
});
export { troops_analytics_close as "troops.analytics.close" }