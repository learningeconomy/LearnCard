/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Up Signing Authority`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar Autoridad de Firma`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer l'Autorité de Signature`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_title4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Set Up Signing Authority" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_title4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_title4(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_title4(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_title4 as "developerPortal.guides.issueCredentials.signingAuthorityStep.title" }