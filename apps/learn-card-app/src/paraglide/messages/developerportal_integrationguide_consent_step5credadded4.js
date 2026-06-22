/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step5credadded4Inputs */

const en_developerportal_integrationguide_consent_step5credadded4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5credadded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom credential added to code below`)
};

const es_developerportal_integrationguide_consent_step5credadded4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5credadded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial personalizada añadida al código siguiente`)
};

const fr_developerportal_integrationguide_consent_step5credadded4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5credadded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant personnalisé ajouté au code ci-dessous`)
};

const ar_developerportal_integrationguide_consent_step5credadded4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5credadded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة بيانات اعتماد مخصصة إلى الكود أدناه`)
};

/**
* | output |
* | --- |
* | "Custom credential added to code below" |
*
* @param {Developerportal_Integrationguide_Consent_Step5credadded4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step5credadded4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step5credadded4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step5credadded4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step5credadded4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step5credadded4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step5credadded4(inputs)
	return ar_developerportal_integrationguide_consent_step5credadded4(inputs)
});
export { developerportal_integrationguide_consent_step5credadded4 as "developerPortal.integrationGuide.consent.step5CredAdded" }