/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs */

const en_developerportal_onboarding_templatebuilder_csvcoursesfound4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} courses found`)
};

const es_developerportal_onboarding_templatebuilder_csvcoursesfound4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} cursos encontrados`)
};

const fr_developerportal_onboarding_templatebuilder_csvcoursesfound4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} cours trouvés`)
};

const ar_developerportal_onboarding_templatebuilder_csvcoursesfound4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم العثور على ${i?.count} دورة`)
};

/**
* | output |
* | --- |
* | "{count} courses found" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcoursesfound4 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcoursesfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcoursesfound4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcoursesfound4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcoursesfound4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcoursesfound4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcoursesfound4 as "developerPortal.onboarding.templateBuilder.csvCoursesFound" }