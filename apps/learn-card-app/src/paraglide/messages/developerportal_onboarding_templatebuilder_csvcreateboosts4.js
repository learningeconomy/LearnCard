/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs */

const en_developerportal_onboarding_templatebuilder_csvcreateboosts4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Create ${i?.count} Boosts`)
};

const es_developerportal_onboarding_templatebuilder_csvcreateboosts4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crear ${i?.count} Boosts`)
};

const fr_developerportal_onboarding_templatebuilder_csvcreateboosts4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créer ${i?.count} Boosts`)
};

const ar_developerportal_onboarding_templatebuilder_csvcreateboosts4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إنشاء ${i?.count} معززات`)
};

/**
* | output |
* | --- |
* | "Create {count} Boosts" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcreateboosts4 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcreateboosts4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcreateboosts4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcreateboosts4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcreateboosts4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcreateboosts4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcreateboosts4 as "developerPortal.onboarding.templateBuilder.csvCreateBoosts" }