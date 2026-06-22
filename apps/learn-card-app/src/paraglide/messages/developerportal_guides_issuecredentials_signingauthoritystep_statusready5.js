/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority configured`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de firma configurada`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de signature configurée`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_statusready5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Signing authority configured" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_statusready5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusready5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_statusready5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_statusready5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_statusready5(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_statusready5(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_statusready5 as "developerPortal.guides.issueCredentials.signingAuthorityStep.statusReady" }