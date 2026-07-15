/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Claiming1Inputs */

const en_claimboost_claiming1 = /** @type {(inputs: Claimboost_Claiming1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claiming...`)
};

const es_claimboost_claiming1 = /** @type {(inputs: Claimboost_Claiming1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamando...`)
};

const fr_claimboost_claiming1 = /** @type {(inputs: Claimboost_Claiming1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamation en cours...`)
};

const ar_claimboost_claiming1 = /** @type {(inputs: Claimboost_Claiming1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claiming...`)
};

/**
* | output |
* | --- |
* | "Claiming..." |
*
* @param {Claimboost_Claiming1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_claiming1 = /** @type {((inputs?: Claimboost_Claiming1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claimboost_Claiming1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claimboost_claiming1(inputs)
	if (locale === "es") return es_claimboost_claiming1(inputs)
	if (locale === "fr") return fr_claimboost_claiming1(inputs)
	return ar_claimboost_claiming1(inputs)
});
export { claimboost_claiming1 as "claimBoost.claiming" }