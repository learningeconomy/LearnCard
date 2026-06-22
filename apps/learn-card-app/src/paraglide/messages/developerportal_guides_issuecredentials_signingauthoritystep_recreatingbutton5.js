/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreating...`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreando...`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recréation…`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إعادة الإنشاء…`)
};

/**
* | output |
* | --- |
* | "Recreating..." |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Recreatingbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_recreatingbutton5 as "developerPortal.guides.issueCredentials.signingAuthorityStep.recreatingButton" }