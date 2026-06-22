/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Description3Inputs */

const en_developerportal_components_launchtypestep_description3 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how your app will integrate with the LearnCard wallet`)
};

const es_developerportal_components_launchtypestep_description3 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo se integrará tu aplicación con la billetera de LearnCard`)
};

const fr_developerportal_components_launchtypestep_description3 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment votre application s'intégrera au portefeuille LearnCard`)
};

const ar_developerportal_components_launchtypestep_description3 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر كيف سيتكامل تطبيقك مع محفظة LearnCard`)
};

/**
* | output |
* | --- |
* | "Choose how your app will integrate with the LearnCard wallet" |
*
* @param {Developerportal_Components_Launchtypestep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_description3 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_description3(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_description3(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_description3(inputs)
	return ar_developerportal_components_launchtypestep_description3(inputs)
});
export { developerportal_components_launchtypestep_description3 as "developerPortal.components.launchTypeStep.description" }