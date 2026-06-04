/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Showemail1Inputs */

const en_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show email to connections`)
};

const es_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar correo a los contactos`)
};

const de_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail an Verbindungen zeigen`)
};

const ar_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار البريد الإلكتروني لجهات الاتصال`)
};

const fr_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher l'e-mail aux contacts`)
};

const ko_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결에 이메일 표시`)
};

/**
* | output |
* | --- |
* | "Show email to connections" |
*
* @param {Settings_Privacy_Showemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_showemail1 = /** @type {((inputs?: Settings_Privacy_Showemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Showemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_showemail1(inputs)
	if (locale === "es") return es_settings_privacy_showemail1(inputs)
	if (locale === "de") return de_settings_privacy_showemail1(inputs)
	if (locale === "ar") return ar_settings_privacy_showemail1(inputs)
	if (locale === "fr") return fr_settings_privacy_showemail1(inputs)
	return ko_settings_privacy_showemail1(inputs)
});
export { settings_privacy_showemail1 as "settings.privacy.showEmail" }