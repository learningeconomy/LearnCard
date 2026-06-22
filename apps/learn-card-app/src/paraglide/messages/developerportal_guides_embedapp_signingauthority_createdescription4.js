/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs */

const en_developerportal_guides_embedapp_signingauthority_createdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to sign credentials`)
};

const es_developerportal_guides_embedapp_signingauthority_createdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una para firmar credenciales`)
};

const fr_developerportal_guides_embedapp_signingauthority_createdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to sign credentials`)
};

const ar_developerportal_guides_embedapp_signingauthority_createdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء one to sign credentials`)
};

/**
* | output |
* | --- |
* | "Create one to sign credentials" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_createdescription4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Createdescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_createdescription4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_createdescription4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_createdescription4(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_createdescription4(inputs)
});
export { developerportal_guides_embedapp_signingauthority_createdescription4 as "developerPortal.guides.embedApp.signingAuthority.createDescription" }