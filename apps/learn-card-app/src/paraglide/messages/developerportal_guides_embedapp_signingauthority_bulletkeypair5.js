/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs */

const en_developerportal_guides_embedapp_signingauthority_bulletkeypair5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creates a cryptographic key pair for signing`)
};

const es_developerportal_guides_embedapp_signingauthority_bulletkeypair5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un par de claves criptográficas para firmar`)
};

const fr_developerportal_guides_embedapp_signingauthority_bulletkeypair5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creates a cryptographic key pair for signing`)
};

const ar_developerportal_guides_embedapp_signingauthority_bulletkeypair5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاءs a cryptographic key pair for signing`)
};

/**
* | output |
* | --- |
* | "Creates a cryptographic key pair for signing" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_bulletkeypair5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Bulletkeypair5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_bulletkeypair5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_bulletkeypair5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_bulletkeypair5(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_bulletkeypair5(inputs)
});
export { developerportal_guides_embedapp_signingauthority_bulletkeypair5 as "developerPortal.guides.embedApp.signingAuthority.bulletKeyPair" }