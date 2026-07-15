/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Continuewithgoogle2Inputs */

const en_auth_continuewithgoogle2 = /** @type {(inputs: Auth_Continuewithgoogle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue with Google`)
};

const es_auth_continuewithgoogle2 = /** @type {(inputs: Auth_Continuewithgoogle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar con Google`)
};

const fr_auth_continuewithgoogle2 = /** @type {(inputs: Auth_Continuewithgoogle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer avec Google`)
};

const ar_auth_continuewithgoogle2 = /** @type {(inputs: Auth_Continuewithgoogle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue with Google`)
};

/**
* | output |
* | --- |
* | "Continue with Google" |
*
* @param {Auth_Continuewithgoogle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_continuewithgoogle2 = /** @type {((inputs?: Auth_Continuewithgoogle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Continuewithgoogle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_continuewithgoogle2(inputs)
	if (locale === "es") return es_auth_continuewithgoogle2(inputs)
	if (locale === "fr") return fr_auth_continuewithgoogle2(inputs)
	return ar_auth_continuewithgoogle2(inputs)
});
export { auth_continuewithgoogle2 as "auth.continueWithGoogle" }