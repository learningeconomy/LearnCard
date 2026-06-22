/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Launchgame2Inputs */

const en_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Game`)
};

const es_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar juego`)
};

const fr_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer le jeu`)
};

const ar_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدء اللعبة`)
};

/**
* | output |
* | --- |
* | "Launch Game" |
*
* @param {Consentflow_Launchgame2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_launchgame2 = /** @type {((inputs?: Consentflow_Launchgame2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Launchgame2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_launchgame2(inputs)
	if (locale === "es") return es_consentflow_launchgame2(inputs)
	if (locale === "fr") return fr_consentflow_launchgame2(inputs)
	return ar_consentflow_launchgame2(inputs)
});
export { consentflow_launchgame2 as "consentFlow.launchGame" }