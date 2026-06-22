/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_AnalyticsInputs */

const en_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usage Analytics`)
};

const es_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analíticas de uso`)
};

const fr_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyses d'utilisation`)
};

const ar_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحليلات الاستخدام`)
};

/**
* | output |
* | --- |
* | "Usage Analytics" |
*
* @param {Settings_AnalyticsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_analytics = /** @type {((inputs?: Settings_AnalyticsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_AnalyticsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_analytics(inputs)
	if (locale === "es") return es_settings_analytics(inputs)
	if (locale === "fr") return fr_settings_analytics(inputs)
	return ar_settings_analytics(inputs)
});
export { settings_analytics as "settings.analytics" }