/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs */

const en_developerportal_guides_consentflow_teststep_step2desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After the user grants consent, LearnCard redirects them to your callback URL with these query parameters:`)
};

const es_developerportal_guides_consentflow_teststep_step2desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después de que el usuario otorga consentimiento, LearnCard los redirige a tu URL de devolución con estos parámetros de consulta:`)
};

const fr_developerportal_guides_consentflow_teststep_step2desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après que l'utilisateur a accordé son consentement, LearnCard le redirige vers votre URL de rappel avec ces paramètres de requête :`)
};

const ar_developerportal_guides_consentflow_teststep_step2desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعد منح المستخدم الموافقة، يعيد LearnCard توجيهه إلى عنوان URL الاستدعاء الخاص بك مع معلمات الاستعلام هذه:`)
};

/**
* | output |
* | --- |
* | "After the user grants consent, LearnCard redirects them to your callback URL with these query parameters:" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step2desc4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step2desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step2desc4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step2desc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step2desc4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step2desc4(inputs)
});
export { developerportal_guides_consentflow_teststep_step2desc4 as "developerPortal.guides.consentFlow.testStep.step2Desc" }