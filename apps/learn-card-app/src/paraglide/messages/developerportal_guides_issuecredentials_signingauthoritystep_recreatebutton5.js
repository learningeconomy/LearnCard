/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreate Signing Authority`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recrear Autoridad de Firma`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recréer l'Autorité de Signature`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إنشاء سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Recreate Signing Authority" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatebutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_recreatebutton5 as "developerPortal.guides.issueCredentials.signingAuthorityStep.recreateButton" }