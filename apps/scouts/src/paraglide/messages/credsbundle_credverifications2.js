/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Credverifications2Inputs */

const en_credsbundle_credverifications2 = /** @type {(inputs: Credsbundle_Credverifications2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Verifications`)
};

const es_credsbundle_credverifications2 = /** @type {(inputs: Credsbundle_Credverifications2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaciones de Credencial`)
};

const fr_credsbundle_credverifications2 = /** @type {(inputs: Credsbundle_Credverifications2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifications du justificatif`)
};

const ar_credsbundle_credverifications2 = /** @type {(inputs: Credsbundle_Credverifications2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من المؤهلات`)
};

/**
* | output |
* | --- |
* | "Credential Verifications" |
*
* @param {Credsbundle_Credverifications2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_credverifications2 = /** @type {((inputs?: Credsbundle_Credverifications2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Credverifications2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_credverifications2(inputs)
	if (locale === "es") return es_credsbundle_credverifications2(inputs)
	if (locale === "fr") return fr_credsbundle_credverifications2(inputs)
	return ar_credsbundle_credverifications2(inputs)
});
export { credsbundle_credverifications2 as "credsBundle.credVerifications" }