/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_AnalyticsInputs */

const en_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analytics & Insights`)
};

const es_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Análisis e información`)
};

const de_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analysen und Einblicke`)
};

const ar_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحليلات والرؤى`)
};

const fr_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyses et informations`)
};

const ko_settings_analytics = /** @type {(inputs: Settings_AnalyticsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`분석 및 통찰력`)
};

/**
* | output |
* | --- |
* | "Analytics & Insights" |
*
* @param {Settings_AnalyticsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_analytics = /** @type {((inputs?: Settings_AnalyticsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_AnalyticsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_analytics(inputs)
	if (locale === "es") return es_settings_analytics(inputs)
	if (locale === "de") return de_settings_analytics(inputs)
	if (locale === "ar") return ar_settings_analytics(inputs)
	if (locale === "fr") return fr_settings_analytics(inputs)
	return ko_settings_analytics(inputs)
});
export { settings_analytics as "settings.analytics" }