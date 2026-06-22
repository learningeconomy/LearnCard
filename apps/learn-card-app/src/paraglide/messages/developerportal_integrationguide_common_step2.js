/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Step2Inputs */

const en_developerportal_integrationguide_common_step2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Step2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step`)
};

const es_developerportal_integrationguide_common_step2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Step2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paso`)
};

const fr_developerportal_integrationguide_common_step2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Step2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape`)
};

const ar_developerportal_integrationguide_common_step2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Step2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة`)
};

/**
* | output |
* | --- |
* | "Step" |
*
* @param {Developerportal_Integrationguide_Common_Step2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_step2 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Step2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_step2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_step2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_step2(inputs)
	return ar_developerportal_integrationguide_common_step2(inputs)
});
export { developerportal_integrationguide_common_step2 as "developerPortal.integrationGuide.common.step" }