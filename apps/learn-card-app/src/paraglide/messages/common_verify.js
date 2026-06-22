/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_VerifyInputs */

const en_common_verify = /** @type {(inputs: Common_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify`)
};

const es_common_verify = /** @type {(inputs: Common_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar`)
};

const fr_common_verify = /** @type {(inputs: Common_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier`)
};

const ar_common_verify = /** @type {(inputs: Common_VerifyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق`)
};

/**
* | output |
* | --- |
* | "Verify" |
*
* @param {Common_VerifyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_verify = /** @type {((inputs?: Common_VerifyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_VerifyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_verify(inputs)
	if (locale === "es") return es_common_verify(inputs)
	if (locale === "fr") return fr_common_verify(inputs)
	return ar_common_verify(inputs)
});
export { common_verify as "common.verify" }