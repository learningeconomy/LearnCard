/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No new credentials detected. Make sure you ran your code.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se detectaron nuevas credenciales. Asegúrate de haber ejecutado tu código.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun nouveau certificat détecté. Assurez-vous d'avoir exécuté votre code.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم اكتشاف مؤهلات جديدة. تأكد من تشغيل الكود الخاص بك.`)
};

/**
* | output |
* | --- |
* | "No new credentials detected. Make sure you ran your code." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckfailed6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialcheckfailed6 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialCheckFailed" }