/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Signing Authority`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Autoridad de Firma`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Autorité de Signature`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "Create Signing Authority" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Createbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_createbutton5(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_createbutton5 as "developerPortal.guides.issueCredentials.signingAuthorityStep.createButton" }