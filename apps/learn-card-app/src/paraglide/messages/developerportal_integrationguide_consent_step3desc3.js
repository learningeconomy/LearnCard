/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step3desc3Inputs */

const en_developerportal_integrationguide_consent_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate an API key to authenticate your backend with the LearnCard Network.`)
};

const es_developerportal_integrationguide_consent_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genera una clave de API para autenticar tu backend con la Red LearnCard.`)
};

const fr_developerportal_integrationguide_consent_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générez une clé d'API pour authentifier votre backend auprès du Réseau LearnCard.`)
};

const ar_developerportal_integrationguide_consent_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإنشاء مفتاح API لتوثيق خادمك الخلفي مع شبكة LearnCard.`)
};

/**
* | output |
* | --- |
* | "Generate an API key to authenticate your backend with the LearnCard Network." |
*
* @param {Developerportal_Integrationguide_Consent_Step3desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step3desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step3desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step3desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step3desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step3desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step3desc3(inputs)
	return ar_developerportal_integrationguide_consent_step3desc3(inputs)
});
export { developerportal_integrationguide_consent_step3desc3 as "developerPortal.integrationGuide.consent.step3Desc" }