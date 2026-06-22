/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_copiedbutton5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied!`)
};

const es_developerportal_guides_consentflow_apisetupstep_copiedbutton5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Copiado!`)
};

const fr_developerportal_guides_consentflow_apisetupstep_copiedbutton5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié !`)
};

const ar_developerportal_guides_consentflow_apisetupstep_copiedbutton5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ!`)
};

/**
* | output |
* | --- |
* | "Copied!" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_copiedbutton5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Copiedbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_copiedbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_copiedbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_copiedbutton5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_copiedbutton5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_copiedbutton5 as "developerPortal.guides.consentFlow.apiSetupStep.copiedButton" }