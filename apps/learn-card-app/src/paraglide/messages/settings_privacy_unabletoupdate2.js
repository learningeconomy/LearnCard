/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Unabletoupdate2Inputs */

const en_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to update privacy settings.`)
};

const es_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo actualizar la configuración de privacidad.`)
};

const fr_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de mettre à jour les paramètres de confidentialité.`)
};

const ar_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحديث إعدادات الخصوصية.`)
};

/**
* | output |
* | --- |
* | "Unable to update privacy settings." |
*
* @param {Settings_Privacy_Unabletoupdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_unabletoupdate2 = /** @type {((inputs?: Settings_Privacy_Unabletoupdate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Unabletoupdate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_unabletoupdate2(inputs)
	if (locale === "es") return es_settings_privacy_unabletoupdate2(inputs)
	if (locale === "fr") return fr_settings_privacy_unabletoupdate2(inputs)
	return ar_settings_privacy_unabletoupdate2(inputs)
});
export { settings_privacy_unabletoupdate2 as "settings.privacy.unableToUpdate" }