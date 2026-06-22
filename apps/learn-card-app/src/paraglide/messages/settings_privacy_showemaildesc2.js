/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Showemaildesc2Inputs */

const en_settings_privacy_showemaildesc2 = /** @type {(inputs: Settings_Privacy_Showemaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let connected users see your email address on your profile.`)
};

const es_settings_privacy_showemaildesc2 = /** @type {(inputs: Settings_Privacy_Showemaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que los usuarios conectados vean tu correo electrónico en tu perfil.`)
};

const fr_settings_privacy_showemaildesc2 = /** @type {(inputs: Settings_Privacy_Showemaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permettez aux utilisateurs connectés de voir votre adresse e-mail sur votre profil.`)
};

const ar_settings_privacy_showemaildesc2 = /** @type {(inputs: Settings_Privacy_Showemaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسمح للمستخدمين المتصلين بمشاهدة بريدك الإلكتروني على ملفك الشخصي.`)
};

/**
* | output |
* | --- |
* | "Let connected users see your email address on your profile." |
*
* @param {Settings_Privacy_Showemaildesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_showemaildesc2 = /** @type {((inputs?: Settings_Privacy_Showemaildesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Showemaildesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_showemaildesc2(inputs)
	if (locale === "es") return es_settings_privacy_showemaildesc2(inputs)
	if (locale === "fr") return fr_settings_privacy_showemaildesc2(inputs)
	return ar_settings_privacy_showemaildesc2(inputs)
});
export { settings_privacy_showemaildesc2 as "settings.privacy.showEmailDesc" }