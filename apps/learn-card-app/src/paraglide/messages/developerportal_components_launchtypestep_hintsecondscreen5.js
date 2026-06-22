/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs */

const en_developerportal_components_launchtypestep_hintsecondscreen5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide the URL that opens in a new window alongside the wallet.`)
};

const es_developerportal_components_launchtypestep_hintsecondscreen5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide the URL that opens in a new window alongside the wallet.`)
};

const fr_developerportal_components_launchtypestep_hintsecondscreen5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide the URL that opens in a new window alongside the wallet.`)
};

const ar_developerportal_components_launchtypestep_hintsecondscreen5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide the URL that opens in a new window alongside the wallet.`)
};

/**
* | output |
* | --- |
* | "You'll provide the URL that opens in a new window alongside the wallet." |
*
* @param {Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintsecondscreen5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintsecondscreen5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintsecondscreen5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintsecondscreen5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintsecondscreen5(inputs)
	return ar_developerportal_components_launchtypestep_hintsecondscreen5(inputs)
});
export { developerportal_components_launchtypestep_hintsecondscreen5 as "developerPortal.components.launchTypeStep.hintSecondScreen" }