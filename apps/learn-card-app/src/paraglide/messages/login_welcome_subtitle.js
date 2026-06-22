/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Welcome_SubtitleInputs */

const en_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in to access your credentials, achievements, and more.`)
};

const es_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para acceder a tus credenciales, logros y más.`)
};

const fr_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour accéder à vos certifications, réalisations et plus.`)
};

const ar_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الدخول للوصول إلى بيانات الاعتماد والإنجازات والمزيد.`)
};

/**
* | output |
* | --- |
* | "Sign in to access your credentials, achievements, and more." |
*
* @param {Login_Welcome_SubtitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_welcome_subtitle = /** @type {((inputs?: Login_Welcome_SubtitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_SubtitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_subtitle(inputs)
	if (locale === "es") return es_login_welcome_subtitle(inputs)
	if (locale === "fr") return fr_login_welcome_subtitle(inputs)
	return ar_login_welcome_subtitle(inputs)
});
export { login_welcome_subtitle as "login.welcome.subtitle" }