/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Verifying1Inputs */

const en_family_pinmodal_verifying1 = /** @type {(inputs: Family_Pinmodal_Verifying1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const es_family_pinmodal_verifying1 = /** @type {(inputs: Family_Pinmodal_Verifying1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const fr_family_pinmodal_verifying1 = /** @type {(inputs: Family_Pinmodal_Verifying1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ar_family_pinmodal_verifying1 = /** @type {(inputs: Family_Pinmodal_Verifying1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق...`)
};

/**
* | output |
* | --- |
* | "Verifying..." |
*
* @param {Family_Pinmodal_Verifying1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_verifying1 = /** @type {((inputs?: Family_Pinmodal_Verifying1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Verifying1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_verifying1(inputs)
	if (locale === "es") return es_family_pinmodal_verifying1(inputs)
	if (locale === "fr") return fr_family_pinmodal_verifying1(inputs)
	return ar_family_pinmodal_verifying1(inputs)
});
export { family_pinmodal_verifying1 as "family.pinModal.verifying" }