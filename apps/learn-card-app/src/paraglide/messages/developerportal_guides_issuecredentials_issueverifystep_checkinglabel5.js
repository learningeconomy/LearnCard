/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking for new credentials...`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando nuevas credenciales...`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification des nouveaux certificats…`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق من المؤهلات الجديدة…`)
};

/**
* | output |
* | --- |
* | "Checking for new credentials..." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Checkinglabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_checkinglabel5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_checkinglabel5 as "developerPortal.guides.issueCredentials.issueVerifyStep.checkingLabel" }