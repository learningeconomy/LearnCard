/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Analytics_TitleInputs */

const en_troops_analytics_title = /** @type {(inputs: Troops_Analytics_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analytics Dashboard`)
};

const es_troops_analytics_title = /** @type {(inputs: Troops_Analytics_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de Analytics`)
};

const fr_troops_analytics_title = /** @type {(inputs: Troops_Analytics_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord analytique`)
};

const ar_troops_analytics_title = /** @type {(inputs: Troops_Analytics_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة التحليلات`)
};

/**
* | output |
* | --- |
* | "Analytics Dashboard" |
*
* @param {Troops_Analytics_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_analytics_title = /** @type {((inputs?: Troops_Analytics_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Analytics_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_analytics_title(inputs)
	if (locale === "es") return es_troops_analytics_title(inputs)
	if (locale === "fr") return fr_troops_analytics_title(inputs)
	return ar_troops_analytics_title(inputs)
});
export { troops_analytics_title as "troops.analytics.title" }