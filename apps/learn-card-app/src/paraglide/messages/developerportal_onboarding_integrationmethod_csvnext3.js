/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs */

const en_developerportal_onboarding_integrationmethod_csvnext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll provide a CSV template with the fields from your credential templates. Upload completed spreadsheets to issue credentials in bulk.`)
};

const es_developerportal_onboarding_integrationmethod_csvnext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te proporcionaremos una plantilla CSV con los campos de tus plantillas de credenciales. Sube hojas de cálculo completadas para emitir credenciales en masa.`)
};

const fr_developerportal_onboarding_integrationmethod_csvnext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous vous fournirons un modèle CSV avec les champs de vos modèles de credentials. Téléchargez les feuilles de calcul complétées pour émettre des credentials en masse.`)
};

const ar_developerportal_onboarding_integrationmethod_csvnext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنزودك بقالب CSV مع الحقول من قوالب بيانات الاعتماد الخاصة بك. قم برفع جداول البيانات المكتملة لإصدار بيانات الاعتماد بكميات كبيرة.`)
};

/**
* | output |
* | --- |
* | "We'll provide a CSV template with the fields from your credential templates. Upload completed spreadsheets to issue credentials in bulk." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_csvnext3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Csvnext3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_csvnext3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_csvnext3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_csvnext3(inputs)
	return ar_developerportal_onboarding_integrationmethod_csvnext3(inputs)
});
export { developerportal_onboarding_integrationmethod_csvnext3 as "developerPortal.onboarding.integrationMethod.csvNext" }