/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step6title3Inputs */

const en_developerportal_integrationguide_consent_step6title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Additional Functions (Optional)`)
};

const es_developerportal_integrationguide_consent_step6title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Funciones Adicionales (Opcional)`)
};

const fr_developerportal_integrationguide_consent_step6title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctions Supplémentaires (Optionnel)`)
};

const ar_developerportal_integrationguide_consent_step6title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وظائف إضافية (اختياري)`)
};

/**
* | output |
* | --- |
* | "Additional Functions (Optional)" |
*
* @param {Developerportal_Integrationguide_Consent_Step6title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step6title3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step6title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step6title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step6title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step6title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step6title3(inputs)
	return ar_developerportal_integrationguide_consent_step6title3(inputs)
});
export { developerportal_integrationguide_consent_step6title3 as "developerPortal.integrationGuide.consent.step6Title" }