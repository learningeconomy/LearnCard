/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Flowsummary3Inputs */

const en_developerportal_integrationguide_common_flowsummary3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Flowsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flow Summary`)
};

const es_developerportal_integrationguide_common_flowsummary3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Flowsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen del Flujo`)
};

const fr_developerportal_integrationguide_common_flowsummary3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Flowsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé du Flux`)
};

const ar_developerportal_integrationguide_common_flowsummary3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Flowsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص التدفق`)
};

/**
* | output |
* | --- |
* | "Flow Summary" |
*
* @param {Developerportal_Integrationguide_Common_Flowsummary3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_flowsummary3 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Flowsummary3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Flowsummary3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_flowsummary3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_flowsummary3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_flowsummary3(inputs)
	return ar_developerportal_integrationguide_common_flowsummary3(inputs)
});
export { developerportal_integrationguide_common_flowsummary3 as "developerPortal.integrationGuide.common.flowSummary" }