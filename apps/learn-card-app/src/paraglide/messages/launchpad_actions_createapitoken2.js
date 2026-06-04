/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createapitoken2Inputs */

const en_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create API Token`)
};

const es_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear token de API`)
};

const de_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API-Token erstellen`)
};

const ar_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رمز API`)
};

const fr_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un jeton API`)
};

const ko_launchpad_actions_createapitoken2 = /** @type {(inputs: Launchpad_Actions_Createapitoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API 토큰 만들기`)
};

/**
* | output |
* | --- |
* | "Create API Token" |
*
* @param {Launchpad_Actions_Createapitoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createapitoken2 = /** @type {((inputs?: Launchpad_Actions_Createapitoken2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createapitoken2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createapitoken2(inputs)
	if (locale === "es") return es_launchpad_actions_createapitoken2(inputs)
	if (locale === "de") return de_launchpad_actions_createapitoken2(inputs)
	if (locale === "ar") return ar_launchpad_actions_createapitoken2(inputs)
	if (locale === "fr") return fr_launchpad_actions_createapitoken2(inputs)
	return ko_launchpad_actions_createapitoken2(inputs)
});
export { launchpad_actions_createapitoken2 as "launchpad.actions.createApiToken" }