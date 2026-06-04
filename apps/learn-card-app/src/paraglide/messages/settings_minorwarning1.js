/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Minorwarning1Inputs */

const en_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some features are restricted for users under 18.`)
};

const es_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algunas funciones están restringidas para usuarios menores de 18 años.`)
};

const de_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einige Funktionen sind für Benutzer unter 18 Jahren eingeschränkt.`)
};

const ar_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعض الميزات مقيدة للمستخدمين الذين تقل أعمارهم عن 18 عامًا.`)
};

const fr_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certaines fonctionnalités sont réservées aux utilisateurs de moins de 18 ans.`)
};

const ko_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`18세 미만 사용자에게는 일부 기능이 제한됩니다.`)
};

/**
* | output |
* | --- |
* | "Some features are restricted for users under 18." |
*
* @param {Settings_Minorwarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_minorwarning1 = /** @type {((inputs?: Settings_Minorwarning1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Minorwarning1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_minorwarning1(inputs)
	if (locale === "es") return es_settings_minorwarning1(inputs)
	if (locale === "de") return de_settings_minorwarning1(inputs)
	if (locale === "ar") return ar_settings_minorwarning1(inputs)
	if (locale === "fr") return fr_settings_minorwarning1(inputs)
	return ko_settings_minorwarning1(inputs)
});
export { settings_minorwarning1 as "settings.minorWarning" }