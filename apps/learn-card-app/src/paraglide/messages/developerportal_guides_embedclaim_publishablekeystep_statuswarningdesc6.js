/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a project from the header dropdown`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un proyecto del menú desplegable en el encabezado`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un projet dans le menu déroulant de l'en-tête`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً من القائمة المنسدلة في الرأس`)
};

/**
* | output |
* | --- |
* | "Select a project from the header dropdown" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Statuswarningdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_statuswarningdesc6 as "developerPortal.guides.embedClaim.publishableKeyStep.statusWarningDesc" }