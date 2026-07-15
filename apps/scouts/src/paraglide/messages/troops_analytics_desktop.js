/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Analytics_DesktopInputs */

const en_troops_analytics_desktop = /** @type {(inputs: Troops_Analytics_DesktopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analytics is only supported on desktop devices. Please view this from a desktop browser.`)
};

const es_troops_analytics_desktop = /** @type {(inputs: Troops_Analytics_DesktopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analytics solo es compatible en dispositivos de escritorio. Por favor usa un navegador de escritorio.`)
};

const fr_troops_analytics_desktop = /** @type {(inputs: Troops_Analytics_DesktopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les analyses ne sont prises en charge que sur les appareils de bureau. Veuillez consulter depuis un navigateur de bureau.`)
};

const ar_troops_analytics_desktop = /** @type {(inputs: Troops_Analytics_DesktopInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحليلات مدعومة فقط على أجهزة الكمبيوتر. يرجى عرضها من متصفح سطح المكتب.`)
};

/**
* | output |
* | --- |
* | "Analytics is only supported on desktop devices. Please view this from a desktop browser." |
*
* @param {Troops_Analytics_DesktopInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_analytics_desktop = /** @type {((inputs?: Troops_Analytics_DesktopInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Analytics_DesktopInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_analytics_desktop(inputs)
	if (locale === "es") return es_troops_analytics_desktop(inputs)
	if (locale === "fr") return fr_troops_analytics_desktop(inputs)
	return ar_troops_analytics_desktop(inputs)
});
export { troops_analytics_desktop as "troops.analytics.desktop" }