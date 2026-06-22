/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Profilevisibility1Inputs */

const en_settings_privacy_profilevisibility1 = /** @type {(inputs: Settings_Privacy_Profilevisibility1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile visibility`)
};

const es_settings_privacy_profilevisibility1 = /** @type {(inputs: Settings_Privacy_Profilevisibility1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilidad del perfil`)
};

const fr_settings_privacy_profilevisibility1 = /** @type {(inputs: Settings_Privacy_Profilevisibility1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilité du profil`)
};

const ar_settings_privacy_profilevisibility1 = /** @type {(inputs: Settings_Privacy_Profilevisibility1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ظهور الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile visibility" |
*
* @param {Settings_Privacy_Profilevisibility1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_profilevisibility1 = /** @type {((inputs?: Settings_Privacy_Profilevisibility1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Profilevisibility1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_profilevisibility1(inputs)
	if (locale === "es") return es_settings_privacy_profilevisibility1(inputs)
	if (locale === "fr") return fr_settings_privacy_profilevisibility1(inputs)
	return ar_settings_privacy_profilevisibility1(inputs)
});
export { settings_privacy_profilevisibility1 as "settings.privacy.profileVisibility" }