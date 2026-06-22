/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_flowstep45 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your backend stores the user's DID`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_flowstep45 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu backend almacena el DID del usuario`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep45 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre backend stocke le DID de l'utilisateur`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep45 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يقوم الخادم الخلفي الخاص بك بتخزين DID المستخدم`)
};

/**
* | output |
* | --- |
* | "Your backend stores the user's DID" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_flowstep45 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep45Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_flowstep45(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_flowstep45(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep45(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep45(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_flowstep45 as "developerPortal.guides.consentFlow.redirectHandlerStep.flowStep4" }