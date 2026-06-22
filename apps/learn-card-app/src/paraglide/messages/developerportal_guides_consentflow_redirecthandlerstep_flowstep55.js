/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_flowstep55 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When ready, your backend issues credentials to that DID`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_flowstep55 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando esté listo, tu backend emite credenciales a ese DID`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep55 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand il est prêt, votre backend émet des certificats vers ce DID`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep55 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عند الاستعداد، يصدر الخادم الخلفي الخاص بك مؤهلات إلى ذلك DID`)
};

/**
* | output |
* | --- |
* | "When ready, your backend issues credentials to that DID" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_flowstep55 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Flowstep55Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_flowstep55(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_flowstep55(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_flowstep55(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_flowstep55(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_flowstep55 as "developerPortal.guides.consentFlow.redirectHandlerStep.flowStep5" }