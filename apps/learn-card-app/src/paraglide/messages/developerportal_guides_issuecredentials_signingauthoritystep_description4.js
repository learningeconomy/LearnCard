/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority cryptographically signs your credentials, making them verifiable. This proves the credentials actually came from you.`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una autoridad de firma firma criptográficamente tus credenciales, haciéndolas verificables. Esto demuestra que las credenciales realmente vinieron de ti.`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une autorité de signature signe cryptographiquement vos certificats, les rendant vérifiables. Cela prouve que les certificats proviennent bien de vous.`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقوم سلطة التوقيع بتوقيع مؤهلاتك تشفيرياً، مما يجعلها قابلة للتحقق. هذا يثبت أن المؤهلات صدرت منك بالفعل.`)
};

/**
* | output |
* | --- |
* | "A signing authority cryptographically signs your credentials, making them verifiable. This proves the credentials actually came from you." |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_description4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_description4(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_description4(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_description4 as "developerPortal.guides.issueCredentials.signingAuthorityStep.description" }