/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go back to create one`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regresa para crear una`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenez en arrière pour en créer un`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عد للخلف لإنشاء واحد`)
};

/**
* | output |
* | --- |
* | "Go back to create one" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Gobacktocreate7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_gobacktocreate7 as "developerPortal.guides.issueCredentials.issueVerifyStep.goBackToCreate" }