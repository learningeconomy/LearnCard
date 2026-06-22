/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Fetchingcredential1Inputs */

const en_claim_fetchingcredential1 = /** @type {(inputs: Claim_Fetchingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fetching Credential`)
};

const es_claim_fetchingcredential1 = /** @type {(inputs: Claim_Fetchingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obteniendo credencial`)
};

const fr_claim_fetchingcredential1 = /** @type {(inputs: Claim_Fetchingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération du justificatif`)
};

const ar_claim_fetchingcredential1 = /** @type {(inputs: Claim_Fetchingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ جلب بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Fetching Credential" |
*
* @param {Claim_Fetchingcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_fetchingcredential1 = /** @type {((inputs?: Claim_Fetchingcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Fetchingcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_fetchingcredential1(inputs)
	if (locale === "es") return es_claim_fetchingcredential1(inputs)
	if (locale === "fr") return fr_claim_fetchingcredential1(inputs)
	return ar_claim_fetchingcredential1(inputs)
});
export { claim_fetchingcredential1 as "claim.fetchingCredential" }