/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Gameaccess_Title2Inputs */

const en_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Game Access`)
};

const es_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso al juego`)
};

const de_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spielzugang`)
};

const ar_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصول إلى اللعبة`)
};

const fr_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès au jeu`)
};

const ko_consentflow_gameaccess_title2 = /** @type {(inputs: Consentflow_Gameaccess_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게임 액세스`)
};

/**
* | output |
* | --- |
* | "Game Access" |
*
* @param {Consentflow_Gameaccess_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_gameaccess_title2 = /** @type {((inputs?: Consentflow_Gameaccess_Title2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Gameaccess_Title2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_gameaccess_title2(inputs)
	if (locale === "es") return es_consentflow_gameaccess_title2(inputs)
	if (locale === "de") return de_consentflow_gameaccess_title2(inputs)
	if (locale === "ar") return ar_consentflow_gameaccess_title2(inputs)
	if (locale === "fr") return fr_consentflow_gameaccess_title2(inputs)
	return ko_consentflow_gameaccess_title2(inputs)
});
export { consentflow_gameaccess_title2 as "consentFlow.gameAccess.title" }