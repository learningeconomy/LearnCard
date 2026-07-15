/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SignupInputs */

const en_boost_signup = /** @type {(inputs: Boost_SignupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signup`)
};

const es_boost_signup = /** @type {(inputs: Boost_SignupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registrarse`)
};

const fr_boost_signup = /** @type {(inputs: Boost_SignupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`S'inscrire`)
};

const ar_boost_signup = /** @type {(inputs: Boost_SignupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signup`)
};

/**
* | output |
* | --- |
* | "Signup" |
*
* @param {Boost_SignupInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_signup = /** @type {((inputs?: Boost_SignupInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SignupInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_signup(inputs)
	if (locale === "es") return es_boost_signup(inputs)
	if (locale === "fr") return fr_boost_signup(inputs)
	return ar_boost_signup(inputs)
});
export { boost_signup as "boost.signup" }