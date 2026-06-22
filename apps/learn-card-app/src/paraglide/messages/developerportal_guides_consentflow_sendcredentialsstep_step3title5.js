/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step3title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Query Consent Data (Optional)`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step3title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultar Datos de Consentimiento (Opcional)`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step3title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Interroger les Données de Consentement (Facultatif)`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step3title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاستعلام عن بيانات الموافقة (اختياري)`)
};

/**
* | output |
* | --- |
* | "Query Consent Data (Optional)" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step3title5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step3title5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step3title5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step3title5(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step3title5(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step3title5 as "developerPortal.guides.consentFlow.sendCredentialsStep.step3Title" }