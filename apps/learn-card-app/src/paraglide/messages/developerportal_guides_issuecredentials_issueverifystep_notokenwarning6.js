/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an API token above to enable verification.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un token de API arriba para habilitar la verificación.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un jeton API ci-dessus pour activer la vérification.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر رمز API أعلاه لتمكين التحقق.`)
};

/**
* | output |
* | --- |
* | "Select an API token above to enable verification." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Notokenwarning6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_notokenwarning6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_notokenwarning6 as "developerPortal.guides.issueCredentials.issueVerifyStep.noTokenWarning" }