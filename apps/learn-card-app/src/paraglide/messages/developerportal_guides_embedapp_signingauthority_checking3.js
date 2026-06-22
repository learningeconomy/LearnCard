/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs */

const en_developerportal_guides_embedapp_signingauthority_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const es_developerportal_guides_embedapp_signingauthority_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const fr_developerportal_guides_embedapp_signingauthority_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiering...`)
};

const ar_developerportal_guides_embedapp_signingauthority_checking3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحققing...`)
};

/**
* | output |
* | --- |
* | "Checking..." |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_checking3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Checking3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_checking3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_checking3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_checking3(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_checking3(inputs)
});
export { developerportal_guides_embedapp_signingauthority_checking3 as "developerPortal.guides.embedApp.signingAuthority.checking" }