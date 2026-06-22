/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Loadingcredential1Inputs */

const en_claim_modal_loadingcredential1 = /** @type {(inputs: Claim_Modal_Loadingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading credential...`)
};

const es_claim_modal_loadingcredential1 = /** @type {(inputs: Claim_Modal_Loadingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando credencial...`)
};

const fr_claim_modal_loadingcredential1 = /** @type {(inputs: Claim_Modal_Loadingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du justificatif...`)
};

const ar_claim_modal_loadingcredential1 = /** @type {(inputs: Claim_Modal_Loadingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل بيانات الاعتماد...`)
};

/**
* | output |
* | --- |
* | "Loading credential..." |
*
* @param {Claim_Modal_Loadingcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_loadingcredential1 = /** @type {((inputs?: Claim_Modal_Loadingcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Loadingcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_loadingcredential1(inputs)
	if (locale === "es") return es_claim_modal_loadingcredential1(inputs)
	if (locale === "fr") return fr_claim_modal_loadingcredential1(inputs)
	return ar_claim_modal_loadingcredential1(inputs)
});
export { claim_modal_loadingcredential1 as "claim.modal.loadingCredential" }