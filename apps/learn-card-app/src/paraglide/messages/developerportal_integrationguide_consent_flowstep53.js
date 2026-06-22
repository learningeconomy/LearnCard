/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Flowstep53Inputs */

const en_developerportal_integrationguide_consent_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When ready, your backend issues credentials to that DID`)
};

const es_developerportal_integrationguide_consent_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando esté listo, tu backend emite credenciales a ese DID`)
};

const fr_developerportal_integrationguide_consent_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand il est prêt, votre backend émet des identifiants à ce DID`)
};

const ar_developerportal_integrationguide_consent_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عند الاستعداد، يصدر خادمك الخلفي بيانات الاعتماد إلى ذلك DID`)
};

/**
* | output |
* | --- |
* | "When ready, your backend issues credentials to that DID" |
*
* @param {Developerportal_Integrationguide_Consent_Flowstep53Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_flowstep53 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Flowstep53Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Flowstep53Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_flowstep53(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_flowstep53(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_flowstep53(inputs)
	return ar_developerportal_integrationguide_consent_flowstep53(inputs)
});
export { developerportal_integrationguide_consent_flowstep53 as "developerPortal.integrationGuide.consent.flowStep5" }