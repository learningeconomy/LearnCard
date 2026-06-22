/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No signing authority found`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró autoridad de firma`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorité de signature trouvée`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "No signing authority found" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarning5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_statuswarning5 as "developerPortal.guides.issueCredentials.signingAuthorityStep.statusWarning" }