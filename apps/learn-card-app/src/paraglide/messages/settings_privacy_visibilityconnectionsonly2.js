/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Visibilityconnectionsonly2Inputs */

const en_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connections only`)
};

const es_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo contactos`)
};

const de_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nur Verbindungen`)
};

const ar_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال فقط`)
};

const fr_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts uniquement`)
};

const ko_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결된 사람만`)
};

/**
* | output |
* | --- |
* | "Connections only" |
*
* @param {Settings_Privacy_Visibilityconnectionsonly2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_visibilityconnectionsonly2 = /** @type {((inputs?: Settings_Privacy_Visibilityconnectionsonly2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Visibilityconnectionsonly2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "es") return es_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "de") return de_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "ar") return ar_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "fr") return fr_settings_privacy_visibilityconnectionsonly2(inputs)
	return ko_settings_privacy_visibilityconnectionsonly2(inputs)
});
export { settings_privacy_visibilityconnectionsonly2 as "settings.privacy.visibilityConnectionsOnly" }