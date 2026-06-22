/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Initiate_DescriptionInputs */

const en_claim_initiate_description = /** @type {(inputs: Claim_Initiate_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click the button below to begin the exchange process.`)
};

const es_claim_initiate_description = /** @type {(inputs: Claim_Initiate_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic en el botón de abajo para comenzar el proceso de intercambio.`)
};

const fr_claim_initiate_description = /** @type {(inputs: Claim_Initiate_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez sur le bouton ci-dessous pour démarrer le processus d'échange.`)
};

const ar_claim_initiate_description = /** @type {(inputs: Claim_Initiate_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر على الزر أدناه لبدء عملية التبادل.`)
};

/**
* | output |
* | --- |
* | "Click the button below to begin the exchange process." |
*
* @param {Claim_Initiate_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_initiate_description = /** @type {((inputs?: Claim_Initiate_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Initiate_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_initiate_description(inputs)
	if (locale === "es") return es_claim_initiate_description(inputs)
	if (locale === "fr") return fr_claim_initiate_description(inputs)
	return ar_claim_initiate_description(inputs)
});
export { claim_initiate_description as "claim.initiate.description" }