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

const de_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutzeinstellungen konnten nicht aktualisiert werden.`)
};

const ar_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحديث إعدادات الخصوصية.`)
};

const fr_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de mettre à jour les paramètres de confidentialité.`)
};

const ko_settings_privacy_unabletoupdate2 = /** @type {(inputs: Settings_Privacy_Unabletoupdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 설정을 업데이트할 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Unable to update privacy settings." |
*
* @param {Settings_Privacy_Unabletoupdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_unabletoupdate2 = /** @type {((inputs?: Settings_Privacy_Unabletoupdate2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Unabletoupdate2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_unabletoupdate2(inputs)
	if (locale === "es") return es_settings_privacy_unabletoupdate2(inputs)
	if (locale === "de") return de_settings_privacy_unabletoupdate2(inputs)
	if (locale === "ar") return ar_settings_privacy_unabletoupdate2(inputs)
	if (locale === "fr") return fr_settings_privacy_unabletoupdate2(inputs)
	return ko_settings_privacy_unabletoupdate2(inputs)
});
export { settings_privacy_unabletoupdate2 as "settings.privacy.unableToUpdate" }