/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_flowstep25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User is redirected to LearnCard to grant consent`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_flowstep25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario es redirigido a LearnCard para otorgar consentimiento`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur est redirigé vers LearnCard pour accorder son consentement`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتم إعادة توجيه المستخدم إلى LearnCard لمنح الموافقة`)
};

/**
* | output |
* | --- |
* | "User is redirected to LearnCard to grant consent" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_flowstep25 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_flowstep25(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_flowstep25(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep25(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep25(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_flowstep25 as "developerPortal.guides.consentFlow.redirectHandlerStep.flowStep2" }