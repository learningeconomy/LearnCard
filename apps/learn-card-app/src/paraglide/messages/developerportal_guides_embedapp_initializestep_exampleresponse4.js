/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs */

const en_developerportal_guides_embedapp_initializestep_exampleresponse4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example Response`)
};

const es_developerportal_guides_embedapp_initializestep_exampleresponse4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplo Response`)
};

const fr_developerportal_guides_embedapp_initializestep_exampleresponse4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exemple Response`)
};

const ar_developerportal_guides_embedapp_initializestep_exampleresponse4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال Response`)
};

/**
* | output |
* | --- |
* | "Example Response" |
*
* @param {Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_initializestep_exampleresponse4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Initializestep_Exampleresponse4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_initializestep_exampleresponse4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_initializestep_exampleresponse4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_initializestep_exampleresponse4(inputs)
	return ar_developerportal_guides_embedapp_initializestep_exampleresponse4(inputs)
});
export { developerportal_guides_embedapp_initializestep_exampleresponse4 as "developerPortal.guides.embedApp.initializeStep.exampleResponse" }