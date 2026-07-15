/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Uidmismatch1Inputs */

const en_auth_uidmismatch1 = /** @type {(inputs: Auth_Uidmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You signed in with a different account. Please try again with the correct account.`)
};

const es_auth_uidmismatch1 = /** @type {(inputs: Auth_Uidmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciaste sesión con una cuenta diferente. Intenta de nuevo con la cuenta correcta.`)
};

const fr_auth_uidmismatch1 = /** @type {(inputs: Auth_Uidmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous vous êtes connecté avec un compte différent. Veuillez réessayer avec le bon compte.`)
};

const ar_auth_uidmismatch1 = /** @type {(inputs: Auth_Uidmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You signed in with a different account. Please try again with the correct account.`)
};

/**
* | output |
* | --- |
* | "You signed in with a different account. Please try again with the correct account." |
*
* @param {Auth_Uidmismatch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_uidmismatch1 = /** @type {((inputs?: Auth_Uidmismatch1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Uidmismatch1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_uidmismatch1(inputs)
	if (locale === "es") return es_auth_uidmismatch1(inputs)
	if (locale === "fr") return fr_auth_uidmismatch1(inputs)
	return ar_auth_uidmismatch1(inputs)
});
export { auth_uidmismatch1 as "auth.uidMismatch" }