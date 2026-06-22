/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows anyone to verify credentials you issue`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que cualquiera verifique las credenciales que emites`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permet à quiconque de vérifier les certificats que vous émettez`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يسمح لأي شخص بالتحقق من المؤهلات التي تصدرها`)
};

/**
* | output |
* | --- |
* | "Allows anyone to verify credentials you issue" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem35(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_infoitem35 as "developerPortal.guides.issueCredentials.signingAuthorityStep.infoItem3" }