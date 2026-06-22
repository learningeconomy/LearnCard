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

const fr_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OU`)
};

const ar_login_social_or = /** @type {(inputs: Login_Social_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

/**
* | output |
* | --- |
* | "OR" |
*
* @param {Login_Social_OrInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_social_or = /** @type {((inputs?: Login_Social_OrInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Social_OrInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_social_or(inputs)
	if (locale === "es") return es_login_social_or(inputs)
	if (locale === "fr") return fr_login_social_or(inputs)
	return ar_login_social_or(inputs)
});
export { login_social_or as "login.social.or" }