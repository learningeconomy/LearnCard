/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs */

const en_developerportal_guides_embedapp_signingauthority_appissuerdid5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App issuer DID`)
};

const es_developerportal_guides_embedapp_signingauthority_appissuerdid5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID del emisor de la aplicación`)
};

const fr_developerportal_guides_embedapp_signingauthority_appissuerdid5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID de l'émetteur de l'app`)
};

const ar_developerportal_guides_embedapp_signingauthority_appissuerdid5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App issuer DID`)
};

/**
* | output |
* | --- |
* | "App issuer DID" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_appissuerdid5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Appissuerdid5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_appissuerdid5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_appissuerdid5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_appissuerdid5(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_appissuerdid5(inputs)
});
export { developerportal_guides_embedapp_signingauthority_appissuerdid5 as "developerPortal.guides.embedApp.signingAuthority.appIssuerDid" }