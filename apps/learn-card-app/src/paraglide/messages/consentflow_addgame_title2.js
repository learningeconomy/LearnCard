/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Addgame_Title2Inputs */

const en_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Game`)
};

const es_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar juego`)
};

const de_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spiel hinzufügen`)
};

const ar_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة لعبة`)
};

const fr_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un jeu`)
};

const ko_consentflow_addgame_title2 = /** @type {(inputs: Consentflow_Addgame_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게임 추가`)
};

/**
* | output |
* | --- |
* | "Add Game" |
*
* @param {Consentflow_Addgame_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_addgame_title2 = /** @type {((inputs?: Consentflow_Addgame_Title2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Addgame_Title2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_addgame_title2(inputs)
	if (locale === "es") return es_consentflow_addgame_title2(inputs)
	if (locale === "de") return de_consentflow_addgame_title2(inputs)
	if (locale === "ar") return ar_consentflow_addgame_title2(inputs)
	if (locale === "fr") return fr_consentflow_addgame_title2(inputs)
	return ko_consentflow_addgame_title2(inputs)
});
export { consentflow_addgame_title2 as "consentFlow.addGame.title" }