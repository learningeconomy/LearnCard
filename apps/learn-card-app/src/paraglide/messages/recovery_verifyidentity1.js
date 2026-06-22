/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Verifyidentity1Inputs */

const en_recovery_verifyidentity1 = /** @type {(inputs: Recovery_Verifyidentity1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Identity`)
};

const es_recovery_verifyidentity1 = /** @type {(inputs: Recovery_Verifyidentity1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica tu identidad`)
};

const fr_recovery_verifyidentity1 = /** @type {(inputs: Recovery_Verifyidentity1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez votre identité`)
};

const ar_recovery_verifyidentity1 = /** @type {(inputs: Recovery_Verifyidentity1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من هويتك`)
};

/**
* | output |
* | --- |
* | "Verify Your Identity" |
*
* @param {Recovery_Verifyidentity1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_verifyidentity1 = /** @type {((inputs?: Recovery_Verifyidentity1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Verifyidentity1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verifyidentity1(inputs)
	if (locale === "es") return es_recovery_verifyidentity1(inputs)
	if (locale === "fr") return fr_recovery_verifyidentity1(inputs)
	return ar_recovery_verifyidentity1(inputs)
});
export { recovery_verifyidentity1 as "recovery.verifyIdentity" }