/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Createtoselectplayer3Inputs */

const en_family_createtoselectplayer3 = /** @type {(inputs: Family_Createtoselectplayer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a family to select a player.`)
};

const es_family_createtoselectplayer3 = /** @type {(inputs: Family_Createtoselectplayer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una familia para seleccionar un jugador.`)
};

const fr_family_createtoselectplayer3 = /** @type {(inputs: Family_Createtoselectplayer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez une famille pour sélectionner un joueur.`)
};

const ar_family_createtoselectplayer3 = /** @type {(inputs: Family_Createtoselectplayer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ عائلة لاختيار لاعب.`)
};

/**
* | output |
* | --- |
* | "Create a family to select a player." |
*
* @param {Family_Createtoselectplayer3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_createtoselectplayer3 = /** @type {((inputs?: Family_Createtoselectplayer3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Createtoselectplayer3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_createtoselectplayer3(inputs)
	if (locale === "es") return es_family_createtoselectplayer3(inputs)
	if (locale === "fr") return fr_family_createtoselectplayer3(inputs)
	return ar_family_createtoselectplayer3(inputs)
});
export { family_createtoselectplayer3 as "family.createToSelectPlayer" }