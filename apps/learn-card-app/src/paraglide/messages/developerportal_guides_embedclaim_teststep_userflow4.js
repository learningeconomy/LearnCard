/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs */

const en_developerportal_guides_embedclaim_teststep_userflow4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User Experience Flow`)
};

const es_developerportal_guides_embedclaim_teststep_userflow4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de Experiencia de Usuario`)
};

const fr_developerportal_guides_embedclaim_teststep_userflow4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux d'Expérience Utilisateur`)
};

const ar_developerportal_guides_embedclaim_teststep_userflow4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق تجربة المستخدم`)
};

/**
* | output |
* | --- |
* | "User Experience Flow" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflow4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflow4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflow4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflow4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflow4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflow4(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflow4 as "developerPortal.guides.embedClaim.testStep.userFlow" }