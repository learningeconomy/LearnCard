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

const de_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Steuere, wie dein ${i?.brand}-Profil für andere im Netzwerk sichtbar ist.`)
};

const ar_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تحكم في كيفية ظهور ملفك الشخصي على ${i?.brand} للآخرين في الشبكة.`)
};

const fr_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contrôlez la visibilité de votre profil ${i?.brand} auprès des autres membres du réseau.`)
};

const ko_settings_privacy_profileprivacydesc2 = /** @type {(inputs: Settings_Privacy_Profileprivacydesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`네트워크의 다른 사용자에게 ${i?.brand} 프로필이 표시되는 방식을 관리하세요.`)
};

/**
* | output |
* | --- |
* | "Control how your {brand} profile appears to others in the network." |
*
* @param {Settings_Privacy_Profileprivacydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_profileprivacydesc2 = /** @type {((inputs: Settings_Privacy_Profileprivacydesc2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Profileprivacydesc2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "es") return es_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "de") return de_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "ar") return ar_settings_privacy_profileprivacydesc2(inputs)
	if (locale === "fr") return fr_settings_privacy_profileprivacydesc2(inputs)
	return ko_settings_privacy_profileprivacydesc2(inputs)
});
export { settings_privacy_profileprivacydesc2 as "settings.privacy.profilePrivacyDesc" }