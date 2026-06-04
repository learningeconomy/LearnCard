/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Social_OrInputs */

const en_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OR`)
};

const es_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O`)
};

const de_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ODER`)
};

const ar_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

const fr_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OU`)
};

const ko_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`또는`)
};

/**
* | output |
* | --- |
* | "OR" |
*
* @param {Login_Social_OrInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_social_or = /** @type {((inputs?: Login_Social_OrInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Social_OrInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_social_or(inputs)
	if (locale === "es") return es_login_social_or(inputs)
	if (locale === "de") return de_login_social_or(inputs)
	if (locale === "ar") return ar_login_social_or(inputs)
	if (locale === "fr") return fr_login_social_or(inputs)
	return ko_login_social_or(inputs)
});
export { login_social_or as "login.social.or" }