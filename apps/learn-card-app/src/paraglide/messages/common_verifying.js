/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_VerifyingInputs */

const en_common_verifying = /** @type {(inputs: Common_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const es_common_verifying = /** @type {(inputs: Common_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const fr_common_verifying = /** @type {(inputs: Common_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ar_common_verifying = /** @type {(inputs: Common_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحقق...`)
};

/**
* | output |
* | --- |
* | "Verifying..." |
*
* @param {Common_VerifyingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_verifying = /** @type {((inputs?: Common_VerifyingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_VerifyingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_verifying(inputs)
	if (locale === "es") return es_common_verifying(inputs)
	if (locale === "fr") return fr_common_verifying(inputs)
	return ar_common_verifying(inputs)
});
export { common_verifying as "common.verifying" }