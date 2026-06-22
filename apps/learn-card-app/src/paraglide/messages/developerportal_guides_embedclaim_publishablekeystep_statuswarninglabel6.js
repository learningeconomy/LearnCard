/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No project selected`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ningún proyecto seleccionado`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun projet sélectionné`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تحديد مشروع`)
};

/**
* | output |
* | --- |
* | "No project selected" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarninglabel6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_statuswarninglabel6 as "developerPortal.guides.embedClaim.publishableKeyStep.statusWarningLabel" }