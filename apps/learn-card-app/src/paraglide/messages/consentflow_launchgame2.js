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

const de_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spiel starten`)
};

const ar_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدء اللعبة`)
};

const fr_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer le jeu`)
};

const ko_consentflow_launchgame2 = /** @type {(inputs: Consentflow_Launchgame2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게임 시작`)
};

/**
* | output |
* | --- |
* | "Launch Game" |
*
* @param {Consentflow_Launchgame2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_launchgame2 = /** @type {((inputs?: Consentflow_Launchgame2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Launchgame2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_launchgame2(inputs)
	if (locale === "es") return es_consentflow_launchgame2(inputs)
	if (locale === "de") return de_consentflow_launchgame2(inputs)
	if (locale === "ar") return ar_consentflow_launchgame2(inputs)
	if (locale === "fr") return fr_consentflow_launchgame2(inputs)
	return ko_consentflow_launchgame2(inputs)
});
export { consentflow_launchgame2 as "consentFlow.launchGame" }