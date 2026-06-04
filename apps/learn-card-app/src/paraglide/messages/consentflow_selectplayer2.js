/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Selectplayer2Inputs */

const en_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Player`)
};

const es_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar jugador`)
};

const de_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spieler auswählen`)
};

const ar_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار اللاعب`)
};

const fr_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un joueur`)
};

const ko_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`플레이어 선택`)
};

/**
* | output |
* | --- |
* | "Select Player" |
*
* @param {Consentflow_Selectplayer2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_selectplayer2 = /** @type {((inputs?: Consentflow_Selectplayer2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Selectplayer2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_selectplayer2(inputs)
	if (locale === "es") return es_consentflow_selectplayer2(inputs)
	if (locale === "de") return de_consentflow_selectplayer2(inputs)
	if (locale === "ar") return ar_consentflow_selectplayer2(inputs)
	if (locale === "fr") return fr_consentflow_selectplayer2(inputs)
	return ko_consentflow_selectplayer2(inputs)
});
export { consentflow_selectplayer2 as "consentFlow.selectPlayer" }