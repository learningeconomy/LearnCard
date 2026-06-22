/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_edit4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_edit4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_edit4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_edit4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_edit4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Edit4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_edit4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_edit4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_edit4(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_edit4(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_edit4 as "developerPortal.guides.embedApp.issueCredentialsSetup.edit" }