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

const fr_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un joueur`)
};

const ar_consentflow_selectplayer2 = /** @type {(inputs: Consentflow_Selectplayer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار اللاعب`)
};

/**
* | output |
* | --- |
* | "Select Player" |
*
* @param {Consentflow_Selectplayer2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_selectplayer2 = /** @type {((inputs?: Consentflow_Selectplayer2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Selectplayer2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_selectplayer2(inputs)
	if (locale === "es") return es_consentflow_selectplayer2(inputs)
	if (locale === "fr") return fr_consentflow_selectplayer2(inputs)
	return ar_consentflow_selectplayer2(inputs)
});
export { consentflow_selectplayer2 as "consentFlow.selectPlayer" }