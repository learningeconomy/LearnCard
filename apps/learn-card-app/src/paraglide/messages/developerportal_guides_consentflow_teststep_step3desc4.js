/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs */

const en_developerportal_guides_consentflow_teststep_step3desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After receiving the callback, run the send command from your backend to issue a credential:`)
};

const es_developerportal_guides_consentflow_teststep_step3desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después de recibir la devolución, ejecuta el comando send desde tu backend para emitir una credencial:`)
};

const fr_developerportal_guides_consentflow_teststep_step3desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après avoir reçu le rappel, exécutez la commande send depuis votre backend pour émettre un certificat :`)
};

const ar_developerportal_guides_consentflow_teststep_step3desc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعد تلقي الاستدعاء، قم بتشغيل أمر الإرسال من الخادم الخلفي الخاص بك لإصدار مؤهل:`)
};

/**
* | output |
* | --- |
* | "After receiving the callback, run the send command from your backend to issue a credential:" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step3desc4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step3desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step3desc4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step3desc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step3desc4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step3desc4(inputs)
});
export { developerportal_guides_consentflow_teststep_step3desc4 as "developerPortal.guides.consentFlow.testStep.step3Desc" }