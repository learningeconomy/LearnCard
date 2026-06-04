/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Settings_Analyticsdesc1Inputs */

const en_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Help improve ${i?.brand} with anonymous usage data`)
};

const es_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ayude a mejorar ${i?.brand} con datos de uso anónimos`)
};

const de_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Helfen Sie mit, ${i?.brand} mit anonymen Nutzungsdaten zu verbessern`)
};

const ar_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ساعد في تحسين ${i?.brand} ببيانات الاستخدام المجهولة`)
};

const fr_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aidez-nous à améliorer ${i?.brand} grâce à des données d'utilisation anonymes`)
};

const ko_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`익명의 사용 데이터를 통해 ${i?.brand} 개선에 참여해 주세요.`)
};

/**
* | output |
* | --- |
* | "Help improve {brand} with anonymous usage data" |
*
* @param {Settings_Analyticsdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_analyticsdesc1 = /** @type {((inputs: Settings_Analyticsdesc1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Analyticsdesc1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_analyticsdesc1(inputs)
	if (locale === "es") return es_settings_analyticsdesc1(inputs)
	if (locale === "de") return de_settings_analyticsdesc1(inputs)
	if (locale === "ar") return ar_settings_analyticsdesc1(inputs)
	if (locale === "fr") return fr_settings_analyticsdesc1(inputs)
	return ko_settings_analyticsdesc1(inputs)
});
export { settings_analyticsdesc1 as "settings.analyticsDesc" }