/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Description3Inputs */

const en_developerportal_guides_embedclaim_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify your configuration and preview the claim button your users will see.`)
};

const es_developerportal_guides_embedclaim_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica tu configuración y previsualiza el botón de reclamo que verán tus usuarios.`)
};

const fr_developerportal_guides_embedclaim_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez votre configuration et prévisualisez le bouton de réclamation que vos utilisateurs verront.`)
};

const ar_developerportal_guides_embedclaim_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من تكوينك واعرض معاينة لزر المطالبة الذي سيراه المستخدمون.`)
};

/**
* | output |
* | --- |
* | "Verify your configuration and preview the claim button your users will see." |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_description3 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_description3(inputs)
	return ar_developerportal_guides_embedclaim_teststep_description3(inputs)
});
export { developerportal_guides_embedclaim_teststep_description3 as "developerPortal.guides.embedClaim.testStep.description" }