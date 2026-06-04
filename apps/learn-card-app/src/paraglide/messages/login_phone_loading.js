/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_LoadingInputs */

const en_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const de_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird geladen...`)
};

const ar_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

const fr_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_login_phone_loading = /** @type {(inputs: Login_Phone_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로딩 중...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Login_Phone_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_loading = /** @type {((inputs?: Login_Phone_LoadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_LoadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_loading(inputs)
	if (locale === "es") return es_login_phone_loading(inputs)
	if (locale === "de") return de_login_phone_loading(inputs)
	if (locale === "ar") return ar_login_phone_loading(inputs)
	if (locale === "fr") return fr_login_phone_loading(inputs)
	return ko_login_phone_loading(inputs)
});
export { login_phone_loading as "login.phone.loading" }