/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step6alldata4Inputs */

const en_developerportal_integrationguide_consent_step6alldata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6alldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get all consented data for your contract:`)
};

const es_developerportal_integrationguide_consent_step6alldata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6alldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener todos los datos consentidos para tu contrato:`)
};

const fr_developerportal_integrationguide_consent_step6alldata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6alldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir toutes les données consenties pour votre contrat :`)
};

const ar_developerportal_integrationguide_consent_step6alldata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6alldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على جميع البيانات الموافق عليها لعقدك:`)
};

/**
* | output |
* | --- |
* | "Get all consented data for your contract:" |
*
* @param {Developerportal_Integrationguide_Consent_Step6alldata4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step6alldata4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step6alldata4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step6alldata4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step6alldata4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step6alldata4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step6alldata4(inputs)
	return ar_developerportal_integrationguide_consent_step6alldata4(inputs)
});
export { developerportal_integrationguide_consent_step6alldata4 as "developerPortal.integrationGuide.consent.step6AllData" }