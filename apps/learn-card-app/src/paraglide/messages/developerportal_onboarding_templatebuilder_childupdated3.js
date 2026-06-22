/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs */

const en_developerportal_onboarding_templatebuilder_childupdated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Child template updated`)
};

const es_developerportal_onboarding_templatebuilder_childupdated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla hija actualizada`)
};

const fr_developerportal_onboarding_templatebuilder_childupdated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle enfant mis à jour`)
};

const ar_developerportal_onboarding_templatebuilder_childupdated3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث القالب الفرعي`)
};

/**
* | output |
* | --- |
* | "Child template updated" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_childupdated3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Childupdated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_childupdated3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_childupdated3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_childupdated3(inputs)
	return ar_developerportal_onboarding_templatebuilder_childupdated3(inputs)
});
export { developerportal_onboarding_templatebuilder_childupdated3 as "developerPortal.onboarding.templateBuilder.childUpdated" }