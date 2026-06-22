/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs */

const en_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save or cancel the template you're editing before continuing.`)
};

const es_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda o cancela la plantilla que estás editando antes de continuar.`)
};

const fr_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrez ou annulez le modèle que vous modifiez avant de continuer.`)
};

const ar_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظ أو ألغ القالب الذي تقوم بتحريره قبل المتابعة.`)
};

/**
* | output |
* | --- |
* | "Save or cancel the template you're editing before continuing." |
*
* @param {Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Createtemplatesstep_Builderopenwarning6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6(inputs)
	return ar_developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6(inputs)
});
export { developerportal_guides_issuecredentials_createtemplatesstep_builderopenwarning6 as "developerPortal.guides.issueCredentials.createTemplatesStep.builderOpenWarning" }