/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs */

const en_developerportal_guides_consentflow_teststep_step1desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click the button below to test the consent redirect with your actual contract and callback URL. You should be redirected to LearnCard to grant consent, then back to your callback URL.`)
};

const es_developerportal_guides_consentflow_teststep_step1desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic en el botón de abajo para probar la redirección de consentimiento con tu contrato y URL de devolución actuales. Serás redirigido a LearnCard para otorgar consentimiento, y luego de vuelta a tu URL de devolución.`)
};

const fr_developerportal_guides_consentflow_teststep_step1desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez sur le bouton ci-dessous pour tester la redirection de consentement avec votre contrat et votre URL de rappel réels. Vous serez redirigé vers LearnCard pour accorder votre consentement, puis de retour vers votre URL de rappel.`)
};

const ar_developerportal_guides_consentflow_teststep_step1desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر على الزر أدناه لاختبار إعادة توجيه الموافقة مع العقد الفعلي وعنوان URL الاستدعاء الخاص بك. ستتم إعادة توجيهك إلى LearnCard لمنح الموافقة، ثم العودة إلى عنوان URL الاستدعاء الخاص بك.`)
};

/**
* | output |
* | --- |
* | "Click the button below to test the consent redirect with your actual contract and callback URL. You should be redirected to LearnCard to grant consent, then ..." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step1desc4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step1desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step1desc4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step1desc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step1desc4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step1desc4(inputs)
});
export { developerportal_guides_consentflow_teststep_step1desc4 as "developerPortal.guides.consentFlow.testStep.step1Desc" }