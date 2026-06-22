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

const fr_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher l'e-mail aux contacts`)
};

const ar_settings_privacy_showemail1 = /** @type {(inputs: Settings_Privacy_Showemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار البريد الإلكتروني لجهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Show email to connections" |
*
* @param {Settings_Privacy_Showemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_showemail1 = /** @type {((inputs?: Settings_Privacy_Showemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Showemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_showemail1(inputs)
	if (locale === "es") return es_settings_privacy_showemail1(inputs)
	if (locale === "fr") return fr_settings_privacy_showemail1(inputs)
	return ar_settings_privacy_showemail1(inputs)
});
export { settings_privacy_showemail1 as "settings.privacy.showEmail" }