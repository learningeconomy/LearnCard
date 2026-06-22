/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Goback1Inputs */

const en_settings_goback1 = /** @type {(inputs: Settings_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go back`)
};

const es_settings_goback1 = /** @type {(inputs: Settings_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const fr_settings_goback1 = /** @type {(inputs: Settings_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourner`)
};

const ar_settings_goback1 = /** @type {(inputs: Settings_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عُد`)
};

/**
* | output |
* | --- |
* | "Go back" |
*
* @param {Settings_Goback1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_goback1 = /** @type {((inputs?: Settings_Goback1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Goback1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_goback1(inputs)
	if (locale === "es") return es_settings_goback1(inputs)
	if (locale === "fr") return fr_settings_goback1(inputs)
	return ar_settings_goback1(inputs)
});
export { settings_goback1 as "settings.goBack" }