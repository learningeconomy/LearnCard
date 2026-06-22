/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creates a cryptographic key pair for signing`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un par de claves criptográficas para firmar`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crée une paire de clés cryptographiques pour la signature`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينشئ زوج مفاتيح تشفيرية للتوقيع`)
};

/**
* | output |
* | --- |
* | "Creates a cryptographic key pair for signing" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem15(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_infoitem15 as "developerPortal.guides.issueCredentials.signingAuthorityStep.infoItem1" }