/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Signinasadult4Inputs */

const en_aiinsights_signinasadult4 = /** @type {(inputs: Aiinsights_Signinasadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in as an adult`)
};

const es_aiinsights_signinasadult4 = /** @type {(inputs: Aiinsights_Signinasadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión como adulto`)
};

const fr_aiinsights_signinasadult4 = /** @type {(inputs: Aiinsights_Signinasadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter en tant qu'adulte`)
};

const ar_aiinsights_signinasadult4 = /** @type {(inputs: Aiinsights_Signinasadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول كشخص بالغ`)
};

/**
* | output |
* | --- |
* | "Sign in as an adult" |
*
* @param {Aiinsights_Signinasadult4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_signinasadult4 = /** @type {((inputs?: Aiinsights_Signinasadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Signinasadult4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_signinasadult4(inputs)
	if (locale === "es") return es_aiinsights_signinasadult4(inputs)
	if (locale === "fr") return fr_aiinsights_signinasadult4(inputs)
	return ar_aiinsights_signinasadult4(inputs)
});
export { aiinsights_signinasadult4 as "aiInsights.signInAsAdult" }