/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Visibilityprivate1Inputs */

const en_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Private`)
};

const es_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privado`)
};

const de_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privat`)
};

const ar_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خاص`)
};

const fr_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privé`)
};

const ko_settings_privacy_visibilityprivate1 = /** @type {(inputs: Settings_Privacy_Visibilityprivate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`비공개`)
};

/**
* | output |
* | --- |
* | "Private" |
*
* @param {Settings_Privacy_Visibilityprivate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_visibilityprivate1 = /** @type {((inputs?: Settings_Privacy_Visibilityprivate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Visibilityprivate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_visibilityprivate1(inputs)
	if (locale === "es") return es_settings_privacy_visibilityprivate1(inputs)
	if (locale === "de") return de_settings_privacy_visibilityprivate1(inputs)
	if (locale === "ar") return ar_settings_privacy_visibilityprivate1(inputs)
	if (locale === "fr") return fr_settings_privacy_visibilityprivate1(inputs)
	return ko_settings_privacy_visibilityprivate1(inputs)
});
export { settings_privacy_visibilityprivate1 as "settings.privacy.visibilityPrivate" }