/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs */

const en_developerportal_onboarding_templatebuilder_failedupdate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update template`)
};

const es_developerportal_onboarding_templatebuilder_failedupdate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar la plantilla`)
};

const fr_developerportal_onboarding_templatebuilder_failedupdate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour du modèle`)
};

const ar_developerportal_onboarding_templatebuilder_failedupdate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحديث القالب`)
};

/**
* | output |
* | --- |
* | "Failed to update template" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_failedupdate3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Failedupdate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_failedupdate3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_failedupdate3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_failedupdate3(inputs)
	return ar_developerportal_onboarding_templatebuilder_failedupdate3(inputs)
});
export { developerportal_onboarding_templatebuilder_failedupdate3 as "developerPortal.onboarding.templateBuilder.failedUpdate" }