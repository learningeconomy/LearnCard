/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step5buildcred4Inputs */

const en_developerportal_integrationguide_consent_step5buildcred4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5buildcred4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build Your Credential`)
};

const es_developerportal_integrationguide_consent_step5buildcred4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5buildcred4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construye tu Credencial`)
};

const fr_developerportal_integrationguide_consent_step5buildcred4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5buildcred4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construire Votre Identifiant`)
};

const ar_developerportal_integrationguide_consent_step5buildcred4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5buildcred4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناء بيانات الاعتماد الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Build Your Credential" |
*
* @param {Developerportal_Integrationguide_Consent_Step5buildcred4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step5buildcred4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step5buildcred4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step5buildcred4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step5buildcred4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step5buildcred4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step5buildcred4(inputs)
	return ar_developerportal_integrationguide_consent_step5buildcred4(inputs)
});
export { developerportal_integrationguide_consent_step5buildcred4 as "developerPortal.integrationGuide.consent.step5BuildCred" }