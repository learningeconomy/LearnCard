/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Loadingnamearia2Inputs */

const en_claim_modal_loadingnamearia2 = /** @type {(inputs: Claim_Modal_Loadingnamearia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading credential name`)
};

const es_claim_modal_loadingnamearia2 = /** @type {(inputs: Claim_Modal_Loadingnamearia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando el nombre de la credencial`)
};

const fr_claim_modal_loadingnamearia2 = /** @type {(inputs: Claim_Modal_Loadingnamearia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du nom du justificatif`)
};

const ar_claim_modal_loadingnamearia2 = /** @type {(inputs: Claim_Modal_Loadingnamearia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل اسم بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Loading credential name" |
*
* @param {Claim_Modal_Loadingnamearia2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_loadingnamearia2 = /** @type {((inputs?: Claim_Modal_Loadingnamearia2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Loadingnamearia2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_loadingnamearia2(inputs)
	if (locale === "es") return es_claim_modal_loadingnamearia2(inputs)
	if (locale === "fr") return fr_claim_modal_loadingnamearia2(inputs)
	return ar_claim_modal_loadingnamearia2(inputs)
});
export { claim_modal_loadingnamearia2 as "claim.modal.loadingNameAria" }