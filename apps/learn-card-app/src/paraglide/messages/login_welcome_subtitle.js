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

const de_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Melde dich an, um auf deine Nachweise, Erfolge und mehr zuzugreifen.`)
};

const ar_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الدخول للوصول إلى بيانات الاعتماد والإنجازات والمزيد.`)
};

const fr_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour accéder à vos certifications, réalisations et plus.`)
};

const ko_login_welcome_subtitle = /** @type {(inputs: Login_Welcome_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그인하여 자격 증명, 성취도 등에 액세스하세요.`)
};

/**
* | output |
* | --- |
* | "Sign in to access your credentials, achievements, and more." |
*
* @param {Login_Welcome_SubtitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_welcome_subtitle = /** @type {((inputs?: Login_Welcome_SubtitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_SubtitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_subtitle(inputs)
	if (locale === "es") return es_login_welcome_subtitle(inputs)
	if (locale === "de") return de_login_welcome_subtitle(inputs)
	if (locale === "ar") return ar_login_welcome_subtitle(inputs)
	if (locale === "fr") return fr_login_welcome_subtitle(inputs)
	return ko_login_welcome_subtitle(inputs)
});
export { login_welcome_subtitle as "login.welcome.subtitle" }