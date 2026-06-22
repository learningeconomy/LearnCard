/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Using: ${i?.name}`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Usando: ${i?.name}`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Utilisation : ${i?.name}`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`باستخدام: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Using: {name}" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statusreadyhint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_statusreadyhint6 as "developerPortal.guides.issueCredentials.signingAuthorityStep.statusReadyHint" }