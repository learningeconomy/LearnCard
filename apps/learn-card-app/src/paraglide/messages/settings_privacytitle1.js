/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacytitle1Inputs */

const en_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy & Data`)
};

const es_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacidad y datos`)
};

const de_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutz und Daten`)
};

const ar_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخصوصية والبيانات`)
};

const fr_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confidentialité et données`)
};

const ko_settings_privacytitle1 = /** @type {(inputs: Settings_Privacytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 보호 및 데이터`)
};

/**
* | output |
* | --- |
* | "Privacy & Data" |
*
* @param {Settings_Privacytitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacytitle1 = /** @type {((inputs?: Settings_Privacytitle1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacytitle1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacytitle1(inputs)
	if (locale === "es") return es_settings_privacytitle1(inputs)
	if (locale === "de") return de_settings_privacytitle1(inputs)
	if (locale === "ar") return ar_settings_privacytitle1(inputs)
	if (locale === "fr") return fr_settings_privacytitle1(inputs)
	return ko_settings_privacytitle1(inputs)
});
export { settings_privacytitle1 as "settings.privacyTitle" }