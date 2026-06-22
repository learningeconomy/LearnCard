/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs */

const en_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`These values come from your CSV`)
};

const es_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estos valores provienen de tu CSV`)
};

const fr_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ces valeurs proviennent de votre CSV`)
};

const ar_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأتي هذه القيم من ملف CSV الخاص بك`)
};

/**
* | output |
* | --- |
* | "These values come from your CSV" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcatalogfieldsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcatalogfieldsdesc5 as "developerPortal.onboarding.templateBuilder.csvCatalogFieldsDesc" }