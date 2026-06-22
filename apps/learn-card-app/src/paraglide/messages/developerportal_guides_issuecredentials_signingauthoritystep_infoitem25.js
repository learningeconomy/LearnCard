/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registers the key with LearnCard's verification network`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registra la clave con la red de verificación de LearnCard`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistre la clé auprès du réseau de vérification de LearnCard`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يسجل المفتاح مع شبكة التحقق من LearnCard`)
};

/**
* | output |
* | --- |
* | "Registers the key with LearnCard's verification network" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Infoitem25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_infoitem25(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_infoitem25 as "developerPortal.guides.issueCredentials.signingAuthorityStep.infoItem2" }