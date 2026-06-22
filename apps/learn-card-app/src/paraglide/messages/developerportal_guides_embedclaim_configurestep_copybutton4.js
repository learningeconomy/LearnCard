/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs */

const en_developerportal_guides_embedclaim_configurestep_copybutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy`)
};

const es_developerportal_guides_embedclaim_configurestep_copybutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar`)
};

const fr_developerportal_guides_embedclaim_configurestep_copybutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier`)
};

const ar_developerportal_guides_embedclaim_configurestep_copybutton4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ`)
};

/**
* | output |
* | --- |
* | "Copy" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_copybutton4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Copybutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_copybutton4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_copybutton4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_copybutton4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_copybutton4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_copybutton4 as "developerPortal.guides.embedClaim.configureStep.copyButton" }