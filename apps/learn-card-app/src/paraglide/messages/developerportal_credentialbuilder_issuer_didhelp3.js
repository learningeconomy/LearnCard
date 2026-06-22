/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs */

const en_developerportal_credentialbuilder_issuer_didhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your organization's Decentralized Identifier (DID) from your LearnCard wallet`)
};

const es_developerportal_credentialbuilder_issuer_didhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El Identificador Descentralizado (DID) de tu organización desde tu cartera LearnCard`)
};

const fr_developerportal_credentialbuilder_issuer_didhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'identifiant décentralisé (DID) de votre organisation depuis votre portefeuille LearnCard`)
};

const ar_developerportal_credentialbuilder_issuer_didhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعرف اللامركزي (DID) لمؤسستك من محفظة LearnCard الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Your organization's Decentralized Identifier (DID) from your LearnCard wallet" |
*
* @param {Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_issuer_didhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Issuer_Didhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_issuer_didhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_issuer_didhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_issuer_didhelp3(inputs)
	return ar_developerportal_credentialbuilder_issuer_didhelp3(inputs)
});
export { developerportal_credentialbuilder_issuer_didhelp3 as "developerPortal.credentialBuilder.issuer.didHelp" }