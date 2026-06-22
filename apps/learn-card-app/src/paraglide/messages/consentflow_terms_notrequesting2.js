/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Consentflow_Terms_Notrequesting2Inputs */

const en_consentflow_terms_notrequesting2 = /** @type {(inputs: Consentflow_Terms_Notrequesting2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`is not requesting to read or write anything to your ${i?.brand}`)
};

const es_consentflow_terms_notrequesting2 = /** @type {(inputs: Consentflow_Terms_Notrequesting2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`no está solicitando leer ni escribir nada en tu ${i?.brand}`)
};

const fr_consentflow_terms_notrequesting2 = /** @type {(inputs: Consentflow_Terms_Notrequesting2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ne demande à lire ni à écrire quoi que ce soit dans votre ${i?.brand}`)
};

const ar_consentflow_terms_notrequesting2 = /** @type {(inputs: Consentflow_Terms_Notrequesting2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا يطلب قراءة أو كتابة أي شيء في ${i?.brand} الخاص بك`)
};

/**
* | output |
* | --- |
* | "is not requesting to read or write anything to your {brand}" |
*
* @param {Consentflow_Terms_Notrequesting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_notrequesting2 = /** @type {((inputs: Consentflow_Terms_Notrequesting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Terms_Notrequesting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_terms_notrequesting2(inputs)
	if (locale === "es") return es_consentflow_terms_notrequesting2(inputs)
	if (locale === "fr") return fr_consentflow_terms_notrequesting2(inputs)
	return ar_consentflow_terms_notrequesting2(inputs)
});
export { consentflow_terms_notrequesting2 as "consentFlow.terms.notRequesting" }