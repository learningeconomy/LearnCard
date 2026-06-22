/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown>, context: NonNullable<unknown>, count: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs */

const en_developerportal_guides_embedapp_templatemanager_variables3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} variables`);
	return /** @type {LocalizedString} */ (`${i?.n} variable`)
	
};

const es_developerportal_guides_embedapp_templatemanager_variables3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} variables`);
	return /** @type {LocalizedString} */ (`${i?.n} variable`)
	
};

const fr_developerportal_guides_embedapp_templatemanager_variables3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} variables`);
	return /** @type {LocalizedString} */ (`${i?.n} variable`)
	
};

const ar_developerportal_guides_embedapp_templatemanager_variables3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} variables`);
	return /** @type {LocalizedString} */ (`${i?.n} variable`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "{count} variables" |
* | * | "{n} variable" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_variables3 = /** @type {((inputs: Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Variables3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_variables3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_variables3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_variables3(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_variables3(inputs)
});
export { developerportal_guides_embedapp_templatemanager_variables3 as "developerPortal.guides.embedApp.templateManager.variables" }