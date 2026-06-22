/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates found.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron plantillas.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle trouvé.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على قوالب.`)
};

/**
* | output |
* | --- |
* | "No templates found." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Notemplatesfound6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_notemplatesfound6 as "developerPortal.guides.issueCredentials.issueVerifyStep.noTemplatesFound" }