/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app in Step 1 to create credential templates.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app in Step 1 to create credential templates.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app in Step 1 to create credential templates.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app in Step 1 to create credential templates.`)
};

/**
* | output |
* | --- |
* | "Select an app in Step 1 to create credential templates." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Selectapptocreate7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_selectapptocreate7 as "developerPortal.guides.embedApp.issueCredentialsSetup.selectAppToCreate" }