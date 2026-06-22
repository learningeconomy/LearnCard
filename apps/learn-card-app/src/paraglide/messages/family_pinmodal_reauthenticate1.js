/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Reauthenticate1Inputs */

const en_family_pinmodal_reauthenticate1 = /** @type {(inputs: Family_Pinmodal_Reauthenticate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reauthenticate`)
};

const es_family_pinmodal_reauthenticate1 = /** @type {(inputs: Family_Pinmodal_Reauthenticate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a autenticar`)
};

const fr_family_pinmodal_reauthenticate1 = /** @type {(inputs: Family_Pinmodal_Reauthenticate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se réauthentifier`)
};

const ar_family_pinmodal_reauthenticate1 = /** @type {(inputs: Family_Pinmodal_Reauthenticate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة المصادقة`)
};

/**
* | output |
* | --- |
* | "Reauthenticate" |
*
* @param {Family_Pinmodal_Reauthenticate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_reauthenticate1 = /** @type {((inputs?: Family_Pinmodal_Reauthenticate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Reauthenticate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_reauthenticate1(inputs)
	if (locale === "es") return es_family_pinmodal_reauthenticate1(inputs)
	if (locale === "fr") return fr_family_pinmodal_reauthenticate1(inputs)
	return ar_family_pinmodal_reauthenticate1(inputs)
});
export { family_pinmodal_reauthenticate1 as "family.pinModal.reauthenticate" }