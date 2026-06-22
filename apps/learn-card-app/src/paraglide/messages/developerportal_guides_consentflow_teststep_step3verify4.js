/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs */

const en_developerportal_guides_consentflow_teststep_step3verify4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify: The recipient should see the credential in their LearnCard wallet. Check the dashboard Connections tab to confirm delivery.`)
};

const es_developerportal_guides_consentflow_teststep_step3verify4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar: El destinatario debería ver la credencial en su billetera de LearnCard. Revisa la pestaña Conexiones del panel para confirmar la entrega.`)
};

const fr_developerportal_guides_consentflow_teststep_step3verify4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier : Le destinataire devrait voir le certificat dans son portefeuille LearnCard. Vérifiez l'onglet Connexions du tableau de bord pour confirmer la livraison.`)
};

const ar_developerportal_guides_consentflow_teststep_step3verify4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق: يجب أن يرى المستلم المؤهل في محفظة LearnCard الخاصة به. تحقق من علامة تبويب الاتصالات في لوحة التحكم لتأكيد التسليم.`)
};

/**
* | output |
* | --- |
* | "Verify: The recipient should see the credential in their LearnCard wallet. Check the dashboard Connections tab to confirm delivery." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step3verify4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step3verify4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step3verify4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step3verify4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step3verify4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step3verify4(inputs)
});
export { developerportal_guides_consentflow_teststep_step3verify4 as "developerPortal.guides.consentFlow.testStep.step3Verify" }