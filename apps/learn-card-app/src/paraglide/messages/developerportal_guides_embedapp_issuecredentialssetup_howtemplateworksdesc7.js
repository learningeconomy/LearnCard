/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates here, and we'll automatically generate a templateAlias for each one. Then use sendCredential in your app to issue credentials.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear credential templates here, and we'll automatically generate a templateAlias for each one. Then use sendCredential in your app to issue credentials.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates here, and we'll automatically generate a templateAlias for each one. Then use sendCredential in your app to issue credentials.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء credential templates here, and we'll automatically generate a templateAlias for each one. Then use sendCredential in your app to issue credentials.`)
};

/**
* | output |
* | --- |
* | "Create credential templates here, and we'll automatically generate a templateAlias for each one. Then use sendCredential in your app to issue credentials." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworksdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_howtemplateworksdesc7 as "developerPortal.guides.embedApp.issueCredentialsSetup.howTemplateWorksDesc" }