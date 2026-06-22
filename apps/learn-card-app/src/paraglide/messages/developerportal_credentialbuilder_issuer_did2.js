/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Issuer_Did2Inputs */

const en_developerportal_credentialbuilder_issuer_did2 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Did2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer (DID)`)
};

const es_developerportal_credentialbuilder_issuer_did2 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Did2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor (DID)`)
};

const fr_developerportal_credentialbuilder_issuer_did2 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Did2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur (DID)`)
};

const ar_developerportal_credentialbuilder_issuer_did2 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Did2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المصدر (DID)`)
};

/**
* | output |
* | --- |
* | "Issuer (DID)" |
*
* @param {Developerportal_Credentialbuilder_Issuer_Did2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_issuer_did2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Issuer_Did2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Issuer_Did2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_issuer_did2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_issuer_did2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_issuer_did2(inputs)
	return ar_developerportal_credentialbuilder_issuer_did2(inputs)
});
export { developerportal_credentialbuilder_issuer_did2 as "developerPortal.credentialBuilder.issuer.did" }