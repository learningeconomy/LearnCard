/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs */

const en_developerportal_guides_embedapp_signingauthority_recreating3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreating...`)
};

const es_developerportal_guides_embedapp_signingauthority_recreating3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreando...`)
};

const fr_developerportal_guides_embedapp_signingauthority_recreating3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recréation...`)
};

const ar_developerportal_guides_embedapp_signingauthority_recreating3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreating...`)
};

/**
* | output |
* | --- |
* | "Recreating..." |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_recreating3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Recreating3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_recreating3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_recreating3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_recreating3(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_recreating3(inputs)
});
export { developerportal_guides_embedapp_signingauthority_recreating3 as "developerPortal.guides.embedApp.signingAuthority.recreating" }