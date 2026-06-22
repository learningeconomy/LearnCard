/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Aifeatures1Inputs */

const en_settings_aifeatures1 = /** @type {(inputs: Settings_Aifeatures1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Features`)
};

const es_settings_aifeatures1 = /** @type {(inputs: Settings_Aifeatures1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Funciones de IA`)
};

const fr_settings_aifeatures1 = /** @type {(inputs: Settings_Aifeatures1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctionnalités IA`)
};

const ar_settings_aifeatures1 = /** @type {(inputs: Settings_Aifeatures1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Features" |
*
* @param {Settings_Aifeatures1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_aifeatures1 = /** @type {((inputs?: Settings_Aifeatures1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Aifeatures1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_aifeatures1(inputs)
	if (locale === "es") return es_settings_aifeatures1(inputs)
	if (locale === "fr") return fr_settings_aifeatures1(inputs)
	return ar_settings_aifeatures1(inputs)
});
export { settings_aifeatures1 as "settings.aiFeatures" }