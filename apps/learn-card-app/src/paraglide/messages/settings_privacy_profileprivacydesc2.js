/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Settings_Privacy_Profileprivacydesc2Inputs */

const en_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Control how your ${i?.brand} profile appears to others in the network.`)
};

const es_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Controla cómo aparece tu perfil de ${i?.brand} ante otros en la red.`)
};

const fr_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contrôlez la visibilité de votre profil ${i?.brand} auprès des autres membres du réseau.`)
};

const ar_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تحكم في كيفية ظهور ملفك الشخصي على ${i?.brand} للآخرين في الشبكة.`)
};

/**
* | output |
* | --- |
* | "Control how your {brand} profile appears to others in the network." |
*
* @param {Settings_Privacy_Profileprivacydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_profileprivacydesc2 = /** @type {((inputs: Settings_Privacy_Profileprivacydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Profileprivacydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "es") return es_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "fr") return fr_settings_privacy_profileprivacydesc2(inputs)
	return ar_settings_privacy_profileprivacydesc2(inputs)
});
export { settings_privacy_profileprivacydesc2 as "settings.privacy.profilePrivacyDesc" }