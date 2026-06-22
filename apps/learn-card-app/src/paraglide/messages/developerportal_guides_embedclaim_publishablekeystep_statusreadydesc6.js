/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your publishable key is ready to use`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu clave pública está lista para usar`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre clé publique est prête à être utilisée`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاحك العام جاهز للاستخدام`)
};

/**
* | output |
* | --- |
* | "Your publishable key is ready to use" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Statusreadydesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_statusreadydesc6 as "developerPortal.guides.embedClaim.publishableKeyStep.statusReadyDesc" }