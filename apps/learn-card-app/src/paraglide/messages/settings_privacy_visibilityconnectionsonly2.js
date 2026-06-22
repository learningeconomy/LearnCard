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

const fr_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts uniquement`)
};

const ar_settings_privacy_visibilityconnectionsonly2 = /** @type {(inputs: Settings_Privacy_Visibilityconnectionsonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال فقط`)
};

/**
* | output |
* | --- |
* | "Connections only" |
*
* @param {Settings_Privacy_Visibilityconnectionsonly2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_visibilityconnectionsonly2 = /** @type {((inputs?: Settings_Privacy_Visibilityconnectionsonly2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Visibilityconnectionsonly2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "es") return es_settings_privacy_visibilityconnectionsonly2(inputs)
	if (locale === "fr") return fr_settings_privacy_visibilityconnectionsonly2(inputs)
	return ar_settings_privacy_visibilityconnectionsonly2(inputs)
});
export { settings_privacy_visibilityconnectionsonly2 as "settings.privacy.visibilityConnectionsOnly" }