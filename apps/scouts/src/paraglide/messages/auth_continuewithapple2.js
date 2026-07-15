/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Continuewithapple2Inputs */

const en_auth_continuewithapple2 = /** @type {(inputs: Auth_Continuewithapple2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue with Apple`)
};

const es_auth_continuewithapple2 = /** @type {(inputs: Auth_Continuewithapple2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar con Apple`)
};

const fr_auth_continuewithapple2 = /** @type {(inputs: Auth_Continuewithapple2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer avec Apple`)
};

const ar_auth_continuewithapple2 = /** @type {(inputs: Auth_Continuewithapple2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue with Apple`)
};

/**
* | output |
* | --- |
* | "Continue with Apple" |
*
* @param {Auth_Continuewithapple2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_continuewithapple2 = /** @type {((inputs?: Auth_Continuewithapple2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Continuewithapple2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_continuewithapple2(inputs)
	if (locale === "es") return es_auth_continuewithapple2(inputs)
	if (locale === "fr") return fr_auth_continuewithapple2(inputs)
	return ar_auth_continuewithapple2(inputs)
});
export { auth_continuewithapple2 as "auth.continueWithApple" }