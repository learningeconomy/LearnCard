/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs */

const en_developerportal_onboarding_datamapping_webhookurldesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure this URL in your external system to receive course completion events.`)
};

const es_developerportal_onboarding_datamapping_webhookurldesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura esta URL en tu sistema externo para recibir eventos de finalización de cursos.`)
};

const fr_developerportal_onboarding_datamapping_webhookurldesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez cette URL dans votre système externe pour recevoir les événements d'achèvement de cours.`)
};

const ar_developerportal_onboarding_datamapping_webhookurldesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتكوين هذا العنوان في نظامك الخارجي لاستقبال أحداث إكمال الدورة.`)
};

/**
* | output |
* | --- |
* | "Configure this URL in your external system to receive course completion events." |
*
* @param {Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_webhookurldesc4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Webhookurldesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_webhookurldesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_webhookurldesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_webhookurldesc4(inputs)
	return ar_developerportal_onboarding_datamapping_webhookurldesc4(inputs)
});
export { developerportal_onboarding_datamapping_webhookurldesc4 as "developerPortal.onboarding.dataMapping.webhookUrlDesc" }