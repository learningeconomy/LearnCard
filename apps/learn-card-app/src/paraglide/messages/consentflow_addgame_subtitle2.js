/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Addgame_Subtitle2Inputs */

const en_consentflow_addgame_subtitle2 = /** @type {(inputs: Consentflow_Addgame_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect your account`)
};

const es_consentflow_addgame_subtitle2 = /** @type {(inputs: Consentflow_Addgame_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conecta tu cuenta`)
};

const fr_consentflow_addgame_subtitle2 = /** @type {(inputs: Consentflow_Addgame_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez votre compte`)
};

const ar_consentflow_addgame_subtitle2 = /** @type {(inputs: Consentflow_Addgame_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط حسابك`)
};

/**
* | output |
* | --- |
* | "Connect your account" |
*
* @param {Consentflow_Addgame_Subtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_addgame_subtitle2 = /** @type {((inputs?: Consentflow_Addgame_Subtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Addgame_Subtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_addgame_subtitle2(inputs)
	if (locale === "es") return es_consentflow_addgame_subtitle2(inputs)
	if (locale === "fr") return fr_consentflow_addgame_subtitle2(inputs)
	return ar_consentflow_addgame_subtitle2(inputs)
});
export { consentflow_addgame_subtitle2 as "consentFlow.addGame.subtitle" }