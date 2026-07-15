/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sociallogins_Or1Inputs */

const en_sociallogins_or1 = /** @type {(inputs: Sociallogins_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OR`)
};

const es_sociallogins_or1 = /** @type {(inputs: Sociallogins_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O`)
};

const fr_sociallogins_or1 = /** @type {(inputs: Sociallogins_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OU`)
};

const ar_sociallogins_or1 = /** @type {(inputs: Sociallogins_Or1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

/**
* | output |
* | --- |
* | "OR" |
*
* @param {Sociallogins_Or1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sociallogins_or1 = /** @type {((inputs?: Sociallogins_Or1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sociallogins_Or1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sociallogins_or1(inputs)
	if (locale === "es") return es_sociallogins_or1(inputs)
	if (locale === "fr") return fr_sociallogins_or1(inputs)
	return ar_sociallogins_or1(inputs)
});
export { sociallogins_or1 as "socialLogins.or" }