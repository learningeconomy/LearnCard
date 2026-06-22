/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Profilevisibilitydesc2Inputs */

const en_settings_privacy_profilevisibilitydesc2 = /** @type {(inputs: Settings_Privacy_Profilevisibilitydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose who can view the details on your profile.`)
};

const es_settings_privacy_profilevisibilitydesc2 = /** @type {(inputs: Settings_Privacy_Profilevisibilitydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige quién puede ver los detalles de tu perfil.`)
};

const fr_settings_privacy_profilevisibilitydesc2 = /** @type {(inputs: Settings_Privacy_Profilevisibilitydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez qui peut voir les détails de votre profil.`)
};

const ar_settings_privacy_profilevisibilitydesc2 = /** @type {(inputs: Settings_Privacy_Profilevisibilitydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر من يمكنه مشاهدة تفاصيل ملفك الشخصي.`)
};

/**
* | output |
* | --- |
* | "Choose who can view the details on your profile." |
*
* @param {Settings_Privacy_Profilevisibilitydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_profilevisibilitydesc2 = /** @type {((inputs?: Settings_Privacy_Profilevisibilitydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Profilevisibilitydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_profilevisibilitydesc2(inputs)
	if (locale === "es") return es_settings_privacy_profilevisibilitydesc2(inputs)
	if (locale === "fr") return fr_settings_privacy_profilevisibilitydesc2(inputs)
	return ar_settings_privacy_profilevisibilitydesc2(inputs)
});
export { settings_privacy_profilevisibilitydesc2 as "settings.privacy.profileVisibilityDesc" }