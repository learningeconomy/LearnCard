/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs */

const en_developerportal_components_integrationguide_consent_step1selectcontractdesc5 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract above to see your URI here.`)
};

const es_developerportal_components_integrationguide_consent_step1selectcontractdesc5 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un contrato de consentimiento arriba para ver tu URI aquí.`)
};

const fr_developerportal_components_integrationguide_consent_step1selectcontractdesc5 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un contrat de flux de consentement ci-dessus pour voir votre URI ici.`)
};

const ar_developerportal_components_integrationguide_consent_step1selectcontractdesc5 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر عقد تدفق الموافقة أعلاه لرؤية رابط URI الخاص بك هنا.`)
};

/**
* | output |
* | --- |
* | "Select a consent flow contract above to see your URI here." |
*
* @param {Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationguide_consent_step1selectcontractdesc5 = /** @type {((inputs?: Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationguide_Consent_Step1selectcontractdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationguide_consent_step1selectcontractdesc5(inputs)
	if (locale === "es") return es_developerportal_components_integrationguide_consent_step1selectcontractdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationguide_consent_step1selectcontractdesc5(inputs)
	return ar_developerportal_components_integrationguide_consent_step1selectcontractdesc5(inputs)
});
export { developerportal_components_integrationguide_consent_step1selectcontractdesc5 as "developerPortal.components.integrationGuide.consent.step1SelectContractDesc" }