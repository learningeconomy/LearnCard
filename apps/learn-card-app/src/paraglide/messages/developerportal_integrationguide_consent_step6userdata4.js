/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step6userdata4Inputs */

const en_developerportal_integrationguide_consent_step6userdata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6userdata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get consent data for a specific user:`)
};

const es_developerportal_integrationguide_consent_step6userdata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6userdata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener datos de consentimiento para un usuario específico:`)
};

const fr_developerportal_integrationguide_consent_step6userdata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6userdata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir les données de consentement pour un utilisateur spécifique :`)
};

const ar_developerportal_integrationguide_consent_step6userdata4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6userdata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على بيانات الموافقة لمستخدم محدد:`)
};

/**
* | output |
* | --- |
* | "Get consent data for a specific user:" |
*
* @param {Developerportal_Integrationguide_Consent_Step6userdata4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step6userdata4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step6userdata4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step6userdata4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step6userdata4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step6userdata4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step6userdata4(inputs)
	return ar_developerportal_integrationguide_consent_step6userdata4(inputs)
});
export { developerportal_integrationguide_consent_step6userdata4 as "developerPortal.integrationGuide.consent.step6UserData" }