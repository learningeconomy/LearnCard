/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_checkbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check for Sent Credentials`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_checkbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Credenciales Enviadas`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_checkbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier les Certificats Envoyés`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_checkbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من المؤهلات المرسلة`)
};

/**
* | output |
* | --- |
* | "Check for Sent Credentials" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_checkbutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Checkbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_checkbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_checkbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_checkbutton5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_checkbutton5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_checkbutton5 as "developerPortal.guides.issueCredentials.issueVerifyStep.checkButton" }