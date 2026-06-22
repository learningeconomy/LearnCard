/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Forgottitle2Inputs */

const en_family_pinmodal_forgottitle2 = /** @type {(inputs: Family_Pinmodal_Forgottitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Forgot PIN?`)
};

const es_family_pinmodal_forgottitle2 = /** @type {(inputs: Family_Pinmodal_Forgottitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Olvidaste tu PIN?`)
};

const fr_family_pinmodal_forgottitle2 = /** @type {(inputs: Family_Pinmodal_Forgottitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code PIN oublié ?`)
};

const ar_family_pinmodal_forgottitle2 = /** @type {(inputs: Family_Pinmodal_Forgottitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل نسيت رقم التعريف؟`)
};

/**
* | output |
* | --- |
* | "Forgot PIN?" |
*
* @param {Family_Pinmodal_Forgottitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_forgottitle2 = /** @type {((inputs?: Family_Pinmodal_Forgottitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Forgottitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_forgottitle2(inputs)
	if (locale === "es") return es_family_pinmodal_forgottitle2(inputs)
	if (locale === "fr") return fr_family_pinmodal_forgottitle2(inputs)
	return ar_family_pinmodal_forgottitle2(inputs)
});
export { family_pinmodal_forgottitle2 as "family.pinModal.forgotTitle" }