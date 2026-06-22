/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs */

const en_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a project from the header dropdown first.`)
};

const es_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona primero un proyecto del menú desplegable.`)
};

const fr_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez d'abord un projet dans le menu déroulant.`)
};

const ar_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a project from the header dropdown first.`)
};

/**
* | output |
* | --- |
* | "Select a project from the header dropdown first." |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Selectprojectfirst5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_selectprojectfirst5(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_selectprojectfirst5 as "developerPortal.guides.embedApp.gettingStarted.selectProjectFirst" }