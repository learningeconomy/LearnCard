/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs */

const en_developerportal_guides_embedapp_signingauthority_bulletregister4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registers the key with LearnCard's verification network`)
};

const es_developerportal_guides_embedapp_signingauthority_bulletregister4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registra la clave en la red de verificación de LearnCard`)
};

const fr_developerportal_guides_embedapp_signingauthority_bulletregister4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registers the key with LearnCard's verification network`)
};

const ar_developerportal_guides_embedapp_signingauthority_bulletregister4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registers the key with LearnCard's verification network`)
};

/**
* | output |
* | --- |
* | "Registers the key with LearnCard's verification network" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_bulletregister4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Bulletregister4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_bulletregister4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_bulletregister4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_bulletregister4(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_bulletregister4(inputs)
});
export { developerportal_guides_embedapp_signingauthority_bulletregister4 as "developerPortal.guides.embedApp.signingAuthority.bulletRegister" }