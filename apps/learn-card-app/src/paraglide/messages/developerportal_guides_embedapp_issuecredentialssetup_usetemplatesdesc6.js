/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates for your app. Users claim them with a single tap.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear credential templates for your app. Users claim them with a single tap.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates for your app. Users claim them with a single tap.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء credential templates for your app. Users claim them with a single tap.`)
};

/**
* | output |
* | --- |
* | "Create credential templates for your app. Users claim them with a single tap." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_usetemplatesdesc6 as "developerPortal.guides.embedApp.issueCredentialsSetup.useTemplatesDesc" }