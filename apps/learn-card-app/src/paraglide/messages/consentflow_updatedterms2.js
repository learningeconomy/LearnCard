/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Updatedterms2Inputs */

const en_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have updated your terms.`)
};

const es_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has actualizado tus términos.`)
};

const fr_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez mis à jour vos conditions.`)
};

const ar_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد قمت بتحديث شروطك.`)
};

/**
* | output |
* | --- |
* | "You have updated your terms." |
*
* @param {Consentflow_Updatedterms2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_updatedterms2 = /** @type {((inputs?: Consentflow_Updatedterms2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Updatedterms2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_updatedterms2(inputs)
	if (locale === "es") return es_consentflow_updatedterms2(inputs)
	if (locale === "fr") return fr_consentflow_updatedterms2(inputs)
	return ar_consentflow_updatedterms2(inputs)
});
export { consentflow_updatedterms2 as "consentFlow.updatedTerms" }