/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs */

const en_developerportal_guides_issuecredentials_steps_createtemplates3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Templates`)
};

const es_developerportal_guides_issuecredentials_steps_createtemplates3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Plantillas`)
};

const fr_developerportal_guides_issuecredentials_steps_createtemplates3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des Modèles`)
};

const ar_developerportal_guides_issuecredentials_steps_createtemplates3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء قوالب`)
};

/**
* | output |
* | --- |
* | "Create Templates" |
*
* @param {Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_steps_createtemplates3 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Steps_Createtemplates3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_steps_createtemplates3(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_steps_createtemplates3(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_steps_createtemplates3(inputs)
	return ar_developerportal_guides_issuecredentials_steps_createtemplates3(inputs)
});
export { developerportal_guides_issuecredentials_steps_createtemplates3 as "developerPortal.guides.issueCredentials.steps.createTemplates" }