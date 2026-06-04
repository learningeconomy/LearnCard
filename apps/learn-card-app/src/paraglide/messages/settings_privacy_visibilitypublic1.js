/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Visibilitypublic1Inputs */

const en_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Public`)
};

const es_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Público`)
};

const de_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Öffentlich`)
};

const ar_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عام`)
};

const fr_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Public`)
};

const ko_settings_privacy_visibilitypublic1 = /** @type {(inputs: Settings_Privacy_Visibilitypublic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공개`)
};

/**
* | output |
* | --- |
* | "Public" |
*
* @param {Settings_Privacy_Visibilitypublic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_visibilitypublic1 = /** @type {((inputs?: Settings_Privacy_Visibilitypublic1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Visibilitypublic1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_visibilitypublic1(inputs)
	if (locale === "es") return es_settings_privacy_visibilitypublic1(inputs)
	if (locale === "de") return de_settings_privacy_visibilitypublic1(inputs)
	if (locale === "ar") return ar_settings_privacy_visibilitypublic1(inputs)
	if (locale === "fr") return fr_settings_privacy_visibilitypublic1(inputs)
	return ko_settings_privacy_visibilitypublic1(inputs)
});
export { settings_privacy_visibilitypublic1 as "settings.privacy.visibilityPublic" }